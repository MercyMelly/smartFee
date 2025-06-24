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


const Student = require('../models/studentsDB');
const FeeStructure = require('../models/feeStructure'); // Make sure you have this model defined!
const Payment = require('../models/paymentsDB');

// Helper function to calculate total expected fees based on student and fee structure
const calculateTotalExpectedFees = async (gradeLevel, boardingStatus, hasTransport, transportRoute) => {
    let feeRecord;

    // First, try to find the most specific fee structure
    if (boardingStatus === 'Day' && hasTransport && transportRoute) {
        feeRecord = await FeeStructure.findOne({
            gradeLevel,
            boardingStatus: 'Day',
            hasTransport: true,
            transportRoutes: { [transportRoute.toLowerCase()]: { $exists: true } } // Check if route exists
        });
    }

    if (!feeRecord && boardingStatus === 'Day' && !hasTransport) {
        feeRecord = await FeeStructure.findOne({
            gradeLevel,
            boardingStatus: 'Day',
            hasTransport: false,
        });
    }

    if (!feeRecord && boardingStatus === 'Boarding') {
        feeRecord = await FeeStructure.findOne({
            gradeLevel,
            boardingStatus: 'Boarding',
            hasTransport: false, // Boarding students typically don't have transport fees from main structure
        });
    }

    // Fallback for Day student with transport but no specific route fee found
    if (!feeRecord && boardingStatus === 'Day' && hasTransport) {
        feeRecord = await FeeStructure.findOne({
            gradeLevel,
            boardingStatus: 'Day',
            hasTransport: true, // Find a general day transport fee if no route-specific
        });
    }

    if (!feeRecord) {
        console.warn(`[FeeCalc] No fee structure found for: Grade: ${gradeLevel}, Boarding: ${boardingStatus}, Transport: ${hasTransport}, Route: ${transportRoute}`);
        return 0; // Return 0 if no matching fee structure is found
    }

    let totalCalculatedFee = feeRecord.totalCalculated || 0; // Assuming totalCalculated exists in FeeStructure
    
    // Add transport fee if applicable and found
    if (hasTransport && boardingStatus === 'Day' && transportRoute) {
        const routeKey = transportRoute.toLowerCase();
        const transportAmount = feeRecord.transportRoutes?.[routeKey];
        if (transportAmount !== undefined) {
            totalCalculatedFee += transportAmount;
        } else {
            console.warn(`[FeeCalc] Transport route '${transportRoute}' fee not found in fee structure for grade ${gradeLevel}.`);
        }
    }
    
    return totalCalculatedFee;
};


