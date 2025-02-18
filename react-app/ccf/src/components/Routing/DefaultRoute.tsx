import { getRole } from "../../services/auth_login"
import { Navigate } from 'react-router-dom';
import { useEffect, useState } from "react";

const DefaultRoute = () => {

    const getRoute = async () => {
        getRole().then((role) => {
            console.log(role)
            if (!role) {
                setTo("/login")
            } else if (role == "applicant") {
                setTo("/applicant-dashboard")
            } else if (role == "reviewer") {
                setTo("/reviewer-dashboard")
            } else if (role == "admin") {
                setTo("/admin-dashboard")
            }
        })
    }

    const [to, setTo] = useState<String>("/");

    useEffect(() => {
        getRoute()
    }, []);

    return <Navigate to={String(to)} replace={true}></Navigate>
}

export default DefaultRoute