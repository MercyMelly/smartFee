const Student = require('../models/studentsDB');
const FeeStructure = require('../models/feeStructure');
const Payment = require('../models/paymentsDB');



exports.registerStudent = async (req, res) => {
  const {
    fullName,
    admissionNumber,
    gradeLevel,
    gender, // <--- Added gender here
    boardingStatus,
    hasTransport,
    transportRoute,
    parentName,
    parentPhone,
    parentEmail, // <--- Added parentEmail
    parentAddress, // <--- Added parentAddress
  } = req.body;

  if (!fullName || !admissionNumber || !gradeLevel || !gender || !boardingStatus || !parentName || !parentPhone) {
    return res.status(400).json({ message: 'Please provide all required student details: Full Name, Admission Number, Grade Level, Gender, Boarding Status, Parent Name, Parent Phone.' });
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
      gender, // <--- Pass gender to the model
      boardingStatus,
      hasTransport: studentHasTransport,
      transportRoute: studentTransportRoute,
      parentName,
      parentPhone,
      parentEmail, // <--- Pass parentEmail
      parentAddress, // <--- Pass parentAddress
    });

    const savedStudent = await newStudent.save();
    res.status(201).json({ message: 'Student registered successfully', student: savedStudent });

  } catch (error) {
    console.error('Error registering student:', error.message);
    // More specific error message for validation errors
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation failed', errors: error.errors });
    }
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

    // --- FEE STRUCTURE QUERY LOGIC REFINEMENT ---
    let feeRecord;
    let fallbackAttempted = false; // Flag to track if we attempted a fallback

    if (student.boardingStatus === 'Day' && student.hasTransport && student.transportRoute) {
      // Priority 1: Exact match for Day scholar with a specific transport route
      feeRecord = await FeeStructure.findOne({
        gradeLevel: student.gradeLevel,
        boardingStatus: 'Day',
        hasTransport: true,
        transportRoute: student.transportRoute,
      });
    }

    if (!feeRecord && student.boardingStatus === 'Day' && !student.hasTransport) {
      // Priority 2: Day scholar without transport
      feeRecord = await FeeStructure.findOne({
        gradeLevel: student.gradeLevel,
        boardingStatus: 'Day',
        hasTransport: false,
        transportRoute: '', // Or specifically null/undefined if that's how it's stored
      });
    }

    if (!feeRecord && student.boardingStatus === 'Boarding') {
      // Priority 3: Boarding scholar
      feeRecord = await FeeStructure.findOne({
        gradeLevel: student.gradeLevel,
        boardingStatus: 'Boarding',
        hasTransport: false, // Boarders typically don't have separate transport fees tied to their fee structure
        transportRoute: '',
      });
    }

    // --- FALLBACK FOR DAY SCHOLARS NEEDING TRANSPORT, BUT NO SPECIFIC ROUTE FEE FOUND ---
    // This handles cases where a student has hasTransport: true, but transportRoute is empty
    // or the specific route isn't defined in FeeStructure as a separate document.
    // It will return the *base* day scholar fee and prompt for route selection.
    if (!feeRecord && student.boardingStatus === 'Day' && student.hasTransport && !student.transportRoute) {
      fallbackAttempted = true;
      feeRecord = await FeeStructure.findOne({
        gradeLevel: student.gradeLevel,
        boardingStatus: 'Day',
        hasTransport: true, // Look for a general 'Day with Transport' structure
        // Do NOT include transportRoute in this fallback query, as we're looking for the base
        // Or query for transportRoute: '' if you use that for the base Day transport fee
      });
    }

    // --- Handle if NO fee structure is found after all attempts ---
    if (!feeRecord) {
      let errorMessage = 'Fee structure not found for this student\'s criteria.';
      if (fallbackAttempted) {
        errorMessage = 'Base fee structure for Day scholar with transport not found. Please configure general Day scholar transport fees.';
      }

      return res.status(404).json({
        message: errorMessage,
        studentDetails: {
          admissionNumber: student.admissionNumber,
          fullName: student.fullName,
          gradeLevel: student.gradeLevel,
          boardingStatus: student.boardingStatus,
          hasTransport: student.hasTransport,
          transportRoute: student.transportRoute,
        },
        // Remove queryUsed as it's more complex now
      });
    }
    // --- END FEE STRUCTURE QUERY LOGIC REFINEMENT ---


    // Calculate fees paid based on Payment model (assuming current term logic is handled by frontend or overall logic)
    const totalPaymentsMade = await Payment.aggregate([
      { $match: { student: student._id } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const feesPaidForLife = totalPaymentsMade.length > 0 ? totalPaymentsMade[0].total : 0;

    // Use feeRecord.totalAmount if that's where the total is stored,
    // otherwise, calculate from components if totalCalculated isn't direct.
    // Let's assume feeRecord.totalAmount is the base total as per your FeeStructure model example.
    let totalTermlyFee = feeRecord.totalAmount;
    let components = feeRecord.components ? [...feeRecord.components] : [];
    let notes = feeRecord.notes || '';

    // If student has transport and a specific route, add that specific transport fee
    // Note: The `transportRoutes` object should be part of your `FeeStructure` model
    // if you want to pull specific route costs from it.
    if (student.hasTransport && student.boardingStatus === 'Day' && student.transportRoute) {
        // This is a crucial point: If transport fees are *separate documents*
        // you'd need another FeeStructure.findOne call here to fetch the transport cost.
        // If they are embedded in the main fee structure (e.g., in a map/object called `transportRoutes`),
        // then access them as `feeRecord.transportRoutes[student.transportRoute]`.

        // Assuming `feeRecord.transportRoutes` exists on your FeeStructure model and is an object like `{ "route_name": amount }`
        if (feeRecord.transportRoutes && feeRecord.transportRoutes[student.transportRoute]) {
            const transportAmount = feeRecord.transportRoutes[student.transportRoute];
            totalTermlyFee += transportAmount;
            components.push({ name: `Transport Fee (${student.transportRoute})`, amount: transportAmount });
            if (!notes) {
                notes = `Total includes transport for ${student.transportRoute} route.`;
            } else {
                notes += ` Total also includes transport for ${student.transportRoute} route.`;
            }
        } else {
            notes += ` Warning: Specific transport route '${student.transportRoute}' fee not found in fee structure. Fee calculated without this transport component.`;
        }
    } else if (student.boardingStatus === 'Day' && !student.hasTransport) {
        notes = "Student is a Day scholar and does not use school transport.";
    }


    const remainingBalance = totalTermlyFee - feesPaidForLife;


    // 5. Construct the comprehensive profile object
    const studentProfile = {
      student: {
        fullName: student.fullName,
        admissionNumber: student.admissionNumber,
        gradeLevel: student.gradeLevel,
        gender: student.gender,
        boardingStatus: student.boardingStatus,
        hasTransport: student.hasTransport,
        transportRoute: student.transportRoute,
        parent: {
          name: student.parentName,
          phone: student.parentPhone,
          email: student.parentEmail,
          address: student.parentAddress,
        },
      },
      feeDetails: {
        termlyComponents: components,
        totalTermlyFee: totalTermlyFee,
        feesPaid: feesPaidForLife,
        remainingBalance: remainingBalance,
        notes: notes,
      },
      paymentHistory: paymentHistory,
    };

    res.status(200).json(studentProfile);

  } catch (error) {
    console.error('Error in getStudentProfile:', error);
    res.status(500).json({ message: 'Server error. Could not retrieve student profile.', error: error.message });
  }
};

/**
 * @desc    Updates a student's details.
 * @route   PUT /api/students/:admissionNumber
 * @access  Public (consider making it private/admin only in production)
 */
exports.updateStudent = async (req, res) => {
    const { admissionNumber } = req.params;
    const { fullName, gradeLevel, gender, boardingStatus, hasTransport, transportRoute, parentName, parentPhone, parentEmail, parentAddress, currentBalance } = req.body; // Added gender, email, address

    try {
        const student = await Student.findOne({ admissionNumber });
        if (!student) {
            return res.status(404).json({ message: 'Student not found.' });
        }

        // Update fields if provided
        if (fullName) student.fullName = fullName;
        if (gradeLevel) student.gradeLevel = gradeLevel;
        if (gender) student.gender = gender; // Update gender
        if (parentName) student.parentName = parentName;
        if (parentPhone) student.parentPhone = parentPhone;
        if (parentEmail !== undefined) student.parentEmail = parentEmail; // Allow setting to empty string
        if (parentAddress !== undefined) student.parentAddress = parentAddress; // Allow setting to empty string
        if (currentBalance !== undefined) student.currentBalance = currentBalance;

        // Special handling for boardingStatus, hasTransport, and transportRoute
        if (boardingStatus) {
            student.boardingStatus = boardingStatus;
            if (boardingStatus === 'Boarding') {
                student.hasTransport = false;
                student.transportRoute = '';
            } else if (boardingStatus === 'Day') {
                student.hasTransport = hasTransport !== undefined ? hasTransport : student.hasTransport;
                student.transportRoute = student.hasTransport && transportRoute ? transportRoute : '';
            }
        } else { // If boardingStatus is not provided in update, ensure transport is still consistent
            if (student.boardingStatus === 'Boarding') {
                student.hasTransport = false;
                student.transportRoute = '';
            } else if (student.boardingStatus === 'Day') {
                student.hasTransport = hasTransport !== undefined ? hasTransport : student.hasTransport;
                student.transportRoute = student.hasTransport && transportRoute ? transportRoute : '';
            }
        }

        await student.save();
        res.status(200).json({ message: 'Student updated successfully', student });

    } catch (error) {
        console.error('Error updating student:', error.message);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation failed', errors: error.errors });
        }
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


// exports.getStudentProfile = async (req, res) => {
//   try {
//     const { admissionNumber } = req.params;

//     // 1. Find the student
//     const student = await Student.findOne({ admissionNumber });

//     if (!student) {
//       return res.status(404).json({ message: 'Student not found.' });
//     }

//     // 2. Find matching fee structure
//     const query = {
//       gradeLevel: student.gradeLevel,
//       boardingStatus: student.boardingStatus,
//       hasTransport: student.hasTransport,
//     };

//     let feeRecord = await FeeStructure.findOne(query).lean();

//     if (!feeRecord) {
//       return res.status(404).json({
//         message: 'Fee structure not found for this student\'s configuration.',
//         searchedCriteria: query
//       });
//     }

//     // 3. Calculate final fee with transport if applicable
//     let totalTermlyFee = feeRecord.totalCalculated;
//     let components = [...feeRecord.termlyComponents];
//     let notes = '';

//     if (student.hasTransport && student.transportRoute) {
//       const routeKey = student.transportRoute.toLowerCase();
//       const routeAmount = feeRecord.transportRoutes?.[routeKey];

//       if (routeAmount !== undefined) {
//         totalTermlyFee += routeAmount;
//         components.push({ name: `Transport (${student.transportRoute})`, amount: routeAmount });
//       } else {
//         notes = `Transport route "${student.transportRoute}" not found in fee structure. Base fee returned without transport.`;
//       }
//     }

//     // 4. Get total payments made
//     const totalPaymentsMade = await Payment.aggregate([
//       { $match: { student: student._id } },
//       { $group: { _id: null, total: { $sum: '$amount' } } }
//     ]);
//     const feesPaidForLife = totalPaymentsMade.length > 0 ? totalPaymentsMade[0].total : 0;

//     // 5. Get payment history
//     const paymentHistory = await Payment.find({ student: student._id }).sort({ date: -1 });

//     // 6. Final calculation
//     const remainingBalance = totalTermlyFee - feesPaidForLife;

//     const studentProfile = {
//       student: {
//         fullName: student.fullName,
//         admissionNumber: student.admissionNumber,
//         gradeLevel: student.gradeLevel,
//         gender: student.gender,
//         boardingStatus: student.boardingStatus,
//         hasTransport: student.hasTransport,
//         transportRoute: student.transportRoute,
//         parent: {
//           name: student.parentName,
//           phone: student.parentPhone,
//           email: student.parentEmail,
//           address: student.parentAddress,
//         },
//       },
//       feeDetails: {
//         termlyComponents: components,
//         totalTermlyFee,
//         feesPaid: feesPaidForLife,
//         remainingBalance,
//         notes,
//       },
//       paymentHistory,
//     };

//     res.status(200).json(studentProfile);

//   } catch (error) {
//     console.error('Error in getStudentProfile:', error);
//     res.status(500).json({
//       message: 'Server error. Could not retrieve student profile.',
//       error: error.message
//     });
//   }
// };



exports.getStudentProfile = async (req, res) => {
    try {
        const { admissionNumber } = req.params;

        // 1. Find the student
        const student = await Student.findOne({ admissionNumber });

        if (!student) {
            return res.status(404).json({ message: 'Student not found.' });
        }

        // 2. Find matching fee structure
        const query = {
            gradeLevel: student.gradeLevel,
            boardingStatus: student.boardingStatus,
            hasTransport: student.hasTransport,
        };

        let feeRecord = await FeeStructure.findOne(query).lean();

        if (!feeRecord) {
            // It's generally better to send partial data with a warning
            // than a full 404 if the student exists but fee structure doesn't.
            // Adjust based on your UX preference.
            return res.status(200).json({
                message: 'Fee structure not found for this student\'s configuration. Fee details may be incomplete.',
                student: {
                    fullName: student.fullName,
                    admissionNumber: student.admissionNumber,
                    gradeLevel: student.gradeLevel,
                    gender: student.gender,
                    boardingStatus: student.boardingStatus,
                    hasTransport: student.hasTransport,
                    transportRoute: student.transportRoute,
                    parent: {
                        name: student.parentName,
                        phone: student.parentPhone,
                        email: student.parentEmail,
                        address: student.parentAddress,
                    },
                },
                feeDetails: {
                    termlyComponents: [], // No components if no fee structure
                    totalTermlyFee: 0,
                    feesPaid: student.feeDetails.feesPaid, // Still pull from student's record
                    remainingBalance: student.feeDetails.remainingBalance, // Still pull from student's record
                    notes: 'No matching fee structure found for current term.'
                },
                paymentHistory: await Payment.find({ student: student._id }).sort({ paymentDate: -1 }), // Fetch history anyway
            });
        }

        // 3. Calculate final fee with transport if applicable
        let totalTermlyFee = feeRecord.totalCalculated;
        let components = [...feeRecord.termlyComponents];
        let notes = '';

        // if (student.hasTransport && student.transportRoute) {
        //     // Using .get() for Map, and checking for existence
        //     const routeAmount = feeRecord.transportRoutes && feeRecord.transportRoutes.get(student.transportRoute.toLowerCase());

        //     if (routeAmount !== undefined) {
        //         totalTermlyFee += routeAmount;
        //         components.push({ name: `Transport (${student.transportRoute})`, amount: routeAmount });
        //     } else {
        //         // Better note for the user if route not found
        //         notes = `Note: Transport route "${student.transportRoute}" not found in fee structure. Transport fee not included in total.`;
        //     }
        // }

        if (student.hasTransport && student.transportRoute) {
            const routeKey = student.transportRoute.toLowerCase();
            // --- FIX HERE: Access like a plain object, not a Map ---
            const routeAmount = feeRecord.transportRoutes?.[routeKey]; // Use bracket notation for object access

            if (routeAmount !== undefined) { // Check if the amount was found
                totalTermlyFee += routeAmount;
                components.push({ name: `Transport (${student.transportRoute})`, amount: routeAmount });
            } else {
                notes = `Note: Transport route "${student.transportRoute}" not found in fee structure. Transport fee not included in total.`;
            }
        }


        // 4. Get total payments made
        // *** FIX 1: Change '$amount' to '$amountPaid' ***
        const totalPaymentsMadeResult = await Payment.aggregate([
            { $match: { student: student._id } },
            { $group: { _id: null, total: { $sum: '$amountPaid' } } } // Corrected field name
        ]);
        const feesPaidForLife = totalPaymentsMadeResult.length > 0 ? totalPaymentsMadeResult[0].total : 0;

        // 5. Get payment history
        // *** FIX 2: Change 'date' to 'paymentDate' or 'createdAt' ***
        // Assuming your schema has 'paymentDate' (if explicitly defined) or 'createdAt' (from timestamps)
        const paymentHistory = await Payment.find({ student: student._id }).sort({ paymentDate: -1 }); // Or { createdAt: -1 } if only using timestamps

        // 6. Final calculation (based on current term's total fee and total payments for that student)
        // IMPORTANT: The `remainingBalance` in your student schema is for the current term.
        // If `feesPaidForLife` includes payments for *previous* terms, this calculation might be off
        // for the *current term's* balance.
        // Assuming `feesPaidForLife` IS the sum of all payments, and `totalTermlyFee` is the CURRENT term's fee.
        // This is a common pattern, but be aware of how you define "balance".
        const remainingBalance = totalTermlyFee - feesPaidForLife;


        const studentProfile = {
            student: {
                fullName: student.fullName,
                admissionNumber: student.admissionNumber,
                gradeLevel: student.gradeLevel,
                gender: student.gender,
                boardingStatus: student.boardingStatus,
                hasTransport: student.hasTransport,
                transportRoute: student.transportRoute,
                parent: {
                    name: student.parentName,
                    phone: student.parentPhone,
                    email: student.parentEmail,
                    address: student.parentAddress,
                },
            },
            feeDetails: {
                termlyComponents: components,
                totalTermlyFee, // Short-hand for totalTermlyFee: totalTermlyFee
                feesPaid: feesPaidForLife, // This is the total payments made over all time for the student
                remainingBalance, // This is the totalTermlyFee minus total payments made
                notes,
            },
            paymentHistory,
        };

        res.status(200).json(studentProfile);

    } catch (error) {
        console.error('Error in getStudentProfile:', error);
        res.status(500).json({
            message: 'Server error. Could not retrieve student profile.',
            error: error.message
        });
    }
};
