// const Student = require('../models/studentsDB');
// const FeeStructure = require('../models/feeStructure');
// const Payment = require('../models/paymentsDB');

// exports.registerStudent = async (req, res) => {
//   const {
//     fullName,
//     admissionNumber,
//     gradeLevel,
//     gender,
//     boardingStatus,
//     hasTransport,
//     transportRoute,
//     parentName,
//     parentPhone,
//     parentEmail, 
//     parentAddress, 
//   } = req.body;

//   if (!fullName || !admissionNumber || !gradeLevel || !gender || !boardingStatus || !parentName || !parentPhone) {
//     return res.status(400).json({ message: 'Please provide all required student details: Full Name, Admission Number, Grade Level, Gender, Boarding Status, Parent Name, Parent Phone.' });
//   }

//   try {
//     const exists = await Student.findOne({ admissionNumber });
//     if (exists) {
//       return res.status(400).json({ message: 'Student with this admission number is already registered.' });
//     }

//     const studentHasTransport = (boardingStatus === 'Day' && hasTransport) ? true : false;
//     const studentTransportRoute = (boardingStatus === 'Day' && hasTransport) ? transportRoute : '';

//     const newStudent = new Student({
//       fullName,
//       admissionNumber,
//       gradeLevel,
//       gender, 
//       boardingStatus,
//       hasTransport: studentHasTransport,
//       transportRoute: studentTransportRoute,
//       parentName,
//       parentPhone,
//       parentEmail,
//       parentAddress,
//     });

//     const savedStudent = await newStudent.save();
//     res.status(201).json({ message: 'Student registered successfully', student: savedStudent });

//   } catch (error) {
//     console.error('Error registering student:', error.message);
//     if (error.name === 'ValidationError') {
//         return res.status(400).json({ message: 'Validation failed', errors: error.errors });
//     }
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };


// exports.getAllStudents = async (req, res) => {
//   try {
//     const students = await Student.find({});
//     res.status(200).json(students);
//   } catch (error) {
//     console.error('Error fetching all students:', error.message);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// exports.getStudentByAdmission = async (req, res) => {
//   try {
//     const student = await Student.findOne({ admissionNumber: req.params.admissionNumber });
//     if (!student) {
//       return res.status(404).json({ message: 'Student not found.' });
//     }
//     res.status(200).json(student);
//   } catch (error) {
//     console.error('Error fetching student by admission number:', error.message);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// exports.getStudentFees = async (req, res) => {
//   const { admissionNumber } = req.params;

//   try {
//     const student = await Student.findOne({ admissionNumber });

//     if (!student) {
//       return res.status(404).json({ message: 'Student not found.' });
//     }

//     let feeRecord;
//     let fallbackAttempted = false; 
//     if (student.boardingStatus === 'Day' && student.hasTransport && student.transportRoute) {
//       feeRecord = await FeeStructure.findOne({
//         gradeLevel: student.gradeLevel,
//         boardingStatus: 'Day',
//         hasTransport: true,
//         transportRoute: student.transportRoute,
//       });
//     }
//     if (!feeRecord && student.boardingStatus === 'Day' && !student.hasTransport) {
//       feeRecord = await FeeStructure.findOne({
//         gradeLevel: student.gradeLevel,
//         boardingStatus: 'Day',
//         hasTransport: false,
//         transportRoute: '', 
//       });
//     }
//     if (!feeRecord && student.boardingStatus === 'Boarding') {
//       feeRecord = await FeeStructure.findOne({
//         gradeLevel: student.gradeLevel,
//         boardingStatus: 'Boarding',
//         hasTransport: false,
//         transportRoute: '',
//       });
//     }
//     if (!feeRecord && student.boardingStatus === 'Day' && student.hasTransport && !student.transportRoute) {
//       fallbackAttempted = true;
//       feeRecord = await FeeStructure.findOne({
//         gradeLevel: student.gradeLevel,
//         boardingStatus: 'Day',
//         hasTransport: true, 
//       });
//     }
//     if (!feeRecord) {
//       let errorMessage = 'Fee structure not found for this student\'s criteria.';
//       if (fallbackAttempted) {
//         errorMessage = 'Base fee structure for Day scholar with transport not found. Please configure general Day scholar transport fees.';
//       }
//       return res.status(404).json({
//         message: errorMessage,
//         studentDetails: {
//           admissionNumber: student.admissionNumber,
//           fullName: student.fullName,
//           gradeLevel: student.gradeLevel,
//           boardingStatus: student.boardingStatus,
//           hasTransport: student.hasTransport,
//           transportRoute: student.transportRoute,
//         },
//       });
//     }

