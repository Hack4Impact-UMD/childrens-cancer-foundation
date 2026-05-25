import { ReactNode, useState } from "react";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";
import "./DashboardLayout.css";

interface DashboardSectionProps {
  title: string;
  icon?: ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  children: ReactNode;
}

function DashboardSection({
  title,
  icon,
  collapsible = true,
  defaultCollapsed = false,
  children,
}: DashboardSectionProps): JSX.Element {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className="dashboard-section">
      <div className="dashboard-section-header">
        <div className="dashboard-section-header-content">
          {icon}
          <h2>{title}</h2>
        </div>
        {collapsible && (
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="expand-collapse-btn"
            aria-expanded={!collapsed}
            aria-label={collapsed ? `Expand ${title}` : `Collapse ${title}`}
          >
            {collapsed ? <FaArrowDown /> : <FaArrowUp />}
          </button>
        )}
      </div>
      {!collapsed && children}
    </div>
  );
}

export default DashboardSection;
