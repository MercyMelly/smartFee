const FeeStructure = require('../models/feeStructure');

exports.getFeeStructure = async (req, res) => {
  try {
    const { gradeLevel, boardingStatus, hasTransport, transportRoute } = req.query;

    // --- 1. Input Validation ---
    if (!gradeLevel || !boardingStatus || typeof hasTransport === 'undefined') {
      return res.status(400).json({
        message: 'Missing required query parameters: gradeLevel, boardingStatus, and hasTransport are all required.',
      });
    }

    // Normalize values
    const normalizedBoardingStatus =
      boardingStatus.charAt(0).toUpperCase() + boardingStatus.slice(1).toLowerCase();

    const parsedHasTransport = hasTransport === 'true';

    const validGradeLevels = [
      'PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3',
      'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7',
      'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
    ];

    if (!validGradeLevels.includes(gradeLevel)) {
      return res.status(400).json({
        message: `Invalid gradeLevel '${gradeLevel}'. Valid values are: ${validGradeLevels.join(', ')}`,
      });
    }

    if (!['Day', 'Boarding'].includes(normalizedBoardingStatus)) {
      return res.status(400).json({
        message: 'Invalid boardingStatus. Must be "Day" or "Boarding".',
      });
    }

    // --- 2. Query the Database ---
    const query = {
      gradeLevel,
      boardingStatus: normalizedBoardingStatus,
      hasTransport: parsedHasTransport,
    };

    const feeRecord = await FeeStructure.findOne(query).lean(); // returns plain JS object

    if (!feeRecord) {
      return res.status(404).json({
        message: 'Fee structure not found for the provided criteria.',
        searched: query,
      });
    }

    // --- 3. Transport Fee Handling ---
    let finalTotal = feeRecord.totalCalculated;
    const termlyComponents = [...feeRecord.termlyComponents]; // safe copy

    if (parsedHasTransport) {
      if (!feeRecord.transportRoutes || Object.keys(feeRecord.transportRoutes).length === 0) {
        return res.json({
          ...feeRecord,
          message: 'Transport is marked as available, but no transport routes are configured.',
        });
      }

      if (transportRoute) {
        const selectedAmount = feeRecord.transportRoutes[transportRoute.toLowerCase()];

        if (selectedAmount !== undefined) {
          termlyComponents.push({
            name: `Transport (${transportRoute})`,
            amount: selectedAmount,
          });
          finalTotal += selectedAmount;

          return res.json({
            ...feeRecord,
            termlyComponents,
            selectedTransportRoute: {
              name: transportRoute,
              amount: selectedAmount,
            },
            finalTotal,
          });
        } else {
          return res.status(400).json({
            message: `Invalid transport route '${transportRoute}'.`,
            availableRoutes: Object.keys(feeRecord.transportRoutes),
          });
        }
      } else {
        return res.json({
          ...feeRecord,
          message: 'Transport is available. Please add `?transportRoute=routeName` in the query to get full fee.',
          availableRoutes: feeRecord.transportRoutes,
        });
      }
    }

    // --- 4. Return Final Response ---
    res.json({
      ...feeRecord,
      termlyComponents,
      finalTotal,
    });

  } catch (err) {
    console.error('Fee structure fetch error:', err);
    res.status(500).json({
      message: 'Server error occurred while fetching fee structure.',
      error: err.message,
    });
  }
};
