// controllers/ussdController.js
// This is a conceptual example for USSD.
// It uses Africa's Talking USSD API structure.

// You'll need to store USSD session state. A simple in-memory object can work for small scale,
// but for production, use a database (e.g., Redis, MongoDB) for session persistence.
const ussdSessions = {}; // Key: sessionId, Value: { currentMenu: 'initial', phoneNumber: '...', studentAdmissionNumber: '...', selectedStudent: null, ... }

// Import necessary models
const Student = require('../models/studentsDB');
const FeeDeadline = require('../models/feeDeadline');

// Helper function to send USSD response
const sendUssdResponse = (res, message, type = 'CON') => {
    res.set('Content-Type', 'text/plain');
    res.send(`${type} ${message}`);
};

// Main USSD handler
// @route   POST /api/ussd
// @access  Public (Africa's Talking gateway will hit this)
const ussdCallback = async (req, res) => {
    const { sessionId, serviceCode, phoneNumber, text } = req.body; // phoneNumber is the USSD user's phone

    // Initialize session if new
    if (!ussdSessions[sessionId]) {
        ussdSessions[sessionId] = {
            currentMenu: 'initial',
            phoneNumber: phoneNumber, // Store the USSD user's phone number
            level: 0, // Helps track menu depth
            studentAdmissionNumber: null, // To store selected student's admission number
            studentsList: [], // To store list of students for selection
        };
    }

    const session = ussdSessions[sessionId];
    const input = text.split('*'); // USSD input often comes as `1*2*3` for menu navigation
    const lastInput = input[input.length - 1]; // Get the last input from the user (e.g., '1', '2', '001')

    let responseMessage = '';
    let responseType = 'CON';

    try {
        // --- Main Menu Logic ---
        if (session.level === 0 || text === '') { // Start or restart the menu
            responseMessage = `Welcome to School Parent Portal.\n`;
            responseMessage += `1. View My Student(s) Fees\n`;
            responseMessage += `2. View Fee Deadlines\n`;
            responseMessage += `3. Contact School`;
            session.currentMenu = 'main_menu';
            session.level = 1;
            // Clear any previous student selection on menu reset
            session.studentAdmissionNumber = null;
            session.studentsList = [];
        } else if (session.currentMenu === 'main_menu') {
            if (lastInput === '1') {
                // Option 1: View My Student(s) Fees
                const students = await Student.find({ 'parent.phone': phoneNumber }).select('fullName admissionNumber gradeLevel');
                session.studentsList = students; // Store the found students for later selection

                if (students.length === 0) {
                    responseMessage = `No students found linked to this phone number. Please ensure your registered phone number matches the school records or contact the school.`;
                    responseType = 'END';
                    delete ussdSessions[sessionId];
                } else if (students.length === 1) {
                    // If only one student, show their details directly
                    session.studentAdmissionNumber = students[0].admissionNumber;
                    session.currentMenu = 'student_details';
                    session.level = 2; // Move to student details submenu
                    responseMessage = `Student: ${students[0].fullName} (Adm No: ${students[0].admissionNumber})\n`;
                    responseMessage += `1. View Fee Statement\n`;
                    responseMessage += `2. View Payment History\n`;
                    responseMessage += `0. Back to Main Menu`;
                } else {
                    // Multiple students, ask user to select one
                    responseMessage = `Select student:\n`;
                    students.forEach((s, index) => {
                        responseMessage += `${index + 1}. ${s.fullName} (Adm No: ${s.admissionNumber})\n`;
                    });
                    responseMessage += `0. Back to Main Menu`;
                    session.currentMenu = 'select_student';
                    session.level = 2; // Move to student selection submenu
                }
            } else if (lastInput === '2') {
                // Option 2: View Fee Deadlines
                const deadlines = await FeeDeadline.find({ deadlineDate: { $gte: now } }).sort('deadlineDate');
                if (deadlines.length > 0) {
                    responseMessage = `Upcoming Fee Deadlines:\n`;
                    deadlines.forEach((d, index) => {
                        responseMessage += `${index + 1}. ${d.term} ${d.academicYear}: ${d.deadlineDate.toDateString()}\n`;
                    });
                } else {
                    responseMessage = `No upcoming fee deadlines found.`;
                }
                responseType = 'END'; // End session after displaying deadlines
                delete ussdSessions[sessionId];
            } else if (lastInput === '3') {
                // Option 3: Contact School
                responseMessage = `Please contact the school at: +2547XXXXXXXX or info@school.com. Thank you.`;
                responseType = 'END'; // End session after displaying contact info
                delete ussdSessions[sessionId];
            } else {
                // Invalid input for main menu
                responseMessage = `Invalid input for Main Menu. Please try again.\n`;
                responseMessage += `1. View My Student(s) Fees\n`;
                responseMessage += `2. View Fee Deadlines\n`;
                responseMessage += `3. Contact School`;
                // Keep session at level 1, main_menu
            }
        }
        // --- Student Selection Logic ---
        else if (session.currentMenu === 'select_student') {
            if (lastInput === '0') { // Back to Main Menu
                session.level = 0;
                session.currentMenu = 'initial'; // Reset state to re-display main menu
            } else {
                const studentIndex = parseInt(lastInput) - 1; // USSD inputs are 1-indexed for menus
                if (session.studentsList && session.studentsList[studentIndex]) {
                    session.studentAdmissionNumber = session.studentsList[studentIndex].admissionNumber;
                    session.currentMenu = 'student_details';
                    session.level = 3; // Move deeper into student details
                    const selectedStudent = await Student.findOne({ admissionNumber: session.studentAdmissionNumber });
                    responseMessage = `Student: ${selectedStudent.fullName} (Adm No: ${selectedStudent.admissionNumber})\n`;
                    responseMessage += `1. View Fee Statement\n`;
                    responseMessage += `2. View Payment History\n`;
                    responseMessage += `0. Back to Student List`; // Option to go back
                } else {
                    responseMessage = `Invalid student selection. Please enter a valid number.\n`;
                    responseMessage += `Select student:\n`;
                    session.studentsList.forEach((s, index) => {
                        responseMessage += `${index + 1}. ${s.fullName} (Adm No: ${s.admissionNumber})\n`;
                    });
                    responseMessage += `0. Back to Main Menu`;
                    // Keep session at select_student
                }
            }
        }
        // --- Student Details Logic ---
        else if (session.currentMenu === 'student_details' && session.studentAdmissionNumber) {
            if (lastInput === '0') { // Back to Student List (or Main Menu if only one student)
                const students = await Student.find({ 'parent.phone': phoneNumber }).select('fullName admissionNumber gradeLevel');
                session.studentsList = students;
                if (students.length > 1) { // If there were multiple students, go back to student list
                    session.currentMenu = 'select_student';
                    session.level = 2;
                    responseMessage = `Select student:\n`;
                    students.forEach((s, index) => {
                        responseMessage += `${index + 1}. ${s.fullName} (Adm No: ${s.admissionNumber})\n`;
                    });
                    responseMessage += `0. Back to Main Menu`;
                } else { // If only one student, go back to main menu
                    session.level = 0;
                    session.currentMenu = 'initial';
                }
            } else {
                const student = await Student.findOne({ admissionNumber: session.studentAdmissionNumber, 'parent.phone': phoneNumber });
                if (!student) {
                    responseMessage = `Error: Student data not found or not linked to your number.`;
                    responseType = 'END';
                    delete ussdSessions[sessionId];
                } else {
                    if (lastInput === '1') {
                        // View Fee Statement
                        const feeDetails = student.feeDetails;
                        responseMessage = `Fee Statement for ${student.fullName}:\n`;
                        responseMessage += `Total Termly: KSh ${feeDetails?.totalFees?.toLocaleString() || '0'}\n`;
                        responseMessage += `Paid: KSh ${feeDetails?.feesPaid?.toLocaleString() || '0'}\n`;
                        responseMessage += `Balance: KSh ${feeDetails?.remainingBalance?.toLocaleString() || '0'}\n`;

                        const currentMonth = now.getMonth();
                        let currentTerm = '';
                        if (currentMonth >= 0 && month <= 3) { currentTerm = 'Term 1'; }
                        else if (currentMonth >= 4 && month <= 7) { currentTerm = 'Term 2'; }
                        else if (currentMonth >= 8 && month <= 11) { currentTerm = 'Term 3'; }

                        const feeDeadline = await FeeDeadline.findOne({
                            academicYear: currentYear,
                            term: currentTerm,
                        });
                        if (feeDeadline) {
                            responseMessage += `Deadline: ${feeDeadline.deadlineDate.toLocaleDateString()}`;
                        } else {
                            responseMessage += `No deadline set for current term.`;
                        }
                        responseType = 'END'; // End session after displaying statement
                        delete ussdSessions[sessionId];
                    } else if (lastInput === '2') {
                        // View Payment History
                        const paymentHistory = student.paymentHistory;
                        if (paymentHistory && paymentHistory.length > 0) {
                            responseMessage = `Payment History for ${student.fullName}:\n`;
                            // Show last 3 payments, newest first
                            paymentHistory.slice().sort((a, b) => b.paymentDate - a.paymentDate).slice(0, 3).forEach((p, index) => {
                                responseMessage += `${index + 1}. KSh ${p.amountPaid.toLocaleString()} on ${new Date(p.paymentDate).toLocaleDateString()}\n`;
                            });
                            responseMessage += `More details online.`;
                        } else {
                            responseMessage = `No payment history found for ${student.fullName}.`;
                        }
                        responseType = 'END'; // End session after displaying history
                        delete ussdSessions[sessionId];
                    } else {
                        // Invalid input for student details menu
                        responseMessage = `Invalid input. Please try again.\n`;
                        responseMessage += `1. View Fee Statement\n`;
                        responseMessage += `2. View Payment History\n`;
                        responseMessage += `0. Back to Student List`;
                        // Keep session at student_details
                    }
                }
            }
        }
        // --- Fallback for unexpected states ---
        else {
            responseMessage = `An unexpected error occurred. Please try again.`;
            responseType = 'END';
            delete ussdSessions[sessionId];
        }

    } catch (error) {
        console.error('USSD Error:', error);
        responseMessage = `An internal error occurred. Please try again later.`;
        responseType = 'END';
        delete ussdSessions[sessionId];
    } finally {
        sendUssdResponse(res, responseMessage, responseType);
    }
};

module.exports = {
    ussdCallback,
};
