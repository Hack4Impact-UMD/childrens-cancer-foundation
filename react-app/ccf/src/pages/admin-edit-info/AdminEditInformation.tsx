import "./AdminEditInformation.css";
import logo from "../../assets/ccf-logo.png";
import Sidebar from "../../components/sidebar/Sidebar";
import { useState, useEffect } from "react";
import MoreTimeIcon from '@mui/icons-material/MoreTime';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { TextField, Button, CircularProgress, Snackbar, Switch, Box, Typography } from '@mui/material';

import {
    updateCurrentCycleDeadlines,
    updateCycleStage,
    getCurrentCycle,
    endCurrentCycleAndStartNewOne
} from '../../backend/application-cycle';
import { getSidebarbyRole } from "../../types/sidebar-types";
import ApplicationCycle from "../../types/applicationCycle-types";
import { FAQItem } from "../../types/faqTypes";
import { getFAQs, initializeSampleFAQs, createNewFAQ } from "../../backend/faq-handler";
import EditableFAQComponent from "../../components/faq/FaqEditableComp";
import { Edit } from "lucide-react";

function AdminEditInformation(): JSX.Element {
    const [allApplicationsDate, setAllApplicationsDate] = useState<Dayjs | null>(dayjs('2025-06-01'));
    const [reviewerDate, setReviewerDate] = useState<dayjs.Dayjs | null>(null);
    const [postGrantReportDate, setPostGrantReportDate] = useState<dayjs.Dayjs | null>(null);
    // Current stage of application cycle
    const [currentStage, setCurrentStage] = useState<string | null>(null);
    const [stageSaving, setStageSaving] = useState(false); // shows button spinner
    const [stageSnack, setStageSnack] = useState<string | null>(null); // snackbar text

    const [appDeadlineMessage, setAppDeadlineMessage] = useState<string | null>(null);
    const [revDeadlineMessage, setRevDeadlineMessage] = useState<string | null>(null);
    const [postGrantReportDeadlineMessage, setPostGrantReportDeadlineMessage] = useState<string | null>(null);

    const [faqData, setFAQData] = useState<FAQItem[]>([]);
    const [showNewFAQForm, setShowNewFAQForm] = useState<boolean>(false);
    const [newFAQQuestion, setNewFAQQuestion] = useState<string>('');
    const [newFAQAnswer, setNewFAQAnswer] = useState<string>('');
    const [isCreatingFAQ, setIsCreatingFAQ] = useState<boolean>(false);

    useEffect(() => {
        getFAQs().then(faqs => {
            setFAQData(faqs)
        })
    }, []);

    const cycleStages: ApplicationCycle["stage"][] = [
        "Applications Open",
        "Applications Closed",
        "Review",
        "Grading",
        "Final Decisions"
    ];

    const handleAllApplicationsChange = (newDate: Dayjs | null) => {
        setAllApplicationsDate(newDate);
    };

    const handleReviewerDateChange = (newReviewerDate: Dayjs | null) => {
        setReviewerDate(newReviewerDate);
    }

    const handlePostGrantReportDateChange = (newPostGrantReportDate: Dayjs | null) => {
        setPostGrantReportDate(newPostGrantReportDate);
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

    const handleCreateNewFAQ = async () => {
        if (!newFAQQuestion.trim() || !newFAQAnswer.trim()) {
            alert('Please fill in both question and answer fields.');
            return;
        }

        setIsCreatingFAQ(true);
        try {
            await createNewFAQ(newFAQQuestion, newFAQAnswer);

            // Refresh FAQ data
            const updatedFaqs = await getFAQs();
            setFAQData(updatedFaqs);

            // Reset form
            setNewFAQQuestion('');
            setNewFAQAnswer('');
            setShowNewFAQForm(false);

            alert('New FAQ created successfully!');
        } catch (error) {
            console.error('Error creating new FAQ:', error);
            alert('Error creating new FAQ. Please try again.');
        } finally {
            setIsCreatingFAQ(false);
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
                            <h2>All Applications</h2>
                            <div className="deadline-section">
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        value={allApplicationsDate}
                                        onChange={handleAllApplicationsChange}
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
                                <Button
                                    variant="contained"
                                    onClick={async () => {
                                        const success = await updateCurrentCycleDeadlines({
                                            allApplicationsDate
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
                                        fontFamily: 'Roboto, sans-serif',
                                        textTransform: 'none',
                                        height: '40px',
                                        fontSize: '1.25rem',
                                        fontWeight: 'normal',
                                        borderRadius: '10px',
                                        '&:hover': {
                                            backgroundColor: '#003E83'
                                        },
                                        minWidth: 'auto !important',
                                        width: 'auto !important',
                                        whiteSpace: 'nowrap',
                                        marginBottom: '10px',
                                        marginTop: '10px',
                                    }}

                                >{appDeadlineMessage ?? "Set Application Deadline"}</Button>
                            </div>
                        </div>
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
                    <div className="deadline-interactives">
                        <h2>Post-Grant Reports:</h2>
                        <div className="interactive-date-selector">
                            <h2>Post-Grant Report Deadline</h2>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    value={postGrantReportDate}
                                    onChange={handlePostGrantReportDateChange}
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
                            <Button
                                variant="contained"
                                onClick={async () => {
                                    const success = await updateCurrentCycleDeadlines({
                                        postGrantReportDate
                                    });

                                    if (success) {
                                        console.log("Post-grant report deadline updated.");
                                        setPostGrantReportDeadlineMessage("Post-Grant Report Deadline Updated!");
                                        setTimeout(() => setPostGrantReportDeadlineMessage(null), 3000);
                                    }
                                }}
                                sx={{
                                    backgroundColor: '#79747E',
                                    fontFamily: 'Roboto, sans-serif',
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
                            >{postGrantReportDeadlineMessage ?? "Set Post-Grant Report Deadline"}</Button>
                        </div>
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
                            <h2>Update Frequently Asked Questions:</h2>

                            {/* FAQ Management Buttons */}
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                                <Button
                                    variant="contained"
                                    onClick={async () => {
                                        try {
                                            await initializeSampleFAQs();
                                            // Refresh FAQ data
                                            const updatedFaqs = await getFAQs();
                                            setFAQData(updatedFaqs);
                                            alert('Sample FAQs initialized successfully!');
                                        } catch (error) {
                                            console.error('Error initializing FAQs:', error);
                                            alert('Error initializing FAQs. Please try again.');
                                        }
                                    }}
                                    sx={{
                                        backgroundColor: '#79747E',
                                        fontFamily: 'Roboto, sans-serif',
                                        textTransform: 'none',
                                        height: '40px',
                                        fontSize: '1rem',
                                        fontWeight: 'normal',
                                        borderRadius: '10px',
                                        '&:hover': {
                                            backgroundColor: '#003E83'
                                        }
                                    }}
                                >
                                    Initialize Sample FAQs
                                </Button>

                                <Button
                                    variant="contained"
                                    onClick={() => setShowNewFAQForm(!showNewFAQForm)}
                                    sx={{
                                        backgroundColor: '#4CAF50',
                                        fontFamily: 'Roboto, sans-serif',
                                        textTransform: 'none',
                                        height: '40px',
                                        fontSize: '1rem',
                                        fontWeight: 'normal',
                                        borderRadius: '10px',
                                        '&:hover': {
                                            backgroundColor: '#45a049'
                                        }
                                    }}
                                >
                                    {showNewFAQForm ? 'Cancel' : 'Add New FAQ'}
                                </Button>
                            </div>

                            {/* New FAQ Form */}
                            {showNewFAQForm && (
                                <Box
                                    sx={{
                                        border: '2px solid #ddd',
                                        borderRadius: '10px',
                                        padding: '20px',
                                        marginBottom: '20px',
                                        backgroundColor: '#f9f9f9'
                                    }}
                                >
                                    <Typography variant="h6" sx={{ marginBottom: '15px', color: '#333' }}>
                                        Create New FAQ
                                    </Typography>

                                    <TextField
                                        label="Question"
                                        value={newFAQQuestion}
                                        onChange={(e) => setNewFAQQuestion(e.target.value)}
                                        variant="outlined"
                                        fullWidth
                                        multiline
                                        rows={2}
                                        sx={{ marginBottom: '15px' }}
                                        placeholder="Enter the frequently asked question..."
                                    />

                                    <TextField
                                        label="Answer"
                                        value={newFAQAnswer}
                                        onChange={(e) => setNewFAQAnswer(e.target.value)}
                                        variant="outlined"
                                        fullWidth
                                        multiline
                                        rows={4}
                                        sx={{ marginBottom: '15px' }}
                                        placeholder="Enter the answer (supports markdown formatting)..."
                                    />

                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <Button
                                            variant="contained"
                                            onClick={handleCreateNewFAQ}
                                            disabled={isCreatingFAQ || !newFAQQuestion.trim() || !newFAQAnswer.trim()}
                                            sx={{
                                                backgroundColor: '#4CAF50',
                                                fontFamily: 'Roboto, sans-serif',
                                                textTransform: 'none',
                                                height: '40px',
                                                fontSize: '1rem',
                                                fontWeight: 'normal',
                                                borderRadius: '10px',
                                                '&:hover': {
                                                    backgroundColor: '#45a049'
                                                },
                                                '&:disabled': {
                                                    backgroundColor: '#cccccc'
                                                }
                                            }}
                                        >
                                            {isCreatingFAQ ? 'Creating...' : 'Create FAQ'}
                                        </Button>

                                        <Button
                                            variant="outlined"
                                            onClick={() => {
                                                setShowNewFAQForm(false);
                                                setNewFAQQuestion('');
                                                setNewFAQAnswer('');
                                            }}
                                            sx={{
                                                fontFamily: 'Roboto, sans-serif',
                                                textTransform: 'none',
                                                height: '40px',
                                                fontSize: '1rem',
                                                fontWeight: 'normal',
                                                borderRadius: '10px'
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </Box>
                            )}

                            <EditableFAQComponent faqs={faqData} />
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