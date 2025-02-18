import React, { useState } from "react";
import "./Sidebar.css";
import SidebarProps from "../../types/sidebar-types";
import { Link } from "react-router-dom"

const Sidebar: React.FC<SidebarProps> = ({ links }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

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
      {!isCollapsed && (
        <ul className="sidebar-menu">
          {links.map((link, index) => (
            <Link to={link.path}>
            <li key={index} className="sidebar-item">
              {link.name}
            </li>
            </Link>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Sidebar;
