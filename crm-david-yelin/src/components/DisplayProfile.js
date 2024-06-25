import React, { useState } from "react";

import "../styles/Styles.css";
import "../styles/DisplayProfile.css";
import { Avatar } from "@mui/material";
import TaskIcon from "@mui/icons-material/Task";
import AssignmentIcon from "@mui/icons-material/Assignment";
import EditIcon from "@mui/icons-material/Edit";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import AlternateEmailIcon from "@mui/icons-material/AlternateEmail";

function DisplayProfile(params) {
  // sessionStorage.setItem("profileView", JSON.stringify(member));

  const profile = JSON.parse(sessionStorage.getItem("profileView"));

  const pages = ["פניות", "משימות פתוחות", "אירועים קרובים"];
  const [menuSelected, setMenuSelected] = useState(pages[0]);

  function stringToColor(string) {
    let hash = 0;
    let i;

    /* eslint-disable no-bitwise */
    for (i = 0; i < string.length; i += 1) {
      hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }

    let color = "#";

    for (i = 0; i < 3; i += 1) {
      const value = (hash >> (i * 8)) & 0xff;
      color += `00${value.toString(16)}`.slice(-2);
    }
    /* eslint-enable no-bitwise */

    return color;
  }

  function stringAvatar(name) {
    const names = name.split(" ");
    const firstInitial = names[0] ? names[0][0] : "";
    const secondInitial = names[1] ? names[1][0] : "";
    return {
      sx: {
        bgcolor: stringToColor(name)
      },
      children: `${firstInitial}${secondInitial}`
    };
  }

  return (
    <div className="profile-page-container">
      <div className="profile-information right-side">
        <EditIcon className="profile-edit-icon" />
        <h1>{profile.fullName}</h1>
        <h2>
          {profile.department} • {profile.role}
        </h2>
        <Avatar className="profile-avatar" {...stringAvatar("לוזר גדול")} />
        <div className="profile-stats">
          <h2 className="title-info">התקדמות אישית</h2>
          <div className="profile-stats-row">
            <AssignmentIcon />
            <h3>5 משימות פתוחות</h3>
          </div>
          <div className="profile-stats-row">
            <AssignmentIcon />
            <h3>5 אירועים קרובים</h3>
          </div>
          <div className="profile-stats-row">
            <TaskIcon />
            <h3>משימות שהושלמו</h3>
            <h3>(אחוז השלמה)</h3>
          </div>
          <div className="profile-stats-row">
            <TaskIcon />
            <h3>אירועים שהושלמו</h3>
            <h3>(אחוז השלמה)</h3>
          </div>
        </div>
        <div className="profile-stats">
          <h2 className="title-info">פרטים אישיים</h2>
          <div
            className="profile-stats-row profile-personal-info"
            onClick={() =>
              window.open(`https://wa.me/${profile.phone}`, "_blank")
            }
          >
            <PhoneIphoneIcon />
            <h3 className="profile-phone">{profile.phone}</h3>
          </div>
          <div className="profile-stats-row profile-personal-info">
            <AlternateEmailIcon />
            <h3>{profile.email}</h3>
          </div>
        </div>
      </div>
      <div className="profile-data left-side">
        <div className="profile-navbar">
          <ul>
            {pages.map((page, index) => (
              <li
                key={index}
                onClick={() => setMenuSelected(page)}
                className={menuSelected === page ? "selected" : ""}
              >
                {page}
              </li>
            ))}
          </ul>
        </div>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat.
      </div>
    </div>
  );
}

export default DisplayProfile;
