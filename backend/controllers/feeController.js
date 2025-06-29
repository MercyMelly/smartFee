const FeeStructure = require('../models/feeStructure');

exports.getFeeStructure = async (req, res) => {
  try {
    const { gradeLevel, boardingStatus, hasTransport, transportRoute } = req.query;

    // Validate required parameters
    if (!gradeLevel || !boardingStatus || typeof hasTransport === 'undefined') {
      return res.status(400).json({
        message: 'Missing required query parameters: gradeLevel, boardingStatus, and hasTransport are all required.',
      });
    }

    // Normalize boarding status
    const normalizedBoardingStatus = boardingStatus.charAt(0).toUpperCase() + boardingStatus.slice(1).toLowerCase();
    const parsedHasTransport = hasTransport === 'true';

    // Validate grade level
    const validGradeLevels = [
      'PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3',
      'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7',
      'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'
    ];
    
    if (!validGradeLevels.includes(gradeLevel)) {
      return res.status(400).json({
        message: `Invalid gradeLevel '${gradeLevel}'. Valid values are: ${validGradeLevels.join(', ')}`,
      });
    }

    // Validate boarding status
    if (!['Day', 'Boarding'].includes(normalizedBoardingStatus)) {
      return res.status(400).json({
        message: 'Invalid boardingStatus. Must be "Day" or "Boarding".',
      });
    }

    // Build query
    const query = {
      gradeLevel,
      boardingStatus: normalizedBoardingStatus,
      hasTransport: parsedHasTransport,
    };

    // Find most recent fee structure
    const feeRecord = await FeeStructure.findOne(query)
      .sort({ createdAt: -1 })
      .lean();

    if (!feeRecord) {
      return res.status(404).json({
        message: 'Fee structure not found for the provided criteria.',
        searched: query,
      });
    }

    // Calculate final total
    let finalTotal = feeRecord.totalCalculated;
    const termlyComponents = [...feeRecord.termlyComponents];

    // Handle transport route if applicable
    if (parsedHasTransport && transportRoute) {
      const routeKey = transportRoute.toLowerCase();
      
      if (feeRecord.transportRoutes && feeRecord.transportRoutes[routeKey] !== undefined) {
        const transportAmount = feeRecord.transportRoutes[routeKey];
        termlyComponents.push({
          name: `Transport (${transportRoute})`,
          amount: transportAmount,
        });
        finalTotal += transportAmount;
      } else {
        return res.status(400).json({
          message: `Invalid transport route '${transportRoute}'.`,
          availableRoutes: feeRecord.transportRoutes ? Object.keys(feeRecord.transportRoutes) : [],
        });
      }
    }

    // Return the fee structure
    res.json({
      ...feeRecord,
      termlyComponents,
      finalTotal,
      hasTransport: parsedHasTransport,
      transportRoute: parsedHasTransport ? transportRoute : null
    });

  } catch (err) {
    console.error('Fee structure fetch error:', err);
    res.status(500).json({
      message: 'Server error occurred while fetching fee structure.',
      error: err.message,
    });
  }
};