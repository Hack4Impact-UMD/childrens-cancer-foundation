import React, { useState } from "react";
import "./Sidebar.css";
import { Link } from "react-router-dom"
import { SideBarTypes, differentUserRoles } from '../../types/sidebar-types';

interface SidebarProps {
  links: SideBarTypes[];
  role: differentUserRoles; 
}

const Sidebar: React.FC<SidebarProps> = ({ links, role }) => {
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
            <Link to={link.path} key={index}>
              <li className="sidebar-item">
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

