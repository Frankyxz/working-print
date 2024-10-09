const WebSocket = require("ws");
const net = require("net");
const snmp = require("net-snmp");
const ping = require("ping");

const PRINTER_IP = "192.168.1.106";
const COMMON_PORTS = [631, 9100, 515];

let socket;

function connectWebSocket() {
  socket = new WebSocket("wss://working-print.onrender.com");

  socket.on("open", () => {
    console.log("Connected to WebSocket server on Render");
    socket.send("Hello from the Node.js client!");
  });

  socket.on("message", async (data) => {
    const message = data.toString();
    console.log("Received message from server:", message);

    if (message) {
      try {
        const printerStatus = await checkPrinterStatus();
        console.log("Printer status:", printerStatus);
        socket.send(`Printer status: ${printerStatus}`);

        // If the printer is reachable, print a long text
        if (printerStatus.includes("reachable")) {
          printLongText();
          printKitchenReceipt();
        }
      } catch (error) {
        console.error("Error checking printer status:", error);
        socket.send("Error checking printer status");
      }
    }
  });

  socket.on("error", (error) => {
    console.error("WebSocket error:", error);
  });

  socket.on("close", () => {
    console.log("Disconnected from WebSocket server");
    setTimeout(connectWebSocket, 5000);
  });
}

async function checkPrinterStatus() {
  try {
    const pingResult = await ping.promise.probe(PRINTER_IP);
    if (!pingResult.alive) {
      return "Printer is not responding to ping";
    }

    for (const port of COMMON_PORTS) {
      const isOpen = await checkPort(PRINTER_IP, port);
      if (isOpen) {
        return `Printer is reachable on port ${port}`;
      }
    }

    const snmpResult = await checkSNMP(PRINTER_IP);
    if (snmpResult) {
      return snmpResult;
    }

    return "Printer is reachable but no standard printing ports are open";
  } catch (error) {
    console.error("Error in checkPrinterStatus:", error);
    return "Error checking printer status";
  }
}

function checkPort(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);

    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });

    socket.on("error", () => {
      resolve(false);
    });

    socket.connect(port, host);
  });
}

function checkSNMP(host) {
  return new Promise((resolve) => {
    const session = snmp.createSession(host, "public");
    const oid = "1.3.6.1.2.1.43.10.2.1.4.1.1";

    session.get([oid], (error, varbinds) => {
      if (error) {
        console.error(error);
        resolve(null);
      } else {
        for (const vb of varbinds) {
          if (snmp.isVarbindError(vb)) {
            console.error(snmp.varbindError(vb));
            resolve(null);
          } else {
            resolve(`Printer status via SNMP: ${vb.value}`);
          }
        }
      }
      session.close();
    });

    setTimeout(() => {
      session.close();
      resolve(null);
    }, 5000);
  });
}

