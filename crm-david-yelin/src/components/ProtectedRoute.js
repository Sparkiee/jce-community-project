import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, privilegeLevel }) => {
  const user = JSON.parse(sessionStorage.getItem("user"));
  if (!user || user.privileges === 0) {
    return <Navigate to="/" />;
  }
  if(user.privileges < privilegeLevel) {
    return <Navigate to="/profile" />;
  }
  return children;
};

export default ProtectedRoute;