//     const totalPaymentsMade = await Payment.aggregate([
//       { $match: { student: student._id } },
//       { $group: { _id: null, total: { $sum: '$amount' } } }
//     ]);
//     const feesPaidForLife = totalPaymentsMade.length > 0 ? totalPaymentsMade[0].total : 0;
//     let totalTermlyFee = feeRecord.totalAmount;
//     let components = feeRecord.components ? [...feeRecord.components] : [];
//     let notes = feeRecord.notes || '';
//     if (student.hasTransport && student.boardingStatus === 'Day' && student.transportRoute) {
//           if (feeRecord.transportRoutes && feeRecord.transportRoutes[student.transportRoute]) {
//             const transportAmount = feeRecord.transportRoutes[student.transportRoute];
//             totalTermlyFee += transportAmount;
//             components.push({ name: `Transport Fee (${student.transportRoute})`, amount: transportAmount });
//             if (!notes) {
//                 notes = `Total includes transport for ${student.transportRoute} route.`;
//             } else {
//                 notes += ` Total also includes transport for ${student.transportRoute} route.`;
//             }
//         } else {
//             notes += ` Warning: Specific transport route '${student.transportRoute}' fee not found in fee structure. Fee calculated without this transport component.`;
//         }
//     } else if (student.boardingStatus === 'Day' && !student.hasTransport) {
//         notes = "Student is a Day scholar and does not use school transport.";
//     }
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
//         totalTermlyFee: totalTermlyFee,
//         feesPaid: feesPaidForLife,
//         remainingBalance: remainingBalance,
//         notes: notes,
//       },
//       paymentHistory: paymentHistory,
//     };

//     res.status(200).json(studentProfile);

//   } catch (error) {
//     console.error('Error in getStudentProfile:', error);
//     res.status(500).json({ message: 'Server error. Could not retrieve student profile.', error: error.message });
//   }
// };

// exports.updateStudent = async (req, res) => {
//   const { admissionNumber } = req.params;
//   const { fullName, gradeLevel, gender, boardingStatus, hasTransport, transportRoute, parentName, parentPhone, parentEmail, parentAddress, currentBalance } = req.body;
//   try {
//       const student = await Student.findOne({ admissionNumber });
//       if (!student) {
//           return res.status(404).json({ message: 'Student not found.' });
//       }
//       if (fullName) student.fullName = fullName;
//       if (gradeLevel) student.gradeLevel = gradeLevel;
//       if (gender) student.gender = gender; 
//       if (parentName) student.parentName = parentName;
//       if (parentPhone) student.parentPhone = parentPhone;
//       if (parentEmail !== undefined) student.parentEmail = parentEmail; 
//       if (parentAddress !== undefined) student.parentAddress = parentAddress; 
//       if (currentBalance !== undefined) student.currentBalance = currentBalance;
//       if (boardingStatus) {
//           student.boardingStatus = boardingStatus;
//           if (boardingStatus === 'Boarding') {
//               student.hasTransport = false;
//               student.transportRoute = '';
//           } else if (boardingStatus === 'Day') {
//               student.hasTransport = hasTransport !== undefined ? hasTransport : student.hasTransport;
//               student.transportRoute = student.hasTransport && transportRoute ? transportRoute : '';
//           }
//       } else { 
//           if (student.boardingStatus === 'Boarding') {
//               student.hasTransport = false;
//               student.transportRoute = '';
//           } else if (student.boardingStatus === 'Day') {
//               student.hasTransport = hasTransport !== undefined ? hasTransport : student.hasTransport;
//               student.transportRoute = student.hasTransport && transportRoute ? transportRoute : '';
//           }
//       }

