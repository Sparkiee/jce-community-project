import React, { useEffect, useRef, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  doc,
  getDoc
} from "firebase/firestore";
import { db } from "../firebase";
import { useParams } from "react-router-dom";
import "../styles/Styles.css";
import "../styles/Profile.css";
import ChangePassword from "./ChangePassword";
import EditUser from "./EditUser";

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
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import CircularProgress from "@mui/material/CircularProgress";
import SettingsIcon from "@mui/icons-material/Settings";
import VisibilityIcon from "@mui/icons-material/Visibility";

function Profile() {
  const pages = ["פניות", "היסטוריה", "משימות פתוחות", "אירועים קרובים"];

  const [menuSelected, setMenuSelected] = useState(pages[0]);
  const [rowsTasks, setRowsTasks] = useState([]);
  const [rowsEvents, setRowsEvents] = useState([]);
  const [numTasks, setNumTasks] = useState(0);
  const [numEvents, setNumEvents] = useState(0);
  const [numCompletedTasks, setNumCompletedTasks] = useState(0);
  const [numCompletedEvents, setNumCompletedEvents] = useState(0);
  const [taskPercentage, setTaskPercentage] = useState(0);
  const [eventPercentage, setEventPercentage] = useState(0);

  const [profile, setProfile] = useState();
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  const user = JSON.parse(sessionStorage.getItem("user"));
  const editUserRef = useRef(null);

  const { email } = useParams();

  useEffect(() => {
    const fetchProfile = async () => {
      const docRef = doc(db, "members", email);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data());
      }
    };
    fetchProfile();
  }, [email]);

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
      align: "right",
      flex: 0.8
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
    },
    {
      field: "view",
      headerName: "הצגה",
      align: "right",
      flex: 0.8,
      renderCell: (params) => (
        <div>
          <IconButton
            aria-label="edit"
            title="הצגה"
            // onClick={() => navigate(`/profile/${params.row.email}`)}
          >
            <VisibilityIcon />
          </IconButton>
        </div>
      )
    }
  ];

  const columnsEvents = [
    {
      field: "id",
      headerName: "אינדקס",
      align: "right",
      flex: 0.8
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
    },
    {
      field: "view",
      headerName: "הצגה",
      align: "right",
      flex: 0.8,
      renderCell: (params) => (
        <div>
          <IconButton
            aria-label="edit"
            title="הצגה"
            // onClick={() => navigate(`/profile/${params.row.email}`)}
          >
            <VisibilityIcon />
          </IconButton>
        </div>
      )
    }
  ];

  async function grabMyTasks() {
    if (!profile) return;
    try {
      const tasksRef = collection(db, "tasks");
      const q = query(
        tasksRef,
        where("assignees", "array-contains", "members/" + profile.email)
      );
      const querySnapshot = await getDocs(q);
      const taskAll = querySnapshot.docs.map((doc, index) => ({
        ...doc.data(),
        id: index + 1,
        docRef: doc.ref
      }));

      let completeNum = taskAll.filter(
        (task) => task.taskStatus === "הושלמה"
      ).length;
      setNumCompletedTasks(completeNum); // Update completed task count
      setTaskPercentage(Math.round((completeNum / taskAll.length) * 100)); // Update task percentage
      const taskArray = taskAll.filter((task) => task.taskStatus !== "הושלמה");

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
    if (!profile) return;
    try {
      const eventsRef = collection(db, "events");
      const q = query(
        eventsRef,
        where("assignees", "array-contains", "members/" + profile.email)
      );
      const querySnapshot = await getDocs(q);
      const eventAll = querySnapshot.docs.map((doc, index) => ({
        ...doc.data(),
        id: index + 1,
        docRef: doc.ref
      }));
      // .filter((event) => event.eventStatus !== "הסתיים");
      let completeNum = eventAll.filter(
        (event) => event.eventStatus === "הסתיים"
      ).length;
      setNumCompletedEvents(completeNum); // Update completed event count
      setEventPercentage(Math.round((completeNum / eventAll.length) * 100)); // Update event percentage
      const eventsArray = eventAll.filter(
        (event) => event.eventStatus !== "הסתיים"
      );
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
    if (!profile) return;
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

  useEffect(() => {
    grabMyTasks();
    grabMyEvents();
  }, [profile]);

  const PageContent = ({ pageName }) => {
    switch (pageName) {
      case pages[0]:
        return <div>פה יהיה תוכן של פניות</div>;
      case pages[1]:
        return <div>פה יהיה תוכן של היסטוריה</div>;
      case pages[2]:
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
      case pages[3]:
        return (
          <div style={{ height: 372, width: "100%" }}>
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

  const handleCloseForm = () => { 
    console.log("CLICK!");
    setShowEditProfile(false);
    setShowResetPassword(false);
  };

  return (
    <div>
      {showResetPassword && (
        <div className="popup-overlay">
          <div className="popup-content">
            <ChangePassword onClose={handleCloseForm} />
          </div>
        </div>
      )}
      {showEditProfile && (
        <div className="popup-overlay">
          <div ref={editUserRef} className="popup-content">
            <EditUser target={profile} onClose={handleCloseForm}/>
          </div>
        </div>
      )}
      {profile ? (
        <div className="profile-page-container">
          <div className="profile-information right-side">
            {user.privileges > 2 && (
              <IconButton
                color="primary"
                className="profile-edit-icon"
                onClick={() => setShowEditProfile(true)}
              >
                <EditIcon color="default" className="edit-button" />
              </IconButton>
            )}
            <h1>{profile && profile.fullName}</h1>
            <h2>
              {profile && profile.department} • {profile && profile.role}
            </h2>
            <Avatar
              className="profile-avatar"
              {...stringAvatar(`${profile && profile.fullName}`)}
            />
            <div className="profile-stats">
              <div className="profile-stats-row profile-stats-contact profile-personal-info">
                <SendIcon />
                <h3>צור קשר עם {profile && profile.fullName}</h3>
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
                <h3>{numCompletedTasks} משימות שהושלמו</h3>
                <h3>({taskPercentage}%)</h3>
              </div>
              <div className="profile-stats-row">
                <TaskIcon />
                <h3>{numCompletedEvents} אירועים שהושלמו</h3>
                <h3>({eventPercentage}%)</h3>
              </div>
            </div>
            <div className="profile-stats">
              <h2 className="title-info">פרטים אישיים</h2>
              <div
                className="profile-stats-row profile-personal-info"
                onClick={() =>
                  window.open(
                    `https://wa.me/${profile && profile.phone}`,
                    "_blank"
                  )
                }
              >
                <PhoneIphoneIcon />
                <h3 className="profile-phone">{profile && profile.phone}</h3>
              </div>
              <div className="profile-stats-row profile-personal-info">
                <AlternateEmailIcon />
                <h3>{profile && profile.email}</h3>
              </div>
            </div>
            {user && profile && user.email === profile.email ? (
              <div className="profile-stats actions">
                <h2 className="title-info">פעולות משתמש</h2>
                <div
                  className="profile-stats-row profile-personal-info"
                  onClick={() => setShowResetPassword(true)}
                >
                  <VpnKeyIcon />
                  <h3 className="profile-phone">שינוי סיסמה נוכחית</h3>
                </div>
                <div
                  className="profile-stats-row profile-personal-info"
                  onClick={() => setShowEditProfile(true)}
                >
                  <SettingsIcon />
                  <h3>עדכן פרטים אישיים</h3>
                </div>
              </div>
            ) : null}
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
      ) : (
        <CircularProgress color="success" value={98} />
      )}
    </div>
  );
}

export default Profile;
