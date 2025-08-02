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
import MarkdownPreviewer from '../../components/markdown/Markdown';
import { TextField, Button, CircularProgress, Snackbar } from '@mui/material';

import {
    updateCurrentCycleDeadlines,
    updateCycleStage,
    getCurrentCycle,
    endCurrentCycleAndStartNewOne
} from '../../backend/application-cycle';
import { getSidebarbyRole } from "../../types/sidebar-types";
import { Modal } from "../../components/modal/modal";
import ApplicationCycle from "../../types/applicationCycle-types";

function AdminEditInformation(): JSX.Element {
    const [nextGenDate, setNextGenDate] = useState<Dayjs | null>(dayjs('2025-06-01'));
    const [researchDate, setResearchDate] = useState<Dayjs | null>(dayjs('2025-06-01'));
    const [nonResearchDate, setNonResearchDate] = useState<Dayjs | null>(dayjs('2025-06-01'));
    const [reviewerDate, setReviewerDate] = useState<dayjs.Dayjs | null>(null);
    // Current stage of application cycle
    const [currentStage, setCurrentStage] = useState<string | null>(null);
    const [stageSaving, setStageSaving] = useState(false); // shows button spinner
    const [stageSnack, setStageSnack] = useState<string | null>(null); // snackbar text


    const [appDeadlineMessage, setAppDeadlineMessage] = useState<string | null>(null);
    const [revDeadlineMessage, setRevDeadlineMessage] = useState<string | null>(null);

    const cycleStages: ApplicationCycle["stage"][] = [
        "Applications Open",
        "Reviewing Applications",
        "Reviews Closed",
        "Final Decisions"
    ];


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

    useEffect(() => {
        const loadCycle = async () => {
            const data = await getCurrentCycle();
            if (data?.stage) {
                setCurrentStage(data.stage);
            }
        };
        loadCycle();
    }, []);

    const handleStageChange = async (newStage: ApplicationCycle["stage"]) => {
        if (newStage === currentStage) return; // no-op
        setStageSaving(true);


        const success = await updateCycleStage(newStage);
        setStageSaving(false);

        if (success) {
            setCurrentStage(newStage); // UI reflects change
            setStageSnack(`Stage updated to "${newStage}"`);
        } else {
            setStageSnack("Failed to update stage");
        }
    };

    const handleEndCurrentCycle = async () => {
        const newCycleName = window.prompt("Enter the name for the new application cycle (e.g., 2024-2025):");
        if (newCycleName) {
            const success = await endCurrentCycleAndStartNewOne(newCycleName);
            if (success) {
                window.location.reload();
            }
        }
    };

    return (
        <div>
            <Sidebar links={sidebarItems} />
            <div className="dashboard-container">
                <div className="edit-info-dashboard-header-container">
                    <img src={logo} className="edit-info-logo" alt="logo" />
                    <h1 className="edit-info-header">
                        Application Cycle
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
                    <div className="stage-toggle-section">
                        <h2>Current Stage: {currentStage ?? "Not set"}</h2>
                        <h2 className="stage-toggle-instruction">Select the current stage of the application cycle:</h2>
                        <div className="stage-buttons">
                            {cycleStages.map(stage => (
                                <Button
                                    key={stage}
                                    disabled={stageSaving}
                                    variant={currentStage === stage ? "contained" : "outlined"}
                                    onClick={() => handleStageChange(stage)}
                                    endIcon={stageSaving && currentStage === stage ? <CircularProgress size={18} /> : null}
                                >
                                    {stage}
                                </Button>
                            ))}
                        </div>
                        <Button
                            variant="contained"
                            onClick={handleEndCurrentCycle}
                            sx={{
                                backgroundColor: "#c41230",
                                color: "white",
                                fontFamily: 'Roboto, sans-serif',
                                textTransform: 'none',
                                height: '40px',
                                fontSize: '1.25rem',
                                fontWeight: 'normal',
                                borderRadius: '10px',
                                '&:hover': {
                                    backgroundColor: "#003E83"
                                },
                                width: '100%',
                                marginTop: '10px'
                            }}
                        >
                            End Current Cycle and Start New
                        </Button>
                    </div>
                    <div>
                        <div className="editable-info-section">
                            <h2>Markdown Previewer</h2>
                            <MarkdownPreviewer _previewOnly={false} />
                        </div>
                    </div>
                </div>

            </div>
            <Snackbar
                open={!!stageSnack}
                autoHideDuration={3000}
                onClose={() => setStageSnack(null)}
                message={stageSnack}
            />
        </div>
    )
}

export default AdminEditInformation;