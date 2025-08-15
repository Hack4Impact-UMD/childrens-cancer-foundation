import React, { useState, useEffect } from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import { getSidebarbyRole, getApplicantSidebarItems, SideBarTypes } from "../../types/sidebar-types";

function ResultsPage(): JSX.Element {
    const [sidebarItems, setSidebarItems] = useState<SideBarTypes[]>(getSidebarbyRole('applicant')); //to get applicaant info in sidebar

     useEffect(() => {
            // to get decision tab in the sidebar as well - copied from Applicant Decisions page
            getApplicantSidebarItems().then((items) => {
                setSidebarItems(items);
            }).catch((e) => {
                console.error('Error loading sidebar items:', e);
            });
    })

    return(
        <div>
        <Sidebar links={sidebarItems} />
        </div>
    );
};

export default ResultsPage;