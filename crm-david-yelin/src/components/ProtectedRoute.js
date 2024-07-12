import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, privilegeLevel, extraAccess }) => {
  let user = JSON.parse(sessionStorage.getItem("user"));
  if(!user) {
    user = JSON.parse(localStorage.getItem("user"));
  }
  if (!user || user.privileges === 0) {
    return <Navigate to="/" />;
  }
  if(user.privileges < privilegeLevel || extraAccess && (Array.isArray(user.adminAccess) && !user.adminAccess.some((access) => extraAccess.includes(access)))){
    return <Navigate to="/home" />;
  }
  return children;
};

export default ProtectedRoute;
