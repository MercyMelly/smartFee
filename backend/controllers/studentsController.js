const Student = require('../models/studentsDB');
const FeeStructure = require('../models/feeStructure');
const Payment = require('../models/paymentsDB');

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

    let feeRecord;
    let fallbackAttempted = false; 
    if (student.boardingStatus === 'Day' && student.hasTransport && student.transportRoute) {
      feeRecord = await FeeStructure.findOne({
        gradeLevel: student.gradeLevel,
        boardingStatus: 'Day',
        hasTransport: true,
        transportRoute: student.transportRoute,
      });
    }
    if (!feeRecord && student.boardingStatus === 'Day' && !student.hasTransport) {
      feeRecord = await FeeStructure.findOne({
        gradeLevel: student.gradeLevel,
        boardingStatus: 'Day',
        hasTransport: false,
        transportRoute: '', 
      });
    }
    if (!feeRecord && student.boardingStatus === 'Boarding') {
      feeRecord = await FeeStructure.findOne({
        gradeLevel: student.gradeLevel,
        boardingStatus: 'Boarding',
        hasTransport: false,
        transportRoute: '',
      });
    }
    if (!feeRecord && student.boardingStatus === 'Day' && student.hasTransport && !student.transportRoute) {
      fallbackAttempted = true;
      feeRecord = await FeeStructure.findOne({
        gradeLevel: student.gradeLevel,
        boardingStatus: 'Day',
        hasTransport: true, 
      });
    }
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
      });
    }

    const totalPaymentsMade = await Payment.aggregate([
      { $match: { student: student._id } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const feesPaidForLife = totalPaymentsMade.length > 0 ? totalPaymentsMade[0].total : 0;
    let totalTermlyFee = feeRecord.totalAmount;
    let components = feeRecord.components ? [...feeRecord.components] : [];
    let notes = feeRecord.notes || '';
    if (student.hasTransport && student.boardingStatus === 'Day' && student.transportRoute) {
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

exports.updateStudent = async (req, res) => {
  const { admissionNumber } = req.params;
  const { fullName, gradeLevel, gender, boardingStatus, hasTransport, transportRoute, parentName, parentPhone, parentEmail, parentAddress, currentBalance } = req.body;
  try {
      const student = await Student.findOne({ admissionNumber });
      if (!student) {
          return res.status(404).json({ message: 'Student not found.' });
      }
      if (fullName) student.fullName = fullName;
      if (gradeLevel) student.gradeLevel = gradeLevel;
      if (gender) student.gender = gender; 
      if (parentName) student.parentName = parentName;
      if (parentPhone) student.parentPhone = parentPhone;
      if (parentEmail !== undefined) student.parentEmail = parentEmail; 
      if (parentAddress !== undefined) student.parentAddress = parentAddress; 
      if (currentBalance !== undefined) student.currentBalance = currentBalance;
      if (boardingStatus) {
          student.boardingStatus = boardingStatus;
          if (boardingStatus === 'Boarding') {
              student.hasTransport = false;
              student.transportRoute = '';
          } else if (boardingStatus === 'Day') {
              student.hasTransport = hasTransport !== undefined ? hasTransport : student.hasTransport;
              student.transportRoute = student.hasTransport && transportRoute ? transportRoute : '';
          }
      } else { 
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

exports.getStudentProfile = async (req, res) => {
  try {
      const { admissionNumber } = req.params;

      const student = await Student.findOne({ admissionNumber });

      if (!student) {
          return res.status(404).json({ message: 'Student not found.' });
      }

      const query = {
          gradeLevel: student.gradeLevel,
          boardingStatus: student.boardingStatus,
          hasTransport: student.hasTransport,
      };

      let feeRecord = await FeeStructure.findOne(query).lean();

      if (!feeRecord) {
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
                  termlyComponents: [],
                  totalTermlyFee: 0,
                  feesPaid: student.feeDetails.feesPaid, 
                  remainingBalance: student.feeDetails.remainingBalance, 
                  notes: 'No matching fee structure found for current term.'
              },
              paymentHistory: await Payment.find({ student: student._id }).sort({ paymentDate: -1 }), 
          });
      }
      let totalTermlyFee = feeRecord.totalCalculated;
      let components = [...feeRecord.termlyComponents];
      let notes = '';

      if (student.hasTransport && student.transportRoute) {
          const routeKey = student.transportRoute.toLowerCase();
          const routeAmount = feeRecord.transportRoutes?.[routeKey]; 

          if (routeAmount !== undefined) { 
              totalTermlyFee += routeAmount;
              components.push({ name: `Transport (${student.transportRoute})`, amount: routeAmount });
          } else {
              notes = `Note: Transport route "${student.transportRoute}" not found in fee structure. Transport fee not included in total.`;
          }
      }

      const totalPaymentsMadeResult = await Payment.aggregate([
          { $match: { student: student._id } },
          { $group: { _id: null, total: { $sum: '$amountPaid' } } } 
      ]);
      const feesPaidForLife = totalPaymentsMadeResult.length > 0 ? totalPaymentsMadeResult[0].total : 0;
      const paymentHistory = await Payment.find({ student: student._id }).sort({ paymentDate: -1 }); 
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
              totalTermlyFee,
              feesPaid: feesPaidForLife,
              remainingBalance, 
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