function printLongText() {
  console.log("Printing long text to the printer...");

  const printerPort = 9100; // Common port for HPRT printers
  const printerHost = PRINTER_IP; // Your printer's IP

  // const longText =
  //   "                 DUALTECH             \n" +
  //   "Transaction No.:         20241009C0004\n" +
  //   "Terminal:                      Cashier\n" +
  //   "Cashier:                      	Cashier\n" +
  //   "Trans. Date:       10/09/2024/, 3:00PM\n" +
  //   "ID. No.:       			          1031231\n" +
  //   "Name:       			         Franco Smith\n" +
  //   "Initial Balance:      			      25000\n" +
  //   "Remaining Balance:      		      55000\n" +
  //   "--------------------------------------\n" +
  //   "Qty       Desc        Price     Amount\n";

  // ESC/POS command for text alignment
  const alignCenter = Buffer.from([0x1b, 0x61, 0x01]); // Center text
  const alignLeft = Buffer.from([0x1b, 0x61, 0x00]); // Left align text
  const doubleSizeOn = Buffer.from([0x1d, 0x21, 0x11]);
  const tripleSizeOn = Buffer.from([0x1d, 0x21, 0x22]);
  const doubleSizeOff = Buffer.from([0x1d, 0x21, 0x00]);
  // Sample receipt data
  const storeName = "DUALTECH";
  const transactionNo = "20241009C0004";
  const terminal = "Cashier";
  const cashier = "Cashier";
  const transDate = "10/09/2024, 3:00PM";
  const idNo = "1031231";
  const name = "Franco Smith";
  const initialBalance = "250";
  const remainingBalance = "55000";

  const total = "100";
  const tapCard = "100";
  const tendered = "100";
  const change = "0";

  // Function to pad text for alignment
  function padText(label, value, totalLength = 48) {
    return label + value.padStart(totalLength - label.length);
  }
  function wrapText(text, maxLength) {
    let wrappedText = "";
    while (text.length > maxLength) {
      // Split the text at the maxLength, find the last space before maxLength
      let lastSpaceIndex = text.lastIndexOf(" ", maxLength);
      if (lastSpaceIndex === -1) {
        lastSpaceIndex = maxLength; // No space found, break at maxLength
      }
      // Add the wrapped line to the result
      wrappedText += text.substring(0, lastSpaceIndex).trim() + "\n";
      // Remove the wrapped part from the original text
      text = text.substring(lastSpaceIndex).trim();
    }
    // Add the remaining part
    wrappedText += text;
    return wrappedText;
  }
  const orderItems = [
    { qty: 2, desc: "Spaghetti", price: 5.0 },
    { qty: 1, desc: "Item 2", price: 15.0 },
    { qty: 3, desc: "Item 3", price: 7.5 },
  ];

  // Header with centered text
  let receiptText = "";
  receiptText += alignCenter;
  receiptText += doubleSizeOn; // Turn on double-size mode
  receiptText += "DUALTECH\n";
  receiptText += "\n";
  receiptText += doubleSizeOff;
  receiptText += alignLeft;

  // Transaction details with aligned values using `padText` function
  receiptText += padText("Transaction No.:", transactionNo) + "\n";
  receiptText += padText("Terminal:", terminal) + "\n";
  receiptText += padText("Cashier:", cashier) + "\n";
  receiptText += padText("Trans. Date:", transDate) + "\n";
  receiptText += padText("ID. No.:", idNo) + "\n";
  receiptText += padText("Name:", name) + "\n";
  receiptText += padText("Initial Balance:", initialBalance) + "\n";
  receiptText += padText("Remaining Balance:", remainingBalance) + "\n";

  // Divider and table header for items
  receiptText += "------------------------------------------------\n";
  receiptText += "Qty          Desc           Price         Amount\n";
  receiptText += "------------------------------------------------\n";

  let totalAmount = 0; // To calculate the total amount
  for (const item of orderItems) {
    const amount = item.qty * item.price; // Calculate amount for the item
    totalAmount += amount; // Add to total amount

    // Wrap the description if it's too long
    const wrappedDesc = wrapText(item.desc, 18).split("\n"); // Split into lines

    // Add each line of the wrapped description to the receipt text
    for (let i = 0; i < wrappedDesc.length; i++) {
      let line = padText(item.qty.toString(), wrappedDesc[i], 20);
      if (i === 0) {
        // For the first line, we also need to include the price and amount
        line +=
          item.price.toFixed(2).padStart(12) + amount.toFixed(2).padStart(15);
      } else {
        // For subsequent lines, just include spaces for price and amount
        line += "".padStart(14) + "".padStart(15);
      }
      receiptText += line + "\n";
    }
  }

  receiptText += "------------------------------------------------\n";

  receiptText += padText("Total:", total) + "\n";
  receiptText += padText("Tap Card:", terminal) + "\n";
  receiptText += padText("Amount Tendered:", tendered) + "\n";
  receiptText += padText("Change:", change) + "\n";

  receiptText += "------------------------------------------------\n";

  receiptText += "\n";
  receiptText += "\n";

  receiptText += alignCenter;
  receiptText += "This document is not valid\n";
  receiptText += "For claim of input tax\n";

  // For Student Breakfast Meal
  const studentOrderNumber = true;
  const studentBreakfast = true;
  const studentLunch = true;
  const studentDinner = true;

  let studentOrderNumberReceipt = "";
  let studentBreakFastReceipt = "";
  let studentLunchReceipt = "";
  let studentDinnerReceipt = "";

  //Order number
  studentOrderNumberReceipt +=
    "------------------------------------------------\n";

  studentOrderNumberReceipt +=
    padText("Order Num: 20241009C0005", "2024/12/25") + "\n";

  studentOrderNumberReceipt += "\n";
  studentOrderNumberReceipt += tripleSizeOn;
  studentOrderNumberReceipt += "20241009C00005\n";
  studentOrderNumberReceipt += doubleSizeOff;
  studentOrderNumberReceipt += "\n";

  studentOrderNumberReceipt +=
    "------------------------------------------------\n";

  //Breakfast
  studentBreakFastReceipt +=
    "------------------------------------------------\n";

  studentBreakFastReceipt +=
    padText("Food Stub Num: 20241009C0005", "2024/12/25") + "\n";

  studentBreakFastReceipt += "\n";
  studentBreakFastReceipt += tripleSizeOn;
  studentBreakFastReceipt += "Breakfast - Meal\n";
  studentBreakFastReceipt += doubleSizeOff;
  studentBreakFastReceipt += "\n";

  studentBreakFastReceipt +=
    "------------------------------------------------\n";

  //Breakfast

  //Lunch
  studentLunchReceipt += "------------------------------------------------\n";

  studentLunchReceipt +=
    padText("Food Stub Num: 20241009C0005", "2024/12/25") + "\n";

  studentLunchReceipt += "\n";
  studentLunchReceipt += tripleSizeOn;
  studentLunchReceipt += "Lunch - Meal\n";
  studentLunchReceipt += doubleSizeOff;
  studentLunchReceipt += "\n";

  studentLunchReceipt += "------------------------------------------------\n";

  //Lunch

  //Dinner
  studentDinnerReceipt += "------------------------------------------------\n";

  studentDinnerReceipt +=
    padText("Food Stub Num: 20241009C0005", "2024/12/25") + "\n";

  studentDinnerReceipt += "\n";
  studentDinnerReceipt += tripleSizeOn;
  studentDinnerReceipt += "Dinner - Meal\n";
  studentDinnerReceipt += doubleSizeOff;
  studentDinnerReceipt += "\n";

  studentDinnerReceipt += "------------------------------------------------\n";

  //Dinner

  // Create a socket to connect to the printer
  const client = new net.Socket();

  client.connect(printerPort, printerHost, () => {
    console.log("Connected to printer");

    // Here we send the long text to the printer
    // ESC/POS commands for text formatting can be added here if necessary
    client.write(receiptText + "\n"); // Send the text to the printer
    client.write(Buffer.from([0x1d, 0x56, 0x42, 0x00])); // Command to cut paper, if needed

    if (studentOrderNumber) {
      client.write(studentOrderNumberReceipt + "\n");
      client.write(Buffer.from([0x1d, 0x56, 0x42, 0x00]));
    }

    if (studentBreakfast) {
      client.write(studentBreakFastReceipt + "\n");
      client.write(Buffer.from([0x1d, 0x56, 0x42, 0x00]));
    }

    if (studentLunch) {
      client.write(studentLunchReceipt + "\n");
      client.write(Buffer.from([0x1d, 0x56, 0x42, 0x00]));
    }

    if (studentDinner) {
      client.write(studentDinnerReceipt + "\n");
      client.write(Buffer.from([0x1d, 0x56, 0x42, 0x00]));
    }
    // client.write(receiptText + "\n");
    // client.write(Buffer.from([0x1d, 0x56, 0x42, 0x00]));
    // Close the connection after sending the data
    client.end();
  });

  client.on("data", (data) => {
    console.log("Received data from printer:", data.toString());
  });

  client.on("error", (error) => {
    console.error("Error printing to printer:", error);
  });

  client.on("close", () => {
    console.log("Connection to printer closed");
  });
}

