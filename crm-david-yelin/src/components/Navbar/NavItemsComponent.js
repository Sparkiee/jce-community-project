import React from "react";
import { useNavigate } from "react-router-dom";

const NavItems = () => {
  const navigate = useNavigate();
  return (
    <ul>
      <li>
        <a to="#" onClick={() => navigate("#")}>
          ראשי
        </a>
      </li>
      <li>
        <a to="/tasks" onClick={() => navigate("/tasks")}>
          משימות
        </a>
      </li>
      <li>
        <a to="/events" onClick={() => navigate("/events")}>
          אירועים
        </a>
      </li>
      <li>
        <a to="/contact" onClick={() => navigate("/contact")}>
          תקשורת
        </a>
      </li>
    </ul>
  );
};

export default NavItems;
