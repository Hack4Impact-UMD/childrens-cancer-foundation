import React, { useState } from "react";
import "./Sidebar.css";

const Sidebar: React.FC = () => {
  // State to handle the collapsed/expanded state
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Function to toggle collapse
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={isCollapsed ? "sidebar collapsed" : "sidebar"}>
      <div className="sidebar-header">
        <button onClick={toggleSidebar} className="toggle-btn">
          {isCollapsed ? ">>>" : "<<<"}
        </button>
      </div>
      {/* Only show the menu when the sidebar is not collapsed */}
      {!isCollapsed && (
        <ul className="sidebar-menu">
          <li className="sidebar-item">Home</li>
          <li className="sidebar-item">Proposals</li>
          <li className="sidebar-item">Reviewers</li>
          <li className="sidebar-item">All Accounts</li>
          <li className="sidebar-item">Email Blast</li>
        </ul>
      )}
    </div>
  );
};

export default Sidebar;
