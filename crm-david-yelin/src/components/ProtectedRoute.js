import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, privilegeLevel, extraAccess }) => {
  let user = JSON.parse(sessionStorage.getItem("user"));
  if (!user) {
    user = JSON.parse(localStorage.getItem("user"));
  }
  if (!user || user.privileges === 0) {
    return <Navigate to="/" />;
  }
  if (user.privileges < privilegeLevel) {
    return <Navigate to="/home" />;
  }
  if (Array.isArray(user.adminAccess) && Array.isArray(extraAccess)) {
    const hasAccess = (user.adminAccess.some((access) => extraAccess.includes(access)) || user.privileges >= 2);

    if (!hasAccess) {
      // Redirect to home if no access rights match
      return <Navigate to="/home" />;
    }
  }
  return children;
};

export default ProtectedRoute;
