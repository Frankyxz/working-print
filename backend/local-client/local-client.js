const WebSocket = require("ws");
const net = require("net");
const snmp = require("net-snmp");
const ping = require("ping");

const PRINTER_IP = "192.168.10.187";
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

    if (message === "TEST: Hello from the React app!") {
      try {
        const printerStatus = await checkPrinterStatus();
        console.log("Printer status:", printerStatus);
        socket.send(`Printer status: ${printerStatus}`);

        // If the printer is reachable, print a long text
        if (printerStatus.includes("reachable")) {
          printLongText();
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

  // Sample long text to print
  const longText =
    "                 DUALTECH             \n" +
    "Transaction No.:         20241009C0004\n" +
    "Terminal:                      Cashier\n" +
    "Cashier:                      	Cashier\n" +
    "Trans. Date:       10/09/2024/, 3:00PM\n" +
    "ID. No.:       			          1031231\n" +
    "Name:       			         Franco Smith\n" +
    "Initial Balance:      			      25000\n" +
    "Remaining Balance:      		      55000\n" +
    "--------------------------------------\n" +
    "Qty       Desc        Price     Amount\n";

  // Create a socket to connect to the printer
  const client = new net.Socket();

  client.connect(printerPort, printerHost, () => {
    console.log("Connected to printer");

    // Here we send the long text to the printer
    // ESC/POS commands for text formatting can be added here if necessary
    client.write(longText + "\n"); // Send the text to the printer
    client.write(Buffer.from([0x1d, 0x56, 0x41, 0x00])); // Command to cut paper, if needed

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