//       await student.save();
//       res.status(200).json({ message: 'Student updated successfully', student });

//   } catch (error) {
//       console.error('Error updating student:', error.message);
//       if (error.name === 'ValidationError') {
//           return res.status(400).json({ message: 'Validation failed', errors: error.errors });
//       }
//       res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// exports.deleteStudent = async (req, res) => {
//   try {
//       const student = await Student.findOneAndDelete({ admissionNumber: req.params.admissionNumber });
//       if (!student) {
//           return res.status(404).json({ message: 'Student not found.' });
//       }
//       res.status(200).json({ message: 'Student deleted successfully', student });
//   } catch (error) {
//       console.error('Error deleting student:', error.message);
//       res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// exports.getStudentProfile = async (req, res) => {
//   try {
//       const { admissionNumber } = req.params;

//       const student = await Student.findOne({ admissionNumber });

//       if (!student) {
//           return res.status(404).json({ message: 'Student not found.' });
//       }

//       const query = {
//           gradeLevel: student.gradeLevel,
//           boardingStatus: student.boardingStatus,
//           hasTransport: student.hasTransport,
//       };

//       let feeRecord = await FeeStructure.findOne(query).lean();

//       if (!feeRecord) {
//           return res.status(200).json({
//               message: 'Fee structure not found for this student\'s configuration. Fee details may be incomplete.',
//               student: {
//                   fullName: student.fullName,
//                   admissionNumber: student.admissionNumber,
//                   gradeLevel: student.gradeLevel,
//                   gender: student.gender,
//                   boardingStatus: student.boardingStatus,
//                   hasTransport: student.hasTransport,
//                   transportRoute: student.transportRoute,
//                   parent: {
//                       name: student.parentName,
//                       phone: student.parentPhone,
//                       email: student.parentEmail,
//                       address: student.parentAddress,
//                   },
//               },
//               feeDetails: {
//                   termlyComponents: [],
//                   totalTermlyFee: 0,
//                   feesPaid: student.feeDetails.feesPaid, 
//                   remainingBalance: student.feeDetails.remainingBalance, 
//                   notes: 'No matching fee structure found for current term.'
//               },
//               paymentHistory: await Payment.find({ student: student._id }).sort({ paymentDate: -1 }), 
//           });
//       }
//       let totalTermlyFee = feeRecord.totalCalculated;
//       let components = [...feeRecord.termlyComponents];
//       let notes = '';

//       if (student.hasTransport && student.transportRoute) {
//           const routeKey = student.transportRoute.toLowerCase();
//           const routeAmount = feeRecord.transportRoutes?.[routeKey]; 

//           if (routeAmount !== undefined) { 
//               totalTermlyFee += routeAmount;
//               components.push({ name: `Transport (${student.transportRoute})`, amount: routeAmount });
//           } else {
//               notes = `Note: Transport route "${student.transportRoute}" not found in fee structure. Transport fee not included in total.`;
//           }
//       }

//       const totalPaymentsMadeResult = await Payment.aggregate([
//           { $match: { student: student._id } },
//           { $group: { _id: null, total: { $sum: '$amountPaid' } } } 
//       ]);
//       const feesPaidForLife = totalPaymentsMadeResult.length > 0 ? totalPaymentsMadeResult[0].total : 0;
//       const paymentHistory = await Payment.find({ student: student._id }).sort({ paymentDate: -1 }); 
//       const remainingBalance = totalTermlyFee - feesPaidForLife;


//       const studentProfile = {
//           student: {
//               fullName: student.fullName,
//               admissionNumber: student.admissionNumber,
//               gradeLevel: student.gradeLevel,
//               gender: student.gender,
//               boardingStatus: student.boardingStatus,
//               hasTransport: student.hasTransport,
//               transportRoute: student.transportRoute,
//               parent: {
//                   name: student.parentName,
//                   phone: student.parentPhone,
//                   email: student.parentEmail,
//                   address: student.parentAddress,
//               },
//           },
//           feeDetails: {
//               termlyComponents: components,
//               totalTermlyFee,
//               feesPaid: feesPaidForLife,
//               remainingBalance, 
//               notes,
//           },
//           paymentHistory,
//       };

