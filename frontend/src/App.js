import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import EmployeeList from "./modules/UserManagement/EmployeeList.jsx";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <>
            <Route path="/user-management" element={<EmployeeList />} />
          </>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
