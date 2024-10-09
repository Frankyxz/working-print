const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const pdfPrinter = require("pdf-to-printer");

// To ensure the position of the value is always in the right side corner
function trimWidth(doc, name) {
  const pageWidth = doc.page.width;
  return pageWidth - doc.widthOfString(name.toString()) - 10;
}

const filePath = path.join(__dirname, "../receipt.pdf");
const filePath2 = path.join(__dirname, "../orderNum.pdf");
const filePathLoad = path.join(__dirname, "../load.pdf");
const filePathMultiple = path.join(__dirname, "../multip.pdf");
const filePathBulk = path.join(__dirname, "../bulk.pdf");

// Note for aligning the receipt:
//  Y coordinate is a must if you want to align the word in one row.
// If label yung word (Ex. Transaction Number:) yung X nya dapat is always 0 para nasa pinaka left side corner
// then always use the trimWidth function para naman sa value nung label na yon (Ex. 20240913C0001) para always syang nasa right side kahit gano pa sya kaikli or kahaba
// then sa Y naman dapat parehas sila para align sa iisang row lang
// See the line 47 to 49 for clear example

// Another note: Always convert the integer value to String
const kioskReceiptGenerate = (
  kioskOrder,
  kioskCart,
  kioskStudent,
  printAfterGenerate = false,
  printStub = false,
  mealType = []
) => {
  const doc = new PDFDocument({
    size: [210.77, 500], // 210.77 is the width of paper
    margin: 0,
  });

  // Pipe the PDF into a file
  doc.pipe(fs.createWriteStream("receipt.pdf"));
  doc.fontSize(14).text("DUALTECH", 65, 5);

  doc.moveDown();
  doc.fontSize(10);

  const startX = 20;
  const startY = 30;

  doc.moveDown();

  // Alway plus 12 lang sa startY para bumaba

  doc.fontSize(9).text("Transaction Number:", 0, startY);
  let transacNum = kioskOrder.order_number;
  doc.text(transacNum, trimWidth(doc, transacNum), startY);

  //Terminal
  doc.text("Terminal:", 0, startY + 12);
  let terminalName = "Kiosk";
  doc.text(terminalName, trimWidth(doc, terminalName), startY + 12);

  //Cashier name
  doc.text("Cashier:", 0, startY + 24);
  let cashierName = "Kiosk";
  doc.text(cashierName, trimWidth(doc, cashierName), startY + 24);

  //Payment Method
  doc.text("Payment Method:", 0, startY + 36);
  let paymentMethod = kioskOrder.payment_method;
  doc.text(paymentMethod, trimWidth(doc, paymentMethod), startY + 36);

  //Transaction Date
  doc.text("Transaction Date:", 0, startY + 48);
  let date = kioskOrder.createdAt.toLocaleString();
  doc.text(date, trimWidth(doc, date), startY + 48);

  // ID Number
  doc.text("ID No.:", 0, startY + 60);
  let idNo = kioskStudent.student.student_number;
  doc.text(idNo, trimWidth(doc, idNo), startY + 60);

  // Name
  doc.text("Name:", 0, startY + 72);
  let studName = `${kioskStudent.student.first_name} ${kioskStudent.student.last_name}`;
  doc.text(studName, trimWidth(doc, studName), startY + 72);

  // Initial Balance
  doc.text("Initial Balance:", 0, startY + 84);
  let initialBal = kioskOrder.purchased_balance.toString();
  doc.text(initialBal, trimWidth(doc, initialBal), startY + 84);

  // Remaining Balance
  doc.text("Remaning Balance:", 0, startY + 96);
  let remainBal = kioskStudent.balance.toString();
  doc.text(remainBal, trimWidth(doc, remainBal), startY + 96);

  doc.text(
    "-------------------------------------------------------------------",
    0,
    startY + 109
  );

  const columnWidth = 80;
  const rowHeight = 10;

  // Start of Table

  doc.text("Qty", 1, startY + 121);
  doc.text("Description", startX + columnWidth - 59, startY + 121);
  doc.text("Price", startX + columnWidth + 20, startY + 121);
  doc.text("Subtotal", startX + columnWidth + 60, startY + 121);

  doc.text(
    "-------------------------------------------------------------------",
    0,
    startY + 134
  );

  //Order Type
  doc.text(kioskOrder.order_type, startX + columnWidth - 13, startY + 146);

  doc.text("", startX + columnWidth - 13, startY + 163);

  let tableStartY = 175;
  let currentY = tableStartY + rowHeight + 5;

  kioskCart.forEach((row) => {
    const productName =
      row.variantNames !== "" ? `${row.name} (${row.variantNames})` : row.name;

    doc.text(row.quantity, 1, currentY);
    doc.text(productName, startX + columnWidth - 59, currentY, {
      width: columnWidth,
    });
    doc.text(row.price, startX + columnWidth + 20, currentY);
    doc.text(row.subtotal, startX + columnWidth + 70, currentY);

    // Adjust Y position if description is super haba na for example if yung productName is mahaba yung name
    // bababa nalang sya ng kusa
    currentY += Math.max(
      doc.heightOfString(productName, { width: columnWidth }),
      rowHeight
    );
  });

  // Note if magdadagdag ng another row sa baba ng table:
  // Always gamitin yung currentY kasi lagi nag babago yung haba nung table

  doc.text(
    "-------------------------------------------------------------------",
    0,
    currentY
  );

  //Payable amount
  doc.text("Total:", 0, currentY + 13);
  let total = kioskOrder.payable_amount.toString();
  doc.text(total, trimWidth(doc, total), currentY + 13);

  doc.text("Tap Card:", 0, currentY + 25);
  let tapCard = kioskOrder.payable_amount.toString();
  doc.text(tapCard, trimWidth(doc, tapCard), currentY + 25);

  doc.text("Amount Tendered:", 0, currentY + 37);
  let tendered = kioskOrder.payable_amount.toString();
  doc.text(tendered, trimWidth(doc, tendered), currentY + 37);

  doc.text("Change:", 0, currentY + 49);
  let change = kioskOrder.change_amount.toString();
  doc.text(change, trimWidth(doc, change), currentY + 49);

  doc.text(
    "-------------------------------------------------------------------",
    0
  );

  doc.text("This document is not valid", 50, currentY + 80);
  doc.text("For claim of input tax", 60, currentY + 92);

  doc.text("ELI IT Solutions 2024", 60, currentY + 123);

  doc.end();

  if (printAfterGenerate) {
    const allStudentMeals = kioskCart.every(
      (item) =>
        item.category.includes("Student Meal - Breakfast") ||
        item.category.includes("Student Meal - Lunch") ||
        item.category.includes("Student Meal - Dinner")
    );

    const printableOrder = kioskCart.filter(
      (item) =>
        item.printable === true &&
        !(
          item.category.includes("Student Meal - Breakfast") ||
          item.category.includes("Student Meal - Lunch") ||
          item.category.includes("Student Meal - Dinner")
        )
    );

    setTimeout(() => {
      pdfPrinter
        .print(filePath, { printer: "TP808S" })
        .then(() => {
          // For Generating the Order Number para mag partial cut kuno
          pdfPrinter
            .getPrinters()
            .then((printers) => {
              console.log("Available Printers:", printers);
            })
            .catch((err) => {
              console.error("Error fetching printers:", err);
            });

          if (!allStudentMeals && printableOrder.length >= 1) {
            kioskOrderNumGenerate(
              kioskOrder.order_number,
              kioskOrder.createdAt
            );

            setTimeout(() => {
              pdfPrinter
                .print(filePath2, { printer: "TP808S" })
                .then(() => {
                  if (printStub) {
                    mealType.forEach((meal, index) => {
                      const fileStub = path.join(__dirname, `../${meal}.pdf`);
                      generateStub(meal, kioskOrder);
                      setTimeout(() => {
                        pdfPrinter
                          .print(fileStub)
                          .then(() => console.log(`Print ${meal}`))
                          .catch((err) => {
                            console.error(err);
                            res.sendStatus(500);
                          });
                      }, 1000 * (index + 1));
                    });
                  }
                })
                .catch((err) => {
                  console.error(err);
                  res.sendStatus(500);
                });
            }, 1000);
          } else {
            if (printStub) {
              mealType.forEach((meal, index) => {
                const fileStub = path.join(__dirname, `../${meal}.pdf`);
                generateStub(meal, kioskOrder);
                setTimeout(() => {
                  pdfPrinter
                    .print(fileStub, { printer: "TP808S" })
                    .then(() => console.log(`Print ${meal}`))
                    .catch((err) => {
                      console.error(err);
                      res.sendStatus(500);
                    });
                }, 1000 * (index + 1));
              });
            }
          }
        })
        .catch((err) => {
          console.error(err);
        });
    }, 1000);
  }
};

