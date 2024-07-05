import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, privilegeLevel }) => {
  let user = JSON.parse(sessionStorage.getItem("user"));
  if(!user) {
    user = JSON.parse(localStorage.getItem("user"));
  }
  if (!user || user.privileges === 0) {
    return <Navigate to="/" />;
  }
  if(user.privileges < privilegeLevel) {
    return <Navigate to="/home" />;
  }
  return children;
};

export default ProtectedRoute;
