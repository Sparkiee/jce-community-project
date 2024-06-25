import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot
} from "firebase/firestore";
import { db } from "../firebase";

import "../styles/Styles.css";
import "../styles/DisplayProfile.css";

import { createTheme, ThemeProvider } from "@mui/material/styles";
import { DataGrid } from "@mui/x-data-grid";
import { heIL } from "@mui/material/locale";

import { Avatar } from "@mui/material";
import TaskIcon from "@mui/icons-material/Task";
import AssignmentIcon from "@mui/icons-material/Assignment";
import EditIcon from "@mui/icons-material/Edit";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import AlternateEmailIcon from "@mui/icons-material/AlternateEmail";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import SendIcon from "@mui/icons-material/Send";

function DisplayProfile(params) {
  // const [profile, setProfile] = useState();
  const profile = JSON.parse(sessionStorage.getItem("profileView"));
  const user = JSON.parse(sessionStorage.getItem("user"));

  const pages = ["פניות", "משימות פתוחות", "אירועים קרובים"];
  const [menuSelected, setMenuSelected] = useState(pages[0]);
  const [rowsTasks, setRowsTasks] = useState([]);
  const [rowsEvents, setRowsEvents] = useState([]);
  const [numTasks, setNumTasks] = useState(0);
  const [numEvents, setNumEvents] = useState(0);

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

  const theme = createTheme(
    {
      direction: "rtl",
      typography: {
        fontSize: 24
      }
    },
    heIL
  );

  const columnsTasks = [
    {
      field: "id",
      headerName: "אינדקס",
      width: "3%",
      align: "right",
      flex: 1
    },
    {
      field: "taskName",
      headerName: "משימה",
      width: 150,
      align: "right",
      flex: 2
    },
    {
      field: "taskDescription",
      headerName: "תיאור",
      width: 150,
      align: "right",
      flex: 3
    },
    {
      field: "taskStartDate",
      headerName: "תאריך התחלה",
      width: 150,
      align: "right",
      flex: 2
    },
    {
      field: "taskEndDate",
      headerName: "תאריך יעד",
      width: 150,
      align: "right",
      flex: 2
    },
    {
      field: "taskTime",
      headerName: "שעת סיום",
      width: 150,
      align: "right",
      flex: 2
    },
    {
      field: "taskStatus",
      headerName: "סטטוס",
      width: 150,
      align: "right",
      flex: 2
    }
  ];

  const columnsEvents = [
    {
      field: "id",
      headerName: "אינדקס",
      width: "3%",
      align: "right",
      colors: "red",
      flex: 1
    },
    {
      field: "eventName",
      headerName: "שם האירוע",
      width: 150,
      align: "right",
      flex: 2
    },
    {
      field: "eventLocation",
      headerName: "מיקום האירוע",
      width: 150,
      align: "right",
      flex: 3
    },
    {
      field: "eventStartDate",
      headerName: "תאריך התחלה",
      width: 150,
      align: "right",
      flex: 2
    },
    {
      field: "eventEndDate",
      headerName: "תאריך יעד",
      width: 150,
      align: "right",
      flex: 2
    },
    {
      field: "eventTime",
      headerName: "שעת סיום",
      width: 150,
      align: "right",
      flex: 2
    },
    {
      field: "eventStatus",
      headerName: "סטטוס",
      width: 150,
      align: "right",
      flex: 2
    }
  ];

  async function grabMyTasks() {
    try {
      const tasksRef = collection(db, "tasks");
      const q = query(
        tasksRef,
        where("assignees", "array-contains", "members/" + profile.email)
      );
      const querySnapshot = await getDocs(q);
      const taskArray = querySnapshot.docs
        .map((doc, index) => ({
          ...doc.data(),
          id: index + 1,
          docRef: doc.ref
        }))
        .filter((task) => task.taskStatus !== "הושלמה");

      setNumTasks(taskArray.length); // Update task count

      // Map the tasks to the format expected by DataGrid
      const rowsTasksData = taskArray.map((task, index) => ({
        id: index + 1,
        taskName: task.taskName,
        taskDescription: task.taskDescription,
        taskStartDate: task.taskStartDate,
        taskEndDate: task.taskEndDate,
        taskTime: task.taskTime,
        taskStatus: task.taskStatus
      }));
      setRowsTasks(rowsTasksData); // Update rows state
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    }
  }

  async function grabMyEvents() {
    try {
      const eventsRef = collection(db, "events");
      const q = query(
        eventsRef,
        where("assignees", "array-contains", "members/" + profile.email)
      );
      const querySnapshot = await getDocs(q);
      const eventsArray = querySnapshot.docs
        .map((doc, index) => ({
          ...doc.data(),
          id: index + 1,
          docRef: doc.ref
        }))
        .filter((event) => event.eventStatus !== "הסתיים");
      setNumEvents(eventsArray.length); // Update event count

      // Map the events to the format expected by DataGrid
      const rowsEventsData = eventsArray.map((event, index) => ({
        id: index + 1,
        eventName: event.eventName,
        eventLocation: event.eventLocation,
        eventStartDate: event.eventStartDate,
        eventEndDate: event.eventEndDate,
        eventTime: event.eventTime,
        eventStatus: event.eventStatus
      }));
      setRowsEvents(rowsEventsData); // Update event rows state
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
  }

  useEffect(() => {
    grabMyTasks();
    grabMyEvents();

    const eventsRef = collection(db, "events");
    const eventsQuery = query(
      eventsRef,
      where("assignees", "array-contains", "members/" + profile.email)
    );

    const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" || change.type === "modified") {
          grabMyEvents();
        }
      });
    });

    const tasksRef = collection(db, "tasks");
    const tasksQuery = query(
      tasksRef,
      where("assignees", "array-contains", "members/" + profile.email)
    );
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" || change.type === "modified") {
          grabMyTasks();
        }
      });
    });

    // Cleanup function to unsubscribe from both snapshots
    return () => {
      unsubscribeEvents();
      unsubscribeTasks();
    };
  }, []);

  const PageContent = ({ pageName }) => {
    console.log(pageName);
    switch (pageName) {
      case pages[0]:
        return <div>פה יהיה תוכן של פניות</div>;
      case pages[1]:
        return (
          <div style={{ height: 371, width: "100%" }}>
            <ThemeProvider theme={theme}>
              <DataGrid
                direction="rtl"
                className="data-grid"
                rows={rowsTasks}
                columns={columnsTasks}
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 5 }
                  }
                }}
                pageSizeOptions={[5, 10, 20]}
                localeText={{
                  // Customizing displayed rows text
                  MuiTablePagination: {
                    labelDisplayedRows: ({ from, to, count }) =>
                      `${from}-${to} מתוך ${
                        count !== -1 ? count : `יותר מ-${to}`
                      }`,
                    labelRowsPerPage: "שורות בכל עמוד:" // Optional: customize other texts
                  }
                }}
              />
            </ThemeProvider>
          </div>
        );
      case pages[2]:
        return (
          <div style={{ height: 371, width: "100%" }}>
            <ThemeProvider theme={theme}>
              <DataGrid
                className="data-grid"
                rows={rowsEvents}
                columns={columnsEvents}
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 5 }
                  }
                }}
                pageSizeOptions={[5, 10, 20]}
                localeText={{
                  MuiTablePagination: {
                    labelDisplayedRows: ({ from, to, count }) =>
                      `${from}-${to} מתוך ${
                        count !== -1 ? count : `יותר מ ${to}`
                      }`,
                    labelRowsPerPage: "שורות בכל עמוד:"
                  }
                }}
              />
            </ThemeProvider>
          </div>
        );
      default:
        return <div>Page Not Found</div>;
    }
  };

  return (
    <div className="profile-page-container">
      <div className="profile-information right-side">
        {user.privileges > 2 && (
          <IconButton color="primary" className="profile-edit-icon">
            <EditIcon color="default" className="edit-button" />
          </IconButton>
        )}
        <h1>{profile.fullName}</h1>
        <h2>
          {profile.department} • {profile.role}
        </h2>
        <Avatar className="profile-avatar" {...stringAvatar("לוזר גדול")} />
        <div className="profile-stats">
          <div className="profile-stats-row profile-stats-contact profile-personal-info">
            <SendIcon />
            <h3>צור קשר עם {profile.fullName}</h3>
          </div>
          <h2 className="title-info">התקדמות אישית</h2>
          <div className="profile-stats-row">
            <AssignmentIcon />
            <h3>{numTasks} משימות פתוחות</h3>
          </div>
          <div className="profile-stats-row">
            <AssignmentIcon />
            <h3>{numEvents} אירועים קרובים</h3>
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
              <Button
                key={index}
                variant="contained"
                size="large"
                className={
                  menuSelected === page
                    ? "selected profile-navbar-buttons"
                    : "profile-navbar-buttons"
                }
                onClick={() => setMenuSelected(page)}
              >
                {page}
              </Button>
            ))}
          </ul>
        </div>
        <div className="profile-content">
          <PageContent pageName={menuSelected} />
        </div>
      </div>
    </div>
  );
}

export default DisplayProfile;