//Generating the order number for Kiosk
const kioskOrderNumGenerate = (orderNum, orderDate) => {
  const doc = new PDFDocument({
    size: [210.77, 500],
    margin: 0,
  });

  doc.pipe(fs.createWriteStream("orderNum.pdf"));

  doc
    .fontSize(9)
    .text(
      "-------------------------------------------------------------------",
      0
    );
  doc.fontSize(9).text("Order #", 1, 20);
  let date = orderDate.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  doc.text(date, trimWidth(doc, date), 20);

  doc.fontSize(25).text(orderNum, 10, 33);

  doc
    .fontSize(9)
    .text(
      "-------------------------------------------------------------------",
      0,
      60
    );

  doc.end();
};

// Function Generate receipt for kitchen
const generateKitchenReceipt = (newOrder, cart, printAfterGenerate = false) => {
  const filePath = path.join(__dirname, "../kiosk.pdf");

  const doc = new PDFDocument({
    size: [210.77, 500], // Width for receipt
    margin: 0,
  });

  doc.pipe(fs.createWriteStream("kiosk.pdf"));

  doc.fontSize(15).text("KITCHEN", 70, 5);

  // Order number
  const kitchenNum = newOrder.order_number;
  doc.fontSize(20).text(`${kitchenNum}`, 28, 33);

  doc.moveDown();
  doc.fontSize(10);

  // Table layout
  const startX = 20;
  const startY = 70;
  const columnWidth = 120;
  const rowHeight = 20;

  doc.moveDown();
  // Draw table headers
  doc.text("Description", startX, startY);
  doc.text("Quantity", startX + columnWidth, startY);

  // Line below headers
  doc
    .moveTo(1, startY + rowHeight / 2)
    .lineTo(1 + columnWidth * 2, startY + rowHeight / 2)
    .stroke();

  // Position for the first row
  let currentY = startY + rowHeight + 5;

  // Table rows
  cart.forEach((row) => {
    const productName =
      row.variantNames !== "" ? `${row.name} (${row.variantNames})` : row.name;

    doc.text(productName, startX, currentY, { width: columnWidth });
    doc.text(row.quantity, startX + columnWidth + 10, currentY);

    // Adjust Y position if description is super haba na
    currentY += Math.max(
      doc.heightOfString(row.description, { width: columnWidth }),
      rowHeight
    );
  });

  // Line after the items
  doc
    .moveTo(1, currentY + 5)
    .lineTo(1 + columnWidth * 2, currentY + 5)
    .stroke();

  // Date and time
  const dateY = currentY + 20;
  const orderCreateTime = new Date(newOrder.createdAt).toLocaleString();
  doc.text("Date & Time:", 1, dateY);
  doc.text(`${orderCreateTime}`, startX + 75, dateY);

  // Finish PDF generation
  doc.end();

  if (printAfterGenerate) {
    setTimeout(() => {
      pdfPrinter
        .print(filePath, { printer: "kitchen" })
        .then(() => console.log("Printer"))
        .catch((err) => {
          console.error(err);
        });
    }, 1000);
  }
};