//       res.status(200).json(studentProfile);

//   } catch (error) {
//       console.error('Error in getStudentProfile:', error);
//       res.status(500).json({
//           message: 'Server error. Could not retrieve student profile.',
//           error: error.message
//       });
//   }
// };
// backend/controllers/studentsController.js

const Student = require('../models/studentsDB');
const FeeStructure = require('../models/feeStructure');
const Payment = require('../models/paymentsDB'); // Assuming you have a Payment model for history

// Helper function to calculate total expected fees based on student and fee structure
const calculateTotalExpectedFees = async (gradeLevel, boardingStatus, hasTransport, transportRoute) => {
    let feeRecord = null;

    // IMPORTANT: This logic is complex and should ideally be streamlined or pre-calculated
    // It's trying to find the MOST SPECIFIC fee structure.
    // 1. Try to find a very specific match including transport route if applicable
    if (boardingStatus === 'Day' && hasTransport && transportRoute) {
        const routeKey = transportRoute.toLowerCase();
        // Query for the base structure, then filter by route presence in application logic
        feeRecord = await FeeStructure.findOne({
            gradeLevel: gradeLevel,
            boardingStatus: 'Day',
            hasTransport: true,
        });
        if (feeRecord && (!feeRecord.transportRoutes || !feeRecord.transportRoutes.get(routeKey))) {
            // If the found record doesn't have this specific route, nullify it to try next fallback
            feeRecord = null;
        }
    }

    // 2. Fallback: Day student without transport
    if (!feeRecord && boardingStatus === 'Day' && !hasTransport) {
        feeRecord = await FeeStructure.findOne({
            gradeLevel: gradeLevel,
            boardingStatus: 'Day',
            hasTransport: false,
        });
    }

    // 3. Fallback: Boarding student (always no transport as per logic)
    if (!feeRecord && boardingStatus === 'Boarding') {
        feeRecord = await FeeStructure.findOne({
            gradeLevel: gradeLevel,
            boardingStatus: 'Boarding',
            hasTransport: false,
        });
    }

    // 4. Final Fallback: Day student with transport, but route not specific or general transport fee
    // This case will be covered by the first check if feeRecord remains null after initial attempts
    if (!feeRecord && boardingStatus === 'Day' && hasTransport) {
        feeRecord = await FeeStructure.findOne({
            gradeLevel: gradeLevel,
            boardingStatus: 'Day',
            hasTransport: true,
        });
    }

    if (!feeRecord) {
        console.warn(`[FeeCalc] No definitive fee structure found for: Grade: ${gradeLevel}, Boarding: ${boardingStatus}, Transport: ${hasTransport}, Route: ${transportRoute}. Returning 0.`);
        return 0; // Return 0 if no matching fee structure is found
    }

    let totalCalculatedFee = feeRecord.totalCalculated || 0;

    // Add transport fee if applicable and found in the feeRecord object
    if (hasTransport && boardingStatus === 'Day' && transportRoute) {
        const routeKey = transportRoute.toLowerCase();
        const transportAmount = feeRecord.transportRoutes?.get(routeKey); // Use .get() for Mongoose Maps
        if (transportAmount !== undefined && transportAmount !== null) { // Check for undefined and null
            totalCalculatedFee += transportAmount;
        } else {
            console.warn(`[FeeCalc] Transport route '${transportRoute}' fee not found in fee structure for grade ${gradeLevel}. Transport component not added to totalCalculatedFee.`);
        }
    }

    return totalCalculatedFee;
};

/**
 * @route POST /api/students/register
 * @desc Register a new student
 * @access Private (Bursar, Admin, Director)
 */
