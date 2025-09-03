import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { auth } from "../../index";
import "./EmailActionHandler.css";
import Button from "../../components/buttons/Button";
import { TextField, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

function EmailActionHandler() {
    const [searchParams] = useSearchParams();
    const [mode, setMode] = useState<string | null>(null);
    const [oobCode, setOobCode] = useState<string | null>(null);
    const [email, setEmail] = useState<string>("");
    const [newPassword, setNewPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isVerifying, setIsVerifying] = useState<boolean>(true);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

    const handleClickShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const handleClickShowConfirmPassword = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    useEffect(() => {
        const modeParam = searchParams.get('mode');
        const oobCodeParam = searchParams.get('oobCode');

        setMode(modeParam);
        setOobCode(oobCodeParam);

        if (modeParam === 'resetPassword' && oobCodeParam) {
            // Verify the password reset code
            verifyPasswordResetCode(auth, oobCodeParam)
                .then((email) => {
                    setEmail(email);
                    setIsVerifying(false);
                })
                .catch((error) => {
                    console.error('Error verifying reset code:', error);
                    setError('Invalid or expired reset link. Please request a new password reset.');
                    setIsVerifying(false);
                });
        } else {
            setError('Invalid email action link.');
            setIsVerifying(false);
        }
    }, [searchParams]);

    const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setMessage(null);

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        if (!oobCode) {
            setError('Invalid reset code.');
            return;
        }

        setIsLoading(true);

        try {
            await confirmPasswordReset(auth, oobCode, newPassword);
            setMessage('Password has been reset successfully! You can now log in with your new password.');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            console.error('Error resetting password:', error);
            if (error.code === 'auth/weak-password') {
                setError('Password is too weak. Please choose a stronger password.');
            } else if (error.code === 'auth/expired-action-code') {
                setError('Reset link has expired. Please request a new password reset.');
            } else if (error.code === 'auth/invalid-action-code') {
                setError('Invalid reset link. Please request a new password reset.');
            } else {
                setError('An error occurred while resetting your password. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'newPassword') {
            setNewPassword(value);
        } else if (name === 'confirmPassword') {
            setConfirmPassword(value);
        }
    };

    if (isVerifying) {
        return (
            <div className="container">
                <div className="content">
                    <div className="form">
                        <div className="logo">
                            <img src="/ccflogo.png" alt="Logo" className="logoImage" />
                        </div>
                        <h1 className="heading">Verifying Reset Link...</h1>
                        <p className="description">Please wait while we verify your password reset link.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (mode !== 'resetPassword') {
        return (
            <div className="container">
                <div className="content">
                    <div className="form">
                        <div className="logo">
                            <img src="/ccflogo.png" alt="Logo" className="logoImage" />
                        </div>
                        <h1 className="heading">Invalid Action</h1>
                        <p className="description">This email action is not supported.</p>
                        <div className="loginText">
                            <Link to="/login" className="backToLoginLink">
                                <u>Back to Login</u>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !email) {
        return (
            <div className="container">
                <div className="content">
                    <div className="form">
                        <div className="logo">
                            <img src="/ccflogo.png" alt="Logo" className="logoImage" />
                        </div>
                        <h1 className="heading">Reset Link Error</h1>
                        <p className="error">{error}</p>
                        <div className="loginText">
                            <Link to="/forgot-password" className="backToLoginLink">
                                <u>Request New Reset Link</u>
                            </Link>
                            <br />
                            <Link to="/login" className="backToLoginLink">
                                <u>Back to Login</u>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="content">
                <form className="form" onSubmit={handlePasswordReset}>
                    <div className="logo">
                        <img src="/ccflogo.png" alt="Logo" className="logoImage" />
                    </div>
                    <h1 className="heading">Reset Your Password</h1>
                    <p className="description">
                        Enter your new password for: <strong>{email}</strong>
                    </p>

                    <TextField
                        id="new-password"
                        label="New Password"
                        name="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        variant="outlined"
                        onChange={handleInputChange}
                        value={newPassword}
                        required
                        disabled={isLoading}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={handleClickShowPassword}
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            width: '90%',
                            paddingBottom: '20px'
                        }}
                    />

                    <TextField
                        id="confirm-password"
                        label="Confirm New Password"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        variant="outlined"
                        onChange={handleInputChange}
                        value={confirmPassword}
                        required
                        disabled={isLoading}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={handleClickShowConfirmPassword}
                                        edge="end"
                                    >
                                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            width: '90%',
                            paddingBottom: '20px'
                        }}
                    />

                    {error && <p className="error">{error}</p>}
                    {message && (
                        <>
                            <p className="success">{message}</p>
                            <div className="loginText">
                                <Link to="/login" className="backToLoginLink">
                                    <u>Go to Login</u>
                                </Link>
                            </div>
                        </>
                    )}

                    {!message && (
                        <Button
                            variant={"red"}
                            type={"submit"}
                            className={"button"}
                            disabled={isLoading}
                        >
                            <>
                                {isLoading ? "Resetting..." : "Reset Password"}
                            </>
                        </Button>
                    )}

                    {!message && (
                        <div className="loginText">
                            <Link to="/login" className="backToLoginLink">
                                <u>Back to Login</u>
                            </Link>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

export default EmailActionHandler;