exports.registerStudent = async (req, res) => {
    const {
        fullName,
        admissionNumber,
        gradeLevel,
        gender,
        boardingStatus,
        hasTransport,
        transportRoute,
        parentName,
        parentPhone,
        parentEmail,
        parentAddress,
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

        // >>>>> FIX: Calculate totalFees and save it on registration <<<<<
        const totalExpectedFeesForStudent = await calculateTotalExpectedFees(
            gradeLevel,
            boardingStatus,
            studentHasTransport,
            studentTransportRoute
        );

        const newStudent = new Student({
            fullName,
            admissionNumber,
            gradeLevel,
            gender,
            boardingStatus,
            hasTransport: studentHasTransport,
            transportRoute: studentTransportRoute,
            parentName,
            parentPhone,
            parentEmail,
            parentAddress,
            feeDetails: {
                feesPaid: 0,
                remainingBalance: totalExpectedFeesForStudent, // Initially remainingBalance is totalExpectedFees
                totalFees: totalExpectedFeesForStudent, // Store the calculated total expected fees
            },
        });

        const savedStudent = await newStudent.save();
        res.status(201).json({ message: 'Student registered successfully', student: savedStudent });

    } catch (error) {
        console.error('Error registering student:', error.message);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation failed', errors: error.errors });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


exports.getAllStudents = async (req, res) => {
    try {
        const students = await Student.find({});
        res.status(200).json(students);
    } catch (error) {
        console.error('Error fetching all students:', error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

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

exports.getStudentFees = async (req, res) => {
    const { admissionNumber } = req.params;

    try {
        const student = await Student.findOne({ admissionNumber });

        if (!student) {
            return res.status(404).json({ message: 'Student not found.' });
        }

        // Re-use the helper function to get the current total expected fee based on current config
        const totalTermlyFee = await calculateTotalExpectedFees(
            student.gradeLevel,
            student.boardingStatus,
            student.hasTransport,
            student.transportRoute
        );

        // Fetch payment history
        const paymentHistory = await Payment.find({ student: student._id }).sort({ paymentDate: -1 });
        const totalPaymentsMadeResult = await Payment.aggregate([
            { $match: { student: student._id } },
            { $group: { _id: null, total: { $sum: '$amountPaid' } } }
        ]);
        const feesPaidForLife = totalPaymentsMadeResult.length > 0 ? totalPaymentsMadeResult[0].total : 0;
        
        const remainingBalance = totalTermlyFee - feesPaidForLife;

        // Optionally, you might want to update the student's feeDetails.totalFees here
        // if the fee structure *might have changed* since the student was registered.
        // This makes `getStudentProfile` also act as an updater.
        if (student.feeDetails.totalFees !== totalTermlyFee || student.feeDetails.remainingBalance !== remainingBalance) {
             student.feeDetails.totalFees = totalTermlyFee;
             student.feeDetails.remainingBalance = remainingBalance;
             await student.save(); // Save the updated student document
        }


        // Construct components and notes for display purposes (can be based on FeeStructure model directly)
        // This part needs to be accurately reflected from your FeeStructure model to provide detailed components
        // For now, I'll use placeholders if feeRecord is not explicitly retrieved here.
        let feeRecord = await FeeStructure.findOne({
            gradeLevel: student.gradeLevel,
            boardingStatus: student.boardingStatus,
            hasTransport: student.hasTransport,
            transportRoutes: student.hasTransport && student.transportRoute ? { [student.transportRoute.toLowerCase()]: { $exists: true } } : { $exists: false }
        });
        if(!feeRecord && student.boardingStatus === 'Day' && !student.hasTransport){
             feeRecord = await FeeStructure.findOne({
                gradeLevel: student.gradeLevel,
                boardingStatus: 'Day',
                hasTransport: false,
                transportRoute: '', // Ensure matching no transport
             });
        }
        if(!feeRecord && student.boardingStatus === 'Boarding'){
             feeRecord = await FeeStructure.findOne({
                gradeLevel: student.gradeLevel,
                boardingStatus: 'Boarding',
                hasTransport: false,
                transportRoute: '',
             });
        }

        let components = feeRecord ? [...feeRecord.termlyComponents] : [];
        let notes = feeRecord ? feeRecord.notes || '' : '';

        // Add transport component if applicable and found
        if (student.hasTransport && student.boardingStatus === 'Day' && student.transportRoute && feeRecord) {
            const routeKey = student.transportRoute.toLowerCase();
            const transportAmount = feeRecord.transportRoutes?.[routeKey];
            if (transportAmount !== undefined) {
                components.push({ name: `Transport Fee (${student.transportRoute})`, amount: transportAmount });
                if (!notes) notes = ''; // Ensure notes isn't null
                notes += (notes ? ' | ' : '') + `Transport included for ${student.transportRoute} route.`;
            }
        }


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
                totalTermlyFee: totalTermlyFee, // This is the *currently calculated* total for display
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

exports.updateStudent = async (req, res) => {
    const { admissionNumber } = req.params;
    const { fullName, gradeLevel, gender, boardingStatus, hasTransport, transportRoute, parentName, parentPhone, parentEmail, parentAddress } = req.body; // Removed currentBalance from destructuring as it's not in schema

    try {
        const student = await Student.findOne({ admissionNumber });
        if (!student) {
            return res.status(404).json({ message: 'Student not found.' });
        }

        // Track if fee-related fields are changing to trigger recalculation
        let feesChanged = false;

        if (fullName) student.fullName = fullName;
        if (gradeLevel && student.gradeLevel !== gradeLevel) {
            student.gradeLevel = gradeLevel;
            feesChanged = true;
        }
        if (gender) student.gender = gender;
        if (parentName) student.parentName = parentName;
        if (parentPhone) student.parentPhone = parentPhone;
        if (parentEmail !== undefined) student.parentEmail = parentEmail;
        if (parentAddress !== undefined) student.parentAddress = parentAddress;

        // Check for changes in boarding status or transport
        if (boardingStatus && student.boardingStatus !== boardingStatus) {
            student.boardingStatus = boardingStatus;
            feesChanged = true;
        }

        // If boarding status is now Day, update transport fields
        if (student.boardingStatus === 'Day') {
            if (hasTransport !== undefined && student.hasTransport !== hasTransport) {
                student.hasTransport = hasTransport;
                feesChanged = true;
            }
            if (student.hasTransport && transportRoute !== undefined && student.transportRoute !== transportRoute) {
                student.transportRoute = transportRoute;
                feesChanged = true;
            } else if (!student.hasTransport) { // If transport is explicitly false, clear route
                student.transportRoute = '';
                if (transportRoute !== '') feesChanged = true; // Mark as changed if route was cleared
            }
        } else if (student.boardingStatus === 'Boarding') {
            // If now Boarding, transport fields must be false/empty
            if (student.hasTransport) feesChanged = true;
            if (student.transportRoute !== '') feesChanged = true;
            student.hasTransport = false;
            student.transportRoute = '';
        }

        // >>>>> FIX: Recalculate totalFees and remainingBalance on update if fee-related fields changed <<<<<
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

// This function is still present but its logic is now partially handled by calculateTotalExpectedFees
// It primarily serves to return detailed student profile and current fee status to the frontend.
// The previous logic within this function was effectively a duplicate of calculateTotalExpectedFees.
exports.getStudentProfile = async (req, res) => {
    try {
        const { admissionNumber } = req.params;

        const student = await Student.findOne({ admissionNumber });

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

        const totalPaymentsMadeResult = await Payment.aggregate([
            { $match: { student: student._id } },
            { $group: { _id: null, total: { $sum: '$amountPaid' } } }
        ]);
        const feesPaidForLife = totalPaymentsMadeResult.length > 0 ? totalPaymentsMadeResult[0].total : 0;
        
        const remainingBalance = currentCalculatedTotalFees - feesPaidForLife;

        // IMPORTANT: Update the student's feeDetails in the DB with the latest calculation.
        // This ensures the dashboard summary query always has the most current totalFees.
        // This also acts as a "migration" for old students when their profile is viewed.
        if (student.feeDetails.totalFees !== currentCalculatedTotalFees || student.feeDetails.remainingBalance !== remainingBalance) {
            student.feeDetails.totalFees = currentCalculatedTotalFees;
            student.feeDetails.remainingBalance = remainingBalance;
            await student.save();
        }

        // Retrieve feeRecord again to extract components and notes for display
        let feeRecord = await FeeStructure.findOne({
            gradeLevel: student.gradeLevel,
            boardingStatus: student.boardingStatus,
            hasTransport: student.hasTransport,
            // Adjust query if specific transportRoute needed for feeRecord lookup
        });

        if(!feeRecord && student.boardingStatus === 'Day' && !student.hasTransport){
             feeRecord = await FeeStructure.findOne({
                gradeLevel: student.gradeLevel,
                boardingStatus: 'Day',
                hasTransport: false,
             });
        }
        if(!feeRecord && student.boardingStatus === 'Boarding'){
             feeRecord = await FeeStructure.findOne({
                gradeLevel: student.gradeLevel,
                boardingStatus: 'Boarding',
                hasTransport: false,
             });
        }
        if(!feeRecord && student.boardingStatus === 'Day' && student.hasTransport){ // Fallback for Day with transport, no specific route
             feeRecord = await FeeStructure.findOne({
                gradeLevel: student.gradeLevel,
                boardingStatus: 'Day',
                hasTransport: true,
             });
        }


        let termlyComponents = feeRecord ? [...(feeRecord.termlyComponents || [])] : [];
        let notes = feeRecord ? feeRecord.notes || '' : 'No matching fee structure details found for components/notes.';

        // Add transport component if applicable and found in the feeRecord
        if (student.hasTransport && student.transportRoute && feeRecord && feeRecord.transportRoutes) {
            const routeKey = student.transportRoute.toLowerCase();
            const transportAmount = feeRecord.transportRoutes[routeKey];
            if (transportAmount !== undefined) {
                termlyComponents.push({ name: `Transport Fee (${student.transportRoute})`, amount: transportAmount });
                notes += (notes ? ' | ' : '') + `Transport fee for ${student.transportRoute} route included.`;
            }
        }
        
        const paymentHistory = await Payment.find({ student: student._id }).sort({ paymentDate: -1 });

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