exports.registerStudent = async (req, res) => {
    // Destructure all expected fields, including the nested 'parent' object
    const {
        fullName,
        admissionNumber,
        gradeLevel,
        gender,
        boardingStatus,
        hasTransport,
        transportRoute,
        parent // This should now be the nested parent object from frontend
    } = req.body;

    // Basic validation for required fields, including parent.name and parent.phone
    if (!fullName || !admissionNumber || !gradeLevel || !gender || !boardingStatus ||
        !parent || !parent.name || !parent.phone) {
        return res.status(400).json({ message: 'Please provide all required student and parent details.' });
    }

    try {
        // Check if student with this admission number already exists
        const exists = await Student.findOne({ admissionNumber: admissionNumber.toUpperCase().trim() });
        if (exists) {
            return res.status(400).json({ message: 'Student with this admission number is already registered.' });
        }

        // Determine actual transport status based on boarding status
        const studentHasTransport = (boardingStatus === 'Day' && hasTransport) ? true : false;
        const studentTransportRoute = (boardingStatus === 'Day' && hasTransport) ? transportRoute : '';

        // Calculate totalExpectedFees for the student upon registration
        const totalExpectedFeesForStudent = await calculateTotalExpectedFees(
            gradeLevel,
            boardingStatus,
            studentHasTransport,
            studentTransportRoute
        );

        // Create new Student document with the nested 'parent' object
        const newStudent = new Student({
            fullName: fullName.trim(),
            admissionNumber: admissionNumber.toUpperCase().trim(),
            gradeLevel,
            gender,
            boardingStatus,
            hasTransport: studentHasTransport,
            transportRoute: studentTransportRoute,
            parent: { // Correctly assign the nested parent object
                name: parent.name.trim(),
                phone: parent.phone.trim(),
                email: parent.email ? parent.email.trim() : '',
                address: parent.address ? parent.address.trim() : '',
            },
            feeDetails: {
                feesPaid: 0,
                remainingBalance: totalExpectedFeesForStudent, // Initially, remaining balance is the total expected
                totalFees: totalExpectedFeesForStudent, // Store the calculated total expected fees
            },
        });

        const savedStudent = await newStudent.save();
        res.status(201).json({ message: 'Student registered successfully', student: savedStudent });

    } catch (error) {
        console.error('Error registering student:', error.message);
        // Handle unique admission number error specifically (MongoDB error code 11000)
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Admission number already exists. Please use a unique number.' });
        }
        // Handle Mongoose validation errors (e.g., phone format from schema)
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * @route GET /api/students
 * @desc Get all students
 * @access Private
 */
exports.getAllStudents = async (req, res) => {
    try {
        const students = await Student.find({}).sort({ admissionNumber: 1 });
        res.status(200).json(students);
    } catch (error) {
        console.error('Error fetching all students:', error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * @route GET /api/students/:admissionNumber
 * @desc Get student by admission number
 * @access Private
 */
exports.getStudentByAdmission = async (req, res) => {
    try {
        const student = await Student.findOne({ admissionNumber: req.params.admissionNumber.toUpperCase() });
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
 * @route GET /api/students/:admissionNumber/profile
 * @desc Get detailed student profile (including fee details and payment history)
 * @access Private
 */
exports.getStudentProfile = async (req, res) => {
    try {
        const { admissionNumber } = req.params;

        // Fetch student and explicitly populate the 'parent' field
        const student = await Student.findOne({ admissionNumber: admissionNumber.toUpperCase() }).lean(); // Use .lean() for plain JS objects

        if (!student) {
            return res.status(404).json({ message: 'Student not found.' });
        }

        // Use the helper to get the *current* total expected fee based on actual FeeStructure
        const currentCalculatedTotalFees = await calculateTotalExpectedFees(
            student.gradeLevel,
            student.boardingStatus,
            student.hasTransport,
            student.transportRoute
        );

        // Calculate total payments made by this student
        const totalPaymentsMadeResult = await Payment.aggregate([
            { $match: { student: student._id } },
            { $group: { _id: null, total: { $sum: '$amountPaid' } } }
        ]);
        const feesPaidForLife = totalPaymentsMadeResult.length > 0 ? totalPaymentsMadeResult[0].total : 0;

        // Calculate remaining balance
        const remainingBalance = currentCalculatedTotalFees - feesPaidForLife;

        // IMPORTANT: Update the student's feeDetails in the DB with the latest calculation.
        // This ensures the dashboard summary query always has the most current totalFees.
        // We will perform a direct update here, rather than modifying the `student` object in memory
        // and saving it, which could lead to re-triggering schema validations unnecessarily
        // if only fee details are changing.
        let needsUpdate = false;
        const updateFields = {};

        if (student.feeDetails.totalFees !== currentCalculatedTotalFees) {
            updateFields['feeDetails.totalFees'] = currentCalculatedTotalFees;
            needsUpdate = true;
        }
        if (student.feeDetails.remainingBalance !== remainingBalance) {
            updateFields['feeDetails.remainingBalance'] = remainingBalance;
            needsUpdate = true;
        }

        // If you encounter issues with old documents missing 'gender' (though schema now requires it)
        // you might add a fix here. For new entries, this won't be needed.
        if (!student.gender) {
            // This case should ideally not happen with strict schema validation on new entries
            // For old data, you might set a default before saving if not handled by migration
        }

        if (needsUpdate) {
            await Student.updateOne({ _id: student._id }, { $set: updateFields });
            // Update the 'student' object in memory to reflect the changes for the response
            student.feeDetails.totalFees = currentCalculatedTotalFees;
            student.feeDetails.remainingBalance = remainingBalance;
        }


        // Retrieve feeRecord again to extract components and notes for display
        // Use the same logic as calculateTotalExpectedFees to ensure consistency
        let feeRecordForDisplay = null;
        if (student.boardingStatus === 'Day' && student.hasTransport && student.transportRoute) {
            const routeKey = student.transportRoute.toLowerCase();
            feeRecordForDisplay = await FeeStructure.findOne({
                gradeLevel: student.gradeLevel,
                boardingStatus: 'Day',
                hasTransport: true,
            });
            if (feeRecordForDisplay && (!feeRecordForDisplay.transportRoutes || !feeRecordForDisplay.transportRoutes.get(routeKey))) {
                feeRecordForDisplay = null;
            }
        }
        if (!feeRecordForDisplay && student.boardingStatus === 'Day' && !student.hasTransport) {
            feeRecordForDisplay = await FeeStructure.findOne({
                gradeLevel: student.gradeLevel,
                boardingStatus: 'Day',
                hasTransport: false,
            });
        }
        if (!feeRecordForDisplay && student.boardingStatus === 'Boarding') {
            feeRecordForDisplay = await FeeStructure.findOne({
                gradeLevel: student.gradeLevel,
                boardingStatus: 'Boarding',
                hasTransport: false,
            });
        }
        // Fallback for general Day with transport if specific route match wasn't found
        if (!feeRecordForDisplay && student.boardingStatus === 'Day' && student.hasTransport) {
            feeRecordForDisplay = await FeeStructure.findOne({
                gradeLevel: student.gradeLevel,
                boardingStatus: 'Day',
                hasTransport: true,
            });
        }

        let termlyComponents = feeRecordForDisplay ? [...(feeRecordForDisplay.termlyComponents || [])] : [];
        let notes = feeRecordForDisplay ? feeRecordForDisplay.notes || '' : 'No matching fee structure details found for components/notes.';

        // Add transport component to termlyComponents for display if applicable
        if (student.hasTransport && student.transportRoute && feeRecordForDisplay && feeRecordForDisplay.transportRoutes) {
            const routeKey = student.transportRoute.toLowerCase();
            const transportAmount = feeRecordForDisplay.transportRoutes.get(routeKey);
            if (transportAmount !== undefined && transportAmount !== null) {
                termlyComponents.push({ name: `Transport Fee (${student.transportRoute})`, amount: transportAmount });
                notes += (notes ? ' | ' : '') + `Transport fee for ${student.transportRoute} route included.`;
            }
        }

        // Fetch actual payment history
        const paymentHistory = await Payment.find({ student: student._id }).sort({ paymentDate: -1 });

        const studentProfile = {
            student: { // Directly use student object, which now has nested parent
                ...student, // Spread all existing properties from the fetched student
                parent: { // Ensure parent is properly structured in response
                    name: student.parent.name,
                    phone: student.parent.phone,
                    email: student.parent.email || '',
                    address: student.parent.address || '',
                }
            },
            feeDetails: {
                termlyComponents: termlyComponents,
                totalTermlyFee: currentCalculatedTotalFees, // This is for current display
                feesPaid: feesPaidForLife,
                remainingBalance: remainingBalance,
                notes: notes,
            },
            paymentHistory: paymentHistory,
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

/**
 * @route PUT /api/students/:admissionNumber
 * @desc Update student details
 * @access Private (Bursar, Admin, Director)
 */
exports.updateStudent = async (req, res) => {
    const { admissionNumber } = req.params;
    // Destructure all possible update fields including the nested parent
    const {
        fullName,
        gradeLevel,
        gender,
        boardingStatus,
        hasTransport,
        transportRoute,
        parent // This will be the nested parent object if provided
    } = req.body;

    try {
        const student = await Student.findOne({ admissionNumber: admissionNumber.toUpperCase() });
        if (!student) {
            return res.status(404).json({ message: 'Student not found.' });
        }

        let feesChanged = false; // Flag to indicate if fee-affecting fields have changed

        // Update top-level fields
        if (fullName !== undefined) student.fullName = fullName;
        if (gender !== undefined && student.gender !== gender) {
            student.gender = gender;
        }

        // Update nested parent fields if the parent object is provided in the request
        if (parent) {
            if (parent.name !== undefined) student.parent.name = parent.name;
            if (parent.phone !== undefined) student.parent.phone = parent.phone;
            if (parent.email !== undefined) student.parent.email = parent.email;
            if (parent.address !== undefined) student.parent.address = parent.address;
        }

        // Check for changes in gradeLevel, boardingStatus, hasTransport, transportRoute
        // These changes affect fees and potentially trigger recalculation
        if (gradeLevel !== undefined && student.gradeLevel !== gradeLevel) {
            student.gradeLevel = gradeLevel;
            feesChanged = true;
        }
        if (boardingStatus !== undefined && student.boardingStatus !== boardingStatus) {
            student.boardingStatus = boardingStatus;
            feesChanged = true;
        }

        // Handle transport changes based on boarding status
        if (student.boardingStatus === 'Day') {
            if (hasTransport !== undefined && student.hasTransport !== hasTransport) {
                student.hasTransport = hasTransport;
                feesChanged = true;
            }
            if (student.hasTransport && transportRoute !== undefined && student.transportRoute !== transportRoute) {
                student.transportRoute = transportRoute;
                feesChanged = true;
            } else if (!student.hasTransport && student.transportRoute !== '') { // If transport removed, clear route
                student.transportRoute = '';
                feesChanged = true;
            }
        } else if (student.boardingStatus === 'Boarding') {
            // If now Boarding, transport fields must be false/empty
            if (student.hasTransport || student.transportRoute !== '') {
                feesChanged = true; // Mark as changed if it was previously true/set
            }
            student.hasTransport = false;
            student.transportRoute = '';
        }

        // Recalculate totalFees and remainingBalance if fee-related fields changed
        if (feesChanged) {
            const newTotalExpectedFees = await calculateTotalExpectedFees(
                student.gradeLevel,
                student.boardingStatus,
                student.hasTransport,
                student.transportRoute
            );

            // Calculate new remaining balance based on previous feesPaid and new totalFees
            const newRemainingBalance = newTotalExpectedFees - student.feeDetails.feesPaid;

            student.feeDetails.totalFees = newTotalExpectedFees;
            student.feeDetails.remainingBalance = newRemainingBalance;
        }

        await student.save(); // Save the updated student document
        res.status(200).json({ message: 'Student updated successfully', student });

    } catch (error) {
        console.error('Error updating student:', error.message);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * @route DELETE /api/students/:admissionNumber
 * @desc Delete a student
 * @access Private (Admin, Director) - consider who can delete
 */
exports.deleteStudent = async (req, res) => {
    // Optional: Add role authorization here if only specific roles can delete students
    // if (req.user.role !== 'admin' && req.user.role !== 'director') {
    //     return res.status(403).json({ msg: 'Not authorized to delete students.' });
    // }
    try {
        const student = await Student.findOneAndDelete({ admissionNumber: req.params.admissionNumber.toUpperCase() });
        if (!student) {
            return res.status(404).json({ message: 'Student not found.' });
        }
        res.status(200).json({ message: 'Student deleted successfully', student });
    } catch (error) {
        console.error('Error deleting student:', error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
