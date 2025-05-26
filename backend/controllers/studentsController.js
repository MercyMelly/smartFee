const Student = require('../models/studentsDB'); 

exports.registerStudent = async (req, res) => {
  try {
    const {
      fullName,
      admissionNumber,
      class: studentClass,
      parentName,
      parentPhone,
      totalFees,
      balance,
    } = req.body;
    const exists = await Student.findOne({ admissionNumber });
    if (exists) {
      return res.status(400).json({ message: 'Student already registered' });
    }

    const student = new Student({
      fullName,
      admissionNumber,
      class: studentClass,
      parentName,
      parentPhone,
      totalFees,
      balance,
    });
    await student.save();
    res.status(201).json({ message: 'Student registered', student });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getStudentByAdmission = async (req, res) => {
  try {
    const student = await Student.findOne({ admissionNumber: req.params.admissionNumber });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
