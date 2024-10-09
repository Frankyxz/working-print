import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../modules/Sidebar/header";
const Layout = () => {
  return (
    <>
      <div className="layout-container">
        <Header />
        <div className="content-container">
          <main>
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
};

export default Layout;
