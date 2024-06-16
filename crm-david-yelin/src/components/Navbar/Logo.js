import React from "react";
import { useNavigate } from "react-router-dom";

const Logo = ({ onClick }) => {
  const navigate = useNavigate();
  return (
    <div className="logo">
      <a to="#" onClick={() => navigate("#")}>
        <img className="logo-img" src={require("../../assets/aguda.png")} alt="aguda icon" />
        <p>
          אגודת הסטודנטים <br /> והסטודנטיות דוד ילין
        </p>
      </a>
    </div>
  );
};

export default Logo;
