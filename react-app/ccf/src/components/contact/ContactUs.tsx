import React from "react";
import "./ContactUs.css";
import Phone from "../../assets/call.png";
import Email from "../../assets/mail.png";
import ContactUsProps from "../../types/contact-us";


const ContactUs: React.FC<ContactUsProps> = ({ email, phone, hours }) => {
    return (
        <div className="contact-box">
            <div className="contact-method">
                <div className="contact-method-header">
                    <img src={Email} alt="Email Icon" className="contact-icon" />
                    <h2 className="contact-method-title">Email Support</h2>
                </div>
                <p className="contact-text">Email us and we'll get back to you as soon as possible.</p>
                <a href={`mailto:${email}`} className="contact-link">
                    {email}
                </a>
            </div>

            <div className="contact-method">
                <div className="contact-method-header">
                    <img src={Phone} alt="Phone Icon" className="contact-icon" />
                    <h2 className="contact-method-title">Call Support</h2>
                </div>
                <p className="contact-text">Call us and we'll get back to you as soon as possible.</p>
                <a href={`tel:${phone}`} className="contact-link">
                    {phone}
                </a>
                <p className="contact-hours">{hours}</p>
            </div>
        </div>
    );
};

export default ContactUs;
