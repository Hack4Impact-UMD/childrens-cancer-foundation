import React, { useState } from "react";
import "./Sidebar.css";
import { Link } from "react-router-dom"
import { SideBarTypes, differentUserRoles } from '../../types/sidebar-types';
import MenuIcon from '@mui/icons-material/Menu';

interface SidebarProps {
  links: SideBarTypes[];
}

const Sidebar: React.FC<SidebarProps> = ({ links }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={isCollapsed ? "sidebar collapsed" : "sidebar"}>
      <div className="sidebar-header">
        <MenuIcon 
          onClick={toggleSidebar}
          sx = {{ 
            display: 'flex',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'white'
          }}
        />
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