const generateKitchenReceiptCashier = (
  newOrder,
  cart,
  printAfterGenerate = false
) => {
  const filePath = path.join(__dirname, `../cashier.pdf`);

  const doc = new PDFDocument({
    size: [210.77, 500], // Width for receipt
    margin: 0,
  });

  doc.pipe(fs.createWriteStream(`cashier.pdf`));

  doc.fontSize(15).text("KITCHEN", 70, 5);

  // Order number
  const kitchenNum = newOrder.order_number;
  doc.fontSize(20).text(`${kitchenNum}`, 28, 33);

  doc.moveDown();
  doc.fontSize(10);

  // Table layout
  const startX = 20;
  const startY = 70;
  const columnWidth = 120;
  const rowHeight = 20;

  doc.moveDown();
  // Draw table headers
  doc.text("Description", startX, startY);
  doc.text("Quantity", startX + columnWidth, startY);

  // Line below headers
  doc
    .moveTo(1, startY + rowHeight / 2)
    .lineTo(1 + columnWidth * 2, startY + rowHeight / 2)
    .stroke();

  // Position for the first row
  let currentY = startY + rowHeight + 5;

  // Table rows
  cart.forEach((row) => {
    const productName =
      row.variantNames !== "" ? `${row.name} (${row.variantNames})` : row.name;

    doc.text(productName, startX, currentY, { width: columnWidth });
    doc.text(row.quantity, startX + columnWidth + 10, currentY);

    // Adjust Y position if description is super haba na
    currentY += Math.max(
      doc.heightOfString(row.description, { width: columnWidth }),
      rowHeight
    );
  });

  // Line after the items
  doc
    .moveTo(1, currentY + 5)
    .lineTo(1 + columnWidth * 2, currentY + 5)
    .stroke();

  // Date and time
  const dateY = currentY + 20;
  const orderCreateTime = new Date(newOrder.createdAt).toLocaleString();
  doc.text("Date & Time:", 1, dateY);
  doc.text(`${orderCreateTime}`, startX + 75, dateY);

  // Finish PDF generation
  doc.end();

  if (printAfterGenerate) {
    setTimeout(() => {
      pdfPrinter
        .print(filePath, { printer: "kitchen" })
        .then(() => console.log("Printer"))
        .catch((err) => {
          console.error(err);
        });
    }, 1000);
  }
};

