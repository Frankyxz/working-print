import React, { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../../assets/global/url";
import { Form, Button } from "react-bootstrap";
import swal from "sweetalert";

function EmployeeList() {
  const [socket, setSocket] = useState(null);
  const [printerStatus, setPrinterStatus] = useState("Unknown");
  const [UserName, setUserName] = useState("");

  useEffect(() => {
    const newSocket = new WebSocket("wss://working-print.onrender.com");

    newSocket.onopen = () => {
      console.log("Connected to WebSocket server");
      setSocket(newSocket);
    };

    newSocket.onmessage = (event) => {
      console.log("Received message from WebSocket:", event.data);
      if (event.data.startsWith("Printer status:")) {
        setPrinterStatus(event.data);
      }
      alert("Response received: " + event.data);
    };

    newSocket.onclose = () => {
      console.log("WebSocket connection closed");
      // Implement reconnection logic here
      setTimeout(() => {
        console.log("Attempting to reconnect...");
        setSocket(new WebSocket("wss://working-print.onrender.com"));
      }, 5000);
    };

    newSocket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      newSocket.close();
    };
  }, []);

  // const handleTestClick = async (e) => {
  //   e.preventDefault();
  //   axios
  //     .post(BASE_URL + "/masterList/create", {
  //       UserName,
  //     })
  //     .then((res) => {
  //       if (res.status === 200) {
  //         swal({
  //           title: "Customer created successfully",
  //           text: "The customer created successfully.",
  //           icon: "success",
  //           button: "OK",
  //         });
  //       }
  //     });
  //   if (socket && socket.readyState === WebSocket.OPEN) {
  //     socket.send("TEST: Hello from the React app!");
  //     alert("Message sent to the server. Waiting for response...");

  //     // Use the browser's printing capabilities
  //     if (window.testPrinterAndPrint) {
  //       const result = await window.testPrinterAndPrint();
  //       alert(result);
  //     } else {
  //       alert("Printing functionality not available in this environment");
  //     }
  //   } else {
  //     console.log("WebSocket not connected");
  //     alert("WebSocket not connected. Please try again later.");
  //   }
  // };

  const handleTestClick = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(BASE_URL + "/masterList/create", {
        UserName: UserName,
      });
      if (res.status === 200) {
        // swal({
        //   title: "Customer created successfully",
        //   text: "The customer created successfully.",
        //   icon: "success",
        //   button: "OK",
        // });
        if (socket && socket.readyState === WebSocket.OPEN) {
          const cart = [
            { id: 1, name: "Product 1", quantity: 2, price: 100 },
            { id: 2, name: "Product 2", quantity: 1, price: 50 },
          ];

          socket.send(JSON.stringify(cart));
          alert("Message sent to the server. Waiting for response...");

          // Use the browser's printing capabilities
          if (window.testPrinterAndPrint) {
            const result = await window.testPrinterAndPrint();
            alert(result);
          } else {
            alert("Printing functionality not available in this environment");
          }
        } else {
          console.log("WebSocket not connected");
          alert("WebSocket not connected. Please try again later.");
        }
      }
    } catch (error) {
      console.error("Error creating customer:", error);
      alert("An error occurred while creating the customer.");
    }
  };

  return (
    <div>
      <h1>Employee List</h1>
      <Form.Control
        type="text"
        placeholder="Name"
        value={UserName}
        onChange={(e) => setUserName(e.target.value)}
      />
      <button onClick={handleTestClick}>TEST</button>

      <p>Printer Status: {printerStatus}</p>
    </div>
  );
}

export default EmployeeList;
