import React from 'react';
import { Route, Navigate, Outlet } from 'react-router-dom';
import Cookies from 'js-cookie';
import { jwtDecode } from "jwt-decode";

const ProtectedRoute = ({ element, authorizedRoles }) => {
    const token = Cookies.get('token');

    if (!token) { //user not logged in
        return <Navigate to="/login" replace />;
    }

    let decodedToken;
    try {
        decodedToken = jwtDecode(token);
    } catch (err) {
        Cookies.remove('token');
        return <Navigate to="/login" replace />;
    }
    const userType = decodedToken.role;
    const now = Date.now() / 1000;

    if (decodedToken.exp && decodedToken.exp < now) {
        Cookies.remove('token');
        return <Navigate to="/login" replace />;
    }

    if (!authorizedRoles.includes(userType)) { // incorrect user type
        return <Navigate to="/unauthorized" replace />; 
    }

    return element ? element : <Outlet />;
};

export default ProtectedRoute;