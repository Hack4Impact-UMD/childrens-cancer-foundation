import { ReactNode } from "react";
import Sidebar from "../sidebar/Sidebar";
import Header from "../header/Header";
import { SideBarTypes } from "../../types/sidebar-types";
import "./DashboardLayout.css";

interface RoleDashboardShellProps {
  sidebarItems: SideBarTypes[];
  title: string;
  children: ReactNode;
  /** Extra class applied to the inner stack — lets a page keep its own
   *  scoped CSS hook (e.g. ".ApplicantDashboard") without re-rendering the frame. */
  stackClassName?: string;
}

function RoleDashboardShell({
  sidebarItems,
  title,
  children,
  stackClassName,
}: RoleDashboardShellProps): JSX.Element {
  const stackClass = stackClassName
    ? `dashboard-page-stack ${stackClassName}`
    : "dashboard-page-stack";

  return (
    <div>
      <Sidebar links={sidebarItems} />
      <div className="dashboard-page">
        <div className={stackClass}>
          <Header title={title} />
          {children}
        </div>
      </div>
    </div>
  );
}

export default RoleDashboardShell;