const generateLoadReceipt = (
  student,
  amount,
  user,
  loadTransac,
  printAfterGenerate = false
) => {
  const doc = new PDFDocument({
    size: [210.77, 500], // 210.77 is the width of paper
    margin: 0,
  });

  // Pipe the PDF into a file
  doc.pipe(fs.createWriteStream("load.pdf"));
  doc.fontSize(14).text("DUALTECH", 65, 5);

  doc.moveDown();
  doc.fontSize(10);

  const startX = 20;
  const startY = 30;

  doc.moveDown();

  // Alway plus 12 lang sa startY para bumaba

  doc.fontSize(9).text("Card Number:", 0, startY);
  let studentRFID = student.student.rfid;
  doc.text(studentRFID, trimWidth(doc, studentRFID), startY);

  doc.fontSize(9).text("Student ID:", 0, startY + 12);
  let studentID = student.student.student_number;
  doc.text(studentID, trimWidth(doc, studentID), startY + 12);

  doc.fontSize(9).text("Loaded By:", 0, startY + 24);
  doc.text(user, trimWidth(doc, user), startY + 24);

  doc.text("Date & Time:", 0, startY + 36);
  let date = loadTransac.toLocaleString();
  doc.text(date, trimWidth(doc, date), startY + 36);

  doc.text(
    "-------------------------------------------------------------------",
    0,
    startY + 48
  );

  doc.text("Customer Name:", 0, startY + 60);
  doc.text("Subtotal", trimWidth(doc, "Subtotal"), startY + 60);

  doc.text(
    `${student.student.first_name} ${student.student.last_name}`,
    0,
    startY + 72
  );
  doc.text(amount, trimWidth(doc, amount.toString()), startY + 72);

  doc.text(
    "-------------------------------------------------------------------",
    0,
    startY + 84
  );

  doc.text("Initial Balance:", 0, startY + 96);
  const initialBal = student.balance - amount;
  doc.text(initialBal, trimWidth(doc, initialBal.toString()), startY + 96);

  doc.text("Load Amount:", 0, startY + 108);
  doc.text(amount, trimWidth(doc, amount), startY + 108);

  doc.text("Total Balance:", 0, startY + 120);
  doc.text(
    student.balance,
    trimWidth(doc, student.balance.toString()),
    startY + 120
  );

  doc.text(
    "-------------------------------------------------------------------",
    0,
    startY + 132
  );

  doc.text("This document is not valid", 50, 184);
  doc.text("For claim of input tax", 60, 196);

  doc.text("ELI IT Solutions 2024", 60, 225);

  doc.end();

  if (printAfterGenerate) {
    setTimeout(() => {
      pdfPrinter
        .print(filePathLoad, { printer: "Load" })
        .then(() => {
          console.log("print");
        })
        .catch((err) => {
          console.error(err);
        });
    }, 1000);
  }
};

const generateLoadMultiple = (
  countStudent,
  amount,
  user,
  printAfterGenerate = false
) => {
  const doc = new PDFDocument({
    size: [210.77, 500], // 210.77 is the width of paper
    margin: 0,
  });

  // Pipe the PDF into a file
  doc.pipe(fs.createWriteStream("multip.pdf"));
  doc.fontSize(14).text("DUALTECH", 65, 5);

  doc.moveDown();
  doc.fontSize(10);

  const startX = 20;
  const startY = 30;

  doc.moveDown();

  // Alway plus 12 lang sa startY para bumaba

  doc.fontSize(9).text("Card Number:", 0, startY);
  const totalCard = `${countStudent} cards`;
  doc.text(totalCard, trimWidth(doc, totalCard), startY);

  doc.fontSize(9).text("Student ID:", 0, startY + 12);
  const totalStudent = `${countStudent} student ID`;
  doc.text(totalStudent, trimWidth(doc, totalStudent), startY + 12);

  doc.fontSize(9).text("Loaded By:", 0, startY + 24);
  doc.text(user, trimWidth(doc, user), startY + 24);

  const now = new Date();
  const dateTimeString = now.toLocaleString();

  doc.fontSize(9).text("Date & Time:", 0, startY + 36);
  doc.text(dateTimeString, trimWidth(doc, dateTimeString), startY + 36);

  doc.text(
    "-------------------------------------------------------------------",
    0,
    startY + 48
  );

  doc.fontSize(9).text("Customer Name:", 0, startY + 60);
  doc.text("Subtotal", trimWidth(doc, "Subtotal"), startY + 60);

  const stud = `${countStudent} customer loaded`;
  doc.text(stud, 0, startY + 72);
  doc.text(amount, trimWidth(doc, amount), startY + 72);

  doc.text(
    "-------------------------------------------------------------------",
    0,
    startY + 84
  );

  doc.fontSize(9).text("Total Load:", 0, startY + 96);
  const overall = countStudent * amount;
  doc.text(overall, trimWidth(doc, overall), startY + 96);

  doc.text(
    "-------------------------------------------------------------------",
    0,
    startY + 108
  );

  doc.text("This document is not valid", 50, 164);
  doc.text("For claim of input tax", 60, 176);

  doc.text("ELI IT Solutions 2024", 60, 210);

  doc.end();

  if (printAfterGenerate) {
    setTimeout(() => {
      pdfPrinter
        .print(filePathMultiple, { printer: "Load" })
        .then(() => {
          console.log("print");
        })
        .catch((err) => {
          console.error(err);
        });
    }, 1000);
  }
};