function printKitchenReceipt() {
  const alignCenter = Buffer.from([0x1b, 0x61, 0x01]); // Center text
  const alignLeft = Buffer.from([0x1b, 0x61, 0x00]); // Left align text
  const doubleSizeOn = Buffer.from([0x1d, 0x21, 0x11]);
  const tripleSizeOn = Buffer.from([0x1d, 0x21, 0x22]);
  const doubleSizeOff = Buffer.from([0x1d, 0x21, 0x00]);
  console.log("Printing long text to the printer...");

  const printerPort = 9100; // Common port for HPRT printers
  const printerHost = PRINTER_IP; // Your printer's IP

  // Function to pad text for alignment
  function wrapText(text, maxLength) {
    let wrappedText = "";
    while (text.length > maxLength) {
      // Find the last space before maxLength
      let lastSpaceIndex = text.lastIndexOf(" ", maxLength);
      if (lastSpaceIndex === -1) {
        lastSpaceIndex = maxLength; // No space found, break at maxLength
      }
      wrappedText += text.substring(0, lastSpaceIndex).trim() + "\n";
      text = text.substring(lastSpaceIndex).trim();
    }
    wrappedText += text;
    return wrappedText;
  }

  // Function to pad text for alignment
  function padText(quantity, description, qtyWidth, descWidth) {
    // Add spaces to quantity and description to fit respective widths
    return (
      quantity.padStart(qtyWidth) +
      "                       " +
      description.padEnd(descWidth)
    ); // Add space between Quantity and Description
  }
  const orderItems = [
    { qty: 2, desc: "Spaghetti" },
    { qty: 1, desc: "Item 2" },
    { qty: 3, desc: "Item 3" },
  ];

  // Header with centered text
  let receiptText = "";
  receiptText += alignCenter;
  receiptText += doubleSizeOn; // Turn on double-size mode
  receiptText += "KITCHEN\n";
  receiptText += "\n";
  receiptText += doubleSizeOff;
  receiptText += tripleSizeOn;
  receiptText += "20241009C00010\n";
  receiptText += doubleSizeOff;
  receiptText += alignLeft;

  // Divider and table header for items
  receiptText += "------------------------------------------------\n";
  receiptText += "   Quantity                    Description\n";
  receiptText += "------------------------------------------------\n";
  for (const item of orderItems) {
    // Wrap the description if it's too long
    const wrappedDesc = wrapText(item.desc, 30).split("\n"); // Adjust maxLength as needed

    // Process each line of the wrapped description
    for (let i = 0; i < wrappedDesc.length; i++) {
      // On the first line, include quantity
      if (i === 0) {
        receiptText +=
          padText(item.qty.toString(), wrappedDesc[i], 8, 60) + "\n";
      } else {
        // For subsequent lines, just include the description, without quantity
        receiptText += padText("", wrappedDesc[i], 8, 60) + "\n";
      }
    }
  }
  receiptText += "------------------------------------------------\n";

  // Create a socket to connect to the printer
  const client = new net.Socket();

  client.connect(printerPort, printerHost, () => {
    console.log("Connected to printer");

    // Here we send the long text to the printer
    // ESC/POS commands for text formatting can be added here if necessary
    client.write(receiptText + "\n"); // Send the text to the printer
    client.write(Buffer.from([0x1d, 0x56, 0x42, 0x00])); // Command to cut paper, if needed

    // client.write(receiptText + "\n");
    // client.write(Buffer.from([0x1d, 0x56, 0x42, 0x00]));
    // Close the connection after sending the data
    client.end();
  });

  client.on("data", (data) => {
    console.log("Received data from printer:", data.toString());
  });

  client.on("error", (error) => {
    console.error("Error printing to printer:", error);
  });

  client.on("close", () => {
    console.log("Connection to printer closed");
  });
}
connectWebSocket();
