import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, privilegeLevel }) => {
  const user = JSON.parse(sessionStorage.getItem("user"));
  if (!user || user.privileges < privilegeLevel) {
    return <Navigate to="/" />;
  }
  return children;
};

export default ProtectedRoute;
