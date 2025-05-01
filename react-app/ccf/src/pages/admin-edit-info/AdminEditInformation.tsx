import "./AdminEditInformation.css";
import logo from "../../assets/ccf-logo.png";
import Sidebar from "../../components/sidebar/Sidebar";
import { useState, useEffect } from "react";
// import { FaSearch } from "react-icons/fa";
import MoreTimeIcon from '@mui/icons-material/MoreTime';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { TextField, Button } from '@mui/material';

import { updateCurrentCycleDeadlines } from "../../backend/application-cycle";
import { getSidebarbyRole } from "../../types/sidebar-types";

function AdminEditInformation(): JSX.Element {
    const [nextGenDate, setNextGenDate] = useState<Dayjs | null>(dayjs('2025-06-01'));
    const [researchDate, setResearchDate] = useState<Dayjs | null>(dayjs('2025-06-01'));
    const [nonResearchDate, setNonResearchDate] = useState<Dayjs | null>(dayjs('2025-06-01'));
    const [reviewerDate, setReviewerDate] = useState<Dayjs | null>(dayjs('2025-06-01'));
    
    
    const [appDeadlineMessage, setAppDeadlineMessage] = useState<string | null>(null);
    const [revDeadlineMessage, setRevDeadlineMessage] = useState<string | null>(null);

    const handleNextGenChange = (newNextGenDate: Dayjs | null) => {
        setNextGenDate(newNextGenDate);
    };

    const handleResearchChange = (newResearchDate: Dayjs | null) => {
        setResearchDate(newResearchDate);
    };

    const handleNonResearchChange = (newNonResearchDate: Dayjs | null) => {
        setNonResearchDate(newNonResearchDate);
    };

    const handleReviewerDateChange = (newReviewerDate: Dayjs | null) => {
        setReviewerDate(newReviewerDate);
    }

    const sidebarItems = getSidebarbyRole("admin")

    return (
        <div>
            <Sidebar links={sidebarItems} />
            <div className="dashboard-container">
                <div className="edit-info-dashboard-header-container">
                    <img src={logo} className="edit-info-logo" alt="logo" />
                    <h1 className="edit-info-header">
                        Edit Information
                    </h1>
                </div>
                <div className="sections-container">
                    <div className="deadlines-section">
                        <div className="deadlines-header-container">
                            <MoreTimeIcon />
                            <h2 className="deadlines-header-text">Deadlines for Current Cycle</h2>
                        </div>
                    </div>
                    <div className="deadline-interactives">
                        <h2>Applications:</h2>
                        <div className="interactive-date-selector">
                            <h2>NextGen Grant Application</h2>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    value={nextGenDate}
                                    onChange={handleNextGenChange}
                                    enableAccessibleFieldDOMStructure={false}
                                    sx={{
                                        backgroundColor: '#79747E'
                                    }}
                                    slots={{
                                        textField: (props: any) => (
                                            <TextField
                                                {...props}
                                                sx={{
                                                    '& .MuiInputBase-input': {
                                                        textAlign: 'center',
                                                        height: '8px',
                                                        width: '150px',
                                                        color: '#79747E'
                                                    },
                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                        border: '2px solid #79747E',
                                                        borderRadius: '15px'
                                                    },
                                                }}
                                            />
                                        ),
                                    }}
                                />
                            </LocalizationProvider>
                        </div>
                        <div className="interactive-date-selector">
                            <h2>Research Grant Application</h2>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    value={researchDate}
                                    onChange={handleResearchChange}
                                    enableAccessibleFieldDOMStructure={false}
                                    sx={{
                                        backgroundColor: '#79747E'
                                    }}
                                    slots={{
                                        textField: (props: any) => (
                                            <TextField
                                                {...props}
                                                sx={{
                                                    '& .MuiInputBase-input': {
                                                        textAlign: 'center',
                                                        height: '8px',
                                                        width: '150px',
                                                        color: '#79747E'
                                                    },
                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                        border: '2px solid #79747E',
                                                        borderRadius: '15px'
                                                    },
                                                }}
                                            />
                                        ),
                                    }}
                                />
                            </LocalizationProvider>
                        </div>
                        <div className="interactive-date-selector">
                            <h2>Non-Research Grant Application</h2>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    value={nonResearchDate}
                                    onChange={handleNonResearchChange}
                                    enableAccessibleFieldDOMStructure={false}
                                    sx={{
                                        backgroundColor: '#79747E'
                                    }}
                                    slots={{
                                        textField: (props: any) => (
                                            <TextField
                                                {...props}
                                                sx={{
                                                    '& .MuiInputBase-input': {
                                                        textAlign: 'center',
                                                        height: '8px',
                                                        width: '150px',
                                                        color: '#79747E'
                                                    },
                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                        border: '2px solid #79747E',
                                                        borderRadius: '15px'
                                                    },
                                                }}
                                            />
                                        ),
                                    }}
                                />
                            </LocalizationProvider>
                        </div>
                        
                            <Button
                                variant="contained"
                                onClick={async () => {
                                    const success = await updateCurrentCycleDeadlines({
                                      nextGenDate,
                                      researchDate,
                                      nonResearchDate
                                    });
                                    
                                    //debug
                                    if (success) {
                                      console.log("Application deadlines updated.");
                                      setAppDeadlineMessage("Application Deadlines Updated!");
                                          setTimeout(() => setAppDeadlineMessage(null), 3000); // clear after 3 seconds
                                    }
                                  }}
                                sx={{
                                    backgroundColor: '#79747E',
                                    fontFamiy: 'Roboto, sans-serif',
                                    textTransform: 'none',
                                    height: '40px',
                                    fontSize: '1.25rem',
                                    fontWeight: 'normal',
                                    borderRadius: '10px',
                                    '&:hover': {
                                        backgroundColor: '#003E83'
                                    },
                                    marginBottom: '10px',
                                    marginTop: '10px'
                                }}

                            >{appDeadlineMessage ?? "Set Application Deadline"}</Button>
                        
                    </div>
                    <div className="deadline-interactives">
                        <h2>Reviews:</h2>
                        <div className="interactive-date-selector">
                            <h2>Reviewer Responses</h2>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    value={reviewerDate}
                                    onChange={handleReviewerDateChange}
                                    enableAccessibleFieldDOMStructure={false}
                                    sx={{
                                        backgroundColor: '#79747E',
                                    }}
                                    slots={{
                                        textField: (props: any) => (
                                            <TextField
                                                {...props}
                                                sx={{
                                                    '& .MuiInputBase-input': {
                                                        textAlign: 'center',
                                                        height: '8px',
                                                        width: '150px',
                                                        color: '#79747E',
                                                    },
                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                        border: '2px solid #79747E',
                                                        borderRadius: '15px'
                                                    },
                                                }}
                                            />
                                        ),
                                    }}
                                    
                                />
                            </LocalizationProvider>
                        </div>
                            <Button
                                variant="contained"
                                onClick={async () => {
                                    const success = await updateCurrentCycleDeadlines({
                                      reviewerDate
                                    });
                                    
                                    //debug
                                    if (success) {
                                      console.log("Reviewer deadline updated.");
                                      setRevDeadlineMessage("Reviewer Deadlines Updated!");
                                          setTimeout(() => setRevDeadlineMessage(null), 3000); // clear after 3 seconds
                                    }
                                  }}
                                sx={{
                                    backgroundColor: '#79747E',
                                    fontFamiy: 'Roboto, sans-serif',
                                    textTransform: 'none',
                                    height: '40px',
                                    fontSize: '1.25rem',
                                    fontWeight: 'normal',
                                    borderRadius: '10px',
                                    '&:hover': {
                                        backgroundColor: '#003E83'
                                    },
                                    marginBottom: '10px',
                                    marginTop: '10px'
                                }}

                            >{revDeadlineMessage ?? "Set Reviewer Deadline"}</Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminEditInformation;