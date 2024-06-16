import React from "react";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
import NotificationsIcon from "@mui/icons-material/Notifications";

const Notification = ({ notifications, onClick }) => (
  <IconButton color="primary" onClick={onClick}>
    <Badge badgeContent={notifications} color="primary">
      <NotificationsIcon className="notification-icon" />
    </Badge>
  </IconButton>
);

export default Notification;
