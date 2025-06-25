const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

async function generateReceiptPdf(paymentData, studentData, currentBalance) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            if (buffers.length > 0) {
                resolve(Buffer.concat(buffers));
            } else {
                reject(new Error("PDF buffer is empty."));
            }
        });

        doc.on('error', (err) => {
            reject(err);
        });

        try {
            const logoPath = path.join(__dirname, 'assets', 'logo.png');
            if (fs.existsSync(logoPath)) {
                doc.image(logoPath, doc.page.width / 2 - 40, 50, { width: 80 });
                doc.moveDown(4);
            }

            // Header
            doc.fontSize(18).fillColor('#1B5E20').font('Helvetica-Bold')
                .text('TINDIRET EDUCATIONAL CENTRE', { align: 'center' });

            doc.fontSize(10).fillColor('#333').font('Helvetica')
                .text('P.O. Box 122 - 30100, Songhor, Kenya', { align: 'center' })
                .text('Phone: +254 722 640 651 | Email: tindiretedu@gmail.com', { align: 'center' });

            doc.moveDown(1);
            doc.rect(50, doc.y, doc.page.width - 100, 1).fill('#1B5E20');
            doc.moveDown(1.2);

            // Title
            doc.fontSize(15).fillColor('#000').font('Helvetica-Bold')
                .text('OFFICIAL RECEIPT', { align: 'center' });

            doc.moveDown(0.5);

            // Date & Reference
            const receiptDate = new Date().toLocaleDateString('en-GB', {
                year: 'numeric', month: 'long', day: 'numeric'
            });

            const paymentDateTime = paymentData.paymentDate
                ? new Date(paymentData.paymentDate).toLocaleDateString('en-GB', {
                    year: 'numeric', month: 'long', day: 'numeric',
                })
                : 'N/A';

            doc.fontSize(10).font('Helvetica')
                .text(`Receipt No: ${paymentData.transactionReference || 'N/A'}`, 50, doc.y)
                .text(`Receipt Date: ${receiptDate}`, 400, doc.y);

            doc.moveDown(0.5);
            doc.text(`Payment Date: ${paymentDateTime}`);

            doc.moveDown(0.7);
            
            
            // Payer & Student Info (on the left, aligned with receipt number)
            doc.moveDown(0.8); // add some spacing before this block if needed

            doc.fontSize(11).font('Helvetica-Bold')
               .text('Student Details:', 50, doc.y, { underline: true });

            doc.moveDown(0.4);

            doc.fontSize(10).font('Helvetica')
               .text(`Payer Name: ${paymentData.payerName || 'N/A'}`, 50)
               .text(`Student Name: ${studentData.fullName || 'N/A'}`, 50)
               .text(`Admission No: ${studentData.admissionNumber || 'N/A'}`, 50)
               .text(`Grade Level: ${studentData.gradeLevel || 'N/A'}`, 50);



            // Payment Table
            doc.fontSize(11).font('Helvetica-Bold').text('Payment Summary:', { underline: true });
            doc.moveDown(0.4);

            const tableTop = doc.y;
            const col1 = 50, col2 = 220, col3 = 400;

            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('Description', col1, tableTop)
                .text('Method', col2, tableTop)
                .text('Amount (KES)', col3, tableTop);

            doc.moveTo(col1, tableTop + 15).lineTo(545, tableTop + 15).stroke('#888');

            let rowY = tableTop + 25;
            let description = 'Term Fees Payment';
            if (paymentData.paymentMethod === 'In-Kind') {
                description = `${paymentData.inKindItemType || 'Unknown Item'} (${paymentData.inKindQuantity || 0} units)`;
            }

            const formattedAmountPaid = typeof paymentData.amountPaid === 'number'
                ? paymentData.amountPaid.toLocaleString('en-KE')
                : 'N/A';

            doc.font('Helvetica').text(description, col1, rowY)
                .text(paymentData.paymentMethod || 'N/A', col2, rowY)
                .text(formattedAmountPaid, col3, rowY, { align: 'right' });

            rowY += 20;

            doc.moveTo(col1, rowY).lineTo(545, rowY).stroke('#888');

            doc.font('Helvetica-Bold')
                .text(`Total Paid: KES ${formattedAmountPaid}`, 50, rowY + 10, { align: 'right' });

            const formattedRemainingBalance = typeof currentBalance === 'number'
                ? currentBalance.toLocaleString('en-KE')
                : 'N/A';

            doc.text(`Remaining Balance: KES ${formattedRemainingBalance}`, 50, rowY + 28, { align: 'right' });

            doc.moveDown(2);

            if (paymentData.notes) {
                doc.fontSize(10).font('Helvetica-Bold').text('Notes:');
                doc.font('Helvetica').text(paymentData.notes, {
                    width: doc.page.width - 100,
                    align: 'left',
                    lineGap: 2
                });
            }

            doc.end();

        } catch (err) {
            doc.end();
            reject(err);
        }
    });
}

module.exports = { generateReceiptPdf };
