const PDFDocument = require('pdfkit');
const fs = require('fs'); 
const path = require('path');


async function generateReceiptPdf(paymentData, studentData,currentBalance) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        doc.fontSize(24)
           .fillColor('#1B5E20') 
           .font('Helvetica-Bold')
           .text('TINDIRET EDUCATIONAL CENTRE', { align: 'center' });
        doc.fontSize(12)
           .fillColor('#333')
           .font('Helvetica')
           .text('P.O. Box 122 - 30100, Songhor, Kenya', { align: 'center' })
           .text('Phone: +254 722 640 651 | Email: tindiretedu@gmail.com', { align: 'center' });
        doc.moveDown();
        doc.rect(50, doc.y - 10, doc.page.width - 100, 1).fill('#1B5E20');
        doc.moveDown(2);

        doc.fontSize(18)
           .fillColor('#000')
           .font('Helvetica-Bold')
           .text('OFFICIAL RECEIPT', { align: 'center' });
        doc.moveDown();

        const receiptDate = new Date().toLocaleDateString('en-GB', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        const paymentDateTime = new Date(paymentData.paymentDate).toLocaleDateString('en-GB', {
             year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        doc.fontSize(11).font('Helvetica');
        doc.text(`Receipt No:    ${paymentData.transactionReference || 'N/A'}`, { align: 'left', continued: true })
           .text(`Date: ${receiptDate}`, { align: 'right' });
        doc.moveDown(0.5);
        doc.text(`Payment Date: ${paymentDateTime}`, { align: 'left' });
        doc.moveDown(1);

        doc.fontSize(14).font('Helvetica-Bold').text('Payer & Student Details:', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica');
        doc.text(`Payer Name: ${paymentData.payerName || 'N/A'}`);
        doc.text(`Student Name: ${studentData.fullName}`);
        doc.text(`Admission No: ${studentData.admissionNumber}`);
        doc.text(`Grade Level: ${studentData.gradeLevel}`);
        doc.moveDown(1);

        doc.fontSize(14).font('Helvetica-Bold').text('Payment Summary:', { underline: true });
        doc.moveDown(0.5);

        const tableTop = doc.y;
        const col1X = 50;
        const col2X = 200;
        const col3X = 400;

        doc.font('Helvetica-Bold')
           .text('Description', col1X, tableTop + 10)
           .text('Method', col2X, tableTop + 10)
           .text('Amount (KES)', col3X, tableTop + 10);

        doc.rect(col1X, tableTop + 30, doc.page.width - 100, 1).fill('#888').stroke();

        doc.font('Helvetica').fontSize(11);
        let currentY = tableTop + 45;

        let description = 'Term Fees Payment';
        if (paymentData.paymentMethod === 'In-Kind') {
            description = `${paymentData.inKindItemType} (${paymentData.inKindQuantity} units)`;
        }

        doc.text(description, col1X, currentY)
           .text(paymentData.paymentMethod, col2X, currentY)
           .text(paymentData.amountPaid.toLocaleString('en-KE'), col3X, currentY, { align: 'right' });
        currentY += 20; 

        doc.rect(col1X, currentY + 5, doc.page.width - 100, 1).fill('#888').stroke(); 

        doc.moveDown();

        doc.font('Helvetica-Bold').fontSize(12)
           .text(`Total Amount Paid: KES ${paymentData.amountPaid.toLocaleString('en-KE')}`, { align: 'right' });
        doc.moveDown(0.5);
        // doc.text(`Remaining Balance: KES ${currentBalance.toLocaleString('en-KE')}`, { align: 'right' });
        doc.moveDown(2);

        if (paymentData.notes) {
            doc.fontSize(11).font('Helvetica-Bold').text('Notes:');
            doc.font('Helvetica').text(paymentData.notes);
            doc.moveDown();
        }

        doc.fontSize(10).font('Helvetica-Oblique')
           .text('Thank you for your payment.', 50, doc.page.height - 70, { align: 'center' });
        doc.text('----------------------------------', 50, doc.page.height - 60, { align: 'right' });
        doc.text('Bursar\'s Signature/Stamp', 50, doc.page.height - 50, { align: 'right' });
        doc.text(`Generated on ${new Date().toLocaleDateString('en-GB')}`, 50, doc.page.height - 30, { align: 'left' });

        doc.end();
    });
}

module.exports = { generateReceiptPdf };