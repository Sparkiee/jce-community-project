import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, privilegeLevel }) => {
  const user = JSON.parse(sessionStorage.getItem("user"));
  console.log(user);
  if (!user || user.privileges === 0) {
    console.log("im here");
    return <Navigate to="/" />;
  }
  if(user.privileges < privilegeLevel) {
    return <Navigate to="/home" />;
  }
  return children;
};

export default ProtectedRoute;
