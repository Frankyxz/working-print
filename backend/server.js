const express = require("express");
const cors = require("cors");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const app = express();
const WebSocket = require("ws");
const dotenv = require("dotenv");
dotenv.config();

const port = process.env.PORT || 8086;
app.use(cors());
app.use(express.json({ limit: "500mb" }));
app.use(
  bodyParser.urlencoded({
    limit: "500mb",
    extended: true,
    parameterLimit: 100000,
  })
);

// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "http://192.168.10.126:3000");

//   res.header(
//     "Access-Control-Allow-Methods",
//     "GET, POST, OPTIONS, PUT, PATCH, DELETE"
//   );
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept, Authorization"
//   );
//   res.header("Access-Control-Allow-Credentials", "true");
//   next();
// });

//Routes:

const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

app.use(express.json());
app.use(cookieParser());

const masterRoute = require("./routes/employee.route");
app.use("/masterList", masterRoute);

// WebSocket Server
const server = require("http").createServer(app);
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws, req) => {
  console.log("Client connected to WebSocket");

  ws.on("message", (message) => {
    const messageStr = message.toString();
    console.log("Received:", messageStr);

    // Determine if the message is from React
    const isFromReactApp = req.headers.origin === "https://g-pos.vercel.app";

    if (isFromReactApp) {
      console.log("Message from React app:", messageStr);

      // Relay the message to the local client (assumes only one local client)
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(messageStr);
        }
      });
    }

    // Relay local client message back to React app
    if (!isFromReactApp) {
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(messageStr);
        }
      });
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