const generateLoadBulk = (
  countStudent,
  amount,
  user,
  printAfterGenerate = false
) => {
  const doc = new PDFDocument({
    size: [210.77, 500], // 210.77 is the width of paper
    margin: 0,
  });

  // Pipe the PDF into a file
  doc.pipe(fs.createWriteStream("bulk.pdf"));
  doc.fontSize(14).text("DUALTECH", 65, 5);

  doc.moveDown();
  doc.fontSize(10);

  const startX = 20;
  const startY = 30;

  doc.moveDown();

  console.log(amount);

  // Alway plus 12 lang sa startY para bumaba

  doc.fontSize(9).text("Card Number:", 0, startY);
  const totalCard = `${countStudent} cards`;
  doc.text(totalCard, trimWidth(doc, totalCard), startY);

  doc.fontSize(9).text("Student ID:", 0, startY + 12);
  const totalStudent = `${countStudent} student ID`;
  doc.text(totalStudent, trimWidth(doc, totalStudent), startY + 12);

  doc.fontSize(9).text("Loaded By:", 0, startY + 24);
  doc.text(user, trimWidth(doc, user), startY + 24);

  const now = new Date();
  const dateTimeString = now.toLocaleString();

  doc.fontSize(9).text("Date & Time:", 0, startY + 36);
  doc.text(dateTimeString, trimWidth(doc, dateTimeString), startY + 36);

  doc.text(
    "-------------------------------------------------------------------",
    0,
    startY + 48
  );

  doc.fontSize(9).text("Customer Name:", 0, startY + 60);
  doc.text("Total", trimWidth(doc, "Total"), startY + 60);

  const stud = `${countStudent} customer loaded`;
  doc.text(stud, 0, startY + 72);
  doc.text(amount, trimWidth(doc, amount), startY + 72);

  doc.text(
    "-------------------------------------------------------------------",
    0,
    startY + 84
  );

  doc.text("This document is not valid", 50, 164);
  doc.text("For claim of input tax", 60, 176);

  doc.text("ELI IT Solutions 2024", 60, 210);

  doc.end();

  if (printAfterGenerate) {
    setTimeout(() => {
      pdfPrinter
        .print(filePathBulk, { printer: "Load" })
        .then(() => {
          console.log("print");
        })
        .catch((err) => {
          console.error(err);
        });
    }, 1000);
  }
};

const generateStub = (meal, kioskOrder) => {
  const doc = new PDFDocument({
    size: [210.77, 500],
    margin: 0,
  });

  doc.pipe(fs.createWriteStream(`${meal}.pdf`));

  doc
    .fontSize(9)
    .text(
      "-------------------------------------------------------------------",
      0
    );
  doc.fontSize(9).text(`Food Stub # ${kioskOrder.order_number}`, 1, 20);
  let date = kioskOrder.createdAt.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  doc.text(date, trimWidth(doc, date), 20);

  doc.fontSize(25).text(`${meal} - Meal`, 10, 33);

  doc
    .fontSize(9)
    .text(
      "-------------------------------------------------------------------",
      0,
      60
    );

  doc.end();
};

module.exports = {
  kioskReceiptGenerate,
  generateKitchenReceipt,
  generateKitchenReceiptCashier,
  generateLoadReceipt,
  generateLoadMultiple,
  generateLoadBulk,
};
