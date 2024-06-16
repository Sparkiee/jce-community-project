import React from "react";
import { useNavigate } from "react-router-dom";

const LogoutButton = ({ onClick }) => {
  const navigate = useNavigate();
  return (
    <a
      className="logout-button"
      to="/logout"
      onClick={() => {
        onClick();
        navigate("/");
      }}>
      התנתק
    </a>
  );
};

export default LogoutButton;
