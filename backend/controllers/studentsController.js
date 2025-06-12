// controllers/studentController.js
const Student = require('../models/studentsDB'); // Make sure this path is correct
const FeeStructure = require('../models/feeStructure'); // Make sure this path is correct

/**
 * @desc    Registers a new student.
 * Automatically sets hasTransport and transportRoute based on boardingStatus.
 * @route   POST /api/students/register
 * @access  Public (consider making it private/admin only in production)
 */
exports.registerStudent = async (req, res) => {
  const {
    fullName,
    admissionNumber,
    gradeLevel,     
    boardingStatus, 
    hasTransport,   
    transportRoute,
    parentName,
    parentPhone,
    // totalFees and balance will be calculated/managed elsewhere, not directly set on registration
  } = req.body;

  if (!fullName || !admissionNumber || !gradeLevel || !boardingStatus || !parentName || !parentPhone) {
    return res.status(400).json({ message: 'Please provide all required student details: Full Name, Admission Number, Grade Level, Boarding Status, Parent Name, Parent Phone.' });
  }

  try {
    const exists = await Student.findOne({ admissionNumber });
    if (exists) {
      return res.status(400).json({ message: 'Student with this admission number is already registered.' });
    }

    const studentHasTransport = (boardingStatus === 'Day' && hasTransport) ? true : false;
    const studentTransportRoute = (boardingStatus === 'Day' && hasTransport) ? transportRoute : '';

    const newStudent = new Student({
      fullName,
      admissionNumber,
      gradeLevel,
      boardingStatus,
      hasTransport: studentHasTransport,
      transportRoute: studentTransportRoute,
      parentName,
      parentPhone,
    });

    const savedStudent = await newStudent.save();
    res.status(201).json({ message: 'Student registered successfully', student: savedStudent });

  } catch (error) {
    console.error('Error registering student:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Gets all students.
 * @route   GET /api/students
 * @access  Public (consider making it private/admin only in production)
 */
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find({}); // Fetch all students
    res.status(200).json(students);
  } catch (error) {
    console.error('Error fetching all students:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Gets a single student by admission number.
 * @route   GET /api/students/:admissionNumber
 * @access  Public (consider making it private/admin only in production)
 */
exports.getStudentByAdmission = async (req, res) => {
  try {
    const student = await Student.findOne({ admissionNumber: req.params.admissionNumber });
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }
    res.status(200).json(student);
  } catch (error) {
    console.error('Error fetching student by admission number:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Calculates and retrieves a student's fee details based on their stored attributes
 * and the current fee structure.
 * @route   GET /api/students/:admissionNumber/fees
 * @access  Public (consider making it private/admin only in production)
 */
exports.getStudentFees = async (req, res) => {
  const { admissionNumber } = req.params;

  try {
    const student = await Student.findOne({ admissionNumber });

    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // Now, use the student's details to find their fee structure
    const query = {
      gradeLevel: student.gradeLevel,
      boardingStatus: student.boardingStatus,
      hasTransport: student.hasTransport, // This must match the structure
    };

    let feeRecord = await FeeStructure.findOne(query);

    if (!feeRecord) {
      // If no direct match, try a fallback for Day scholars without specific transport selected
      // This is helpful if a student has hasTransport: true but no route, and the backend needs to provide base fee + available routes
      if (student.boardingStatus === 'Day' && student.hasTransport && !student.transportRoute) {
        // Try to find the base day scholar fee structure to provide available routes
        feeRecord = await FeeStructure.findOne({
            gradeLevel: student.gradeLevel,
            boardingStatus: 'Day',
            hasTransport: true, // Look for the general "day with transport" structure
        });
        if (feeRecord) {
            // Found a base structure, can now provide available routes for selection
            return res.status(200).json({
                message: "Please select a transport route for this student to get the exact fee.",
                studentDetails: {
                    admissionNumber: student.admissionNumber,
                    fullName: student.fullName,
                    gradeLevel: student.gradeLevel,
                    boardingStatus: student.boardingStatus,
                    hasTransport: student.hasTransport,
                    transportRoute: student.transportRoute,
                },
                termlyComponents: feeRecord.termlyComponents,
                totalCalculated: feeRecord.totalCalculated, // This is the total WITHOUT transport yet
                finalTotal: feeRecord.totalCalculated, // For consistency, show base total
                availableRoutes: feeRecord.transportRoutes, // Provide the routes from the found structure
                notes: `Student is a Day scholar needing transport. Select a route to finalize fee. Current total is without transport.`,
            });
        }
      }
      // If no fee structure found at all, or the specific transport route wasn't found
      return res.status(404).json({
        message: 'Fee structure not found for this student\'s criteria.',
        studentDetails: {
            admissionNumber: student.admissionNumber,
            fullName: student.fullName,
            gradeLevel: student.gradeLevel,
            boardingStatus: student.boardingStatus,
            hasTransport: student.hasTransport,
            transportRoute: student.transportRoute,
        },
        queryUsed: query
      });
    }

    // If a fee record is found, calculate the final total including transport
    let feeDetails = feeRecord.toObject();
    let finalTotal = feeDetails.totalCalculated;
    let components = [...feeDetails.termlyComponents];
    let notes = '';

    // Add transport fee if applicable and a route is specified in the student record
    if (student.hasTransport && student.boardingStatus === 'Day' && student.transportRoute) {
      if (feeDetails.transportRoutes && feeDetails.transportRoutes[student.transportRoute]) {
        const transportAmount = feeDetails.transportRoutes[student.transportRoute];
        finalTotal += transportAmount;
        components.push({ name: `Transport Fee (${student.transportRoute})`, amount: transportAmount });
        notes = `Total includes transport for ${student.transportRoute} route.`;
      } else {
        // Specific route chosen by student, but not found in FeeStructure's routes
        notes = `Transport route '${student.transportRoute}' not found in fee structure for this grade. Fee calculated without transport.`;
      }
    } else if (student.boardingStatus === 'Day' && !student.hasTransport) {
        notes = "Student is a Day scholar and does not use school transport.";
    }


    // Add student details and calculated fees to the response
    res.status(200).json({
      studentDetails: {
        admissionNumber: student.admissionNumber,
        fullName: student.fullName,
        gradeLevel: student.gradeLevel,
        boardingStatus: student.boardingStatus,
        hasTransport: student.hasTransport,
        transportRoute: student.transportRoute,
        currentBalance: student.currentBalance, // Include current balance
      },
      termlyComponents: components,
      totalCalculated: feeDetails.totalCalculated, // Base total from structure (without transport)
      finalTotal: finalTotal, // Calculated total including transport
      notes: notes,
      _id: feeDetails._id, // Include original _id of fee structure for reference
      // Only send availableRoutes if this specific query returned them and it's a 'day' scholar needing a route
      availableRoutes: (feeRecord.transportRoutes && student.hasTransport && student.boardingStatus === 'Day' && !student.transportRoute)
                         ? feeRecord.transportRoutes : undefined,
    });

  } catch (err) {
    console.error('Error fetching student fees:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * @desc    Updates a student's details.
 * @route   PUT /api/students/:admissionNumber
 * @access  Public (consider making it private/admin only in production)
 */
exports.updateStudent = async (req, res) => {
    const { admissionNumber } = req.params;
    const { fullName, gradeLevel, boardingStatus, hasTransport, transportRoute, parentName, parentPhone, currentBalance } = req.body;

    try {
        const student = await Student.findOne({ admissionNumber });
        if (!student) {
            return res.status(404).json({ message: 'Student not found.' });
        }

        // Update fields if provided
        if (fullName) student.fullName = fullName;
        if (gradeLevel) student.gradeLevel = gradeLevel;
        if (parentName) student.parentName = parentName;
        if (parentPhone) student.parentPhone = parentPhone;
        if (currentBalance !== undefined) student.currentBalance = currentBalance;

        // Special handling for boardingStatus, hasTransport, and transportRoute
        if (boardingStatus) {
            student.boardingStatus = boardingStatus;
            // If status changes to Boarding or invalid, clear transport details
            if (boardingStatus === 'Boarding') {
                student.hasTransport = false;
                student.transportRoute = '';
            } else if (boardingStatus === 'Day') {
                // If provided in request, update. Otherwise, maintain existing or default.
                student.hasTransport = hasTransport !== undefined ? hasTransport : student.hasTransport;
                student.transportRoute = hasTransport && transportRoute ? transportRoute : '';
            }
        } else { // If boardingStatus is not provided in update, ensure transport is still consistent
            if (student.boardingStatus === 'Boarding') {
                 student.hasTransport = false;
                 student.transportRoute = '';
            } else if (student.boardingStatus === 'Day') {
                student.hasTransport = hasTransport !== undefined ? hasTransport : student.hasTransport;
                student.transportRoute = hasTransport && transportRoute ? transportRoute : '';
            }
        }


        await student.save();
        res.status(200).json({ message: 'Student updated successfully', student });

    } catch (error) {
        console.error('Error updating student:', error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * @desc    Deletes a student by admission number.
 * @route   DELETE /api/students/:admissionNumber
 * @access  Public (consider making it private/admin only in production)
 */
exports.deleteStudent = async (req, res) => {
    try {
        const student = await Student.findOneAndDelete({ admissionNumber: req.params.admissionNumber });
        if (!student) {
            return res.status(404).json({ message: 'Student not found.' });
        }
        res.status(200).json({ message: 'Student deleted successfully', student });
    } catch (error) {
        console.error('Error deleting student:', error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};