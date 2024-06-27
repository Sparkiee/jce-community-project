import React, { useEffect, useRef, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  doc,
  getDoc,
  deleteDoc
} from "firebase/firestore";
import { db } from "../firebase";
import { useParams } from "react-router-dom";
import "../styles/Styles.css";
import "../styles/Profile.css";
import ChangePassword from "./ChangePassword";
import EditUser from "./EditUser";
import ConfirmAction from "./ConfirmAction";
import EditContactLog from "./EditContactLog";
import { useNavigate } from "react-router-dom";

import { createTheme, ThemeProvider } from "@mui/material/styles";
import { DataGrid } from "@mui/x-data-grid";
import { heIL } from "@mui/material/locale";

import { Avatar, Tab } from "@mui/material";
import TaskIcon from "@mui/icons-material/Task";
import AssignmentIcon from "@mui/icons-material/Assignment";
import EditIcon from "@mui/icons-material/Edit";
import AlternateEmailIcon from "@mui/icons-material/AlternateEmail";
import IconButton from "@mui/material/IconButton";
import SendIcon from "@mui/icons-material/Send";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import CircularProgress from "@mui/material/CircularProgress";
import SettingsIcon from "@mui/icons-material/Settings";
import VisibilityIcon from "@mui/icons-material/Visibility";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";

import Box from "@mui/material/Box";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import ContactUser from "./ContactUser";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";

function Profile() {
  const pages = ["פניות", "משימות פתוחות", "אירועים קרובים", "היסטוריה"];
  const handlePageSwitch = (event, newValue) => {
    setPage(newValue);
  };

  const [page, setPage] = useState(pages[0]);
  const [rowsTasks, setRowsTasks] = useState([]);
  const [rowsEvents, setRowsEvents] = useState([]);
  const [rowContact, setRowContact] = useState([]);
  const [numTasks, setNumTasks] = useState(0);
  const [numEvents, setNumEvents] = useState(0);
  const [numCompletedTasks, setNumCompletedTasks] = useState(0);
  const [numCompletedEvents, setNumCompletedEvents] = useState(0);
  const [taskPercentage, setTaskPercentage] = useState(0);
  const [eventPercentage, setEventPercentage] = useState(0);

  const [profile, setProfile] = useState();
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showContact, setShowContact] = useState(false);

  const [deleteContact, setDeleteContact] = useState("");
  const [editLog, setEditLog] = useState("");

  const navigate = useNavigate();

  const user = JSON.parse(sessionStorage.getItem("user"));
  const editUserRef = useRef(null);

  const changePasswordRef = useRef(null);

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

  const navbarTheme = createTheme(
    {
      direction: "rtl",
      typography: {
        fontSize: 36
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
            onClick={() => navigate(`/task/${params.row.taskDoc}`)}
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
            onClick={() => navigate(`/event/${params.row.eventDoc}`)}
          >
            <VisibilityIcon />
          </IconButton>
        </div>
      )
    }
  ];

  const columnsContact = [
    {
      field: "id",
      headerName: "אינדקס",
      align: "right",
      flex: 0.8
    },
    {
      field: "subject",
      headerName: "נושא",
      flex: 2,
      align: "right"
    },
    {
      field: "description",
      headerName: "תיאור",
      flex: 3,
      align: "right"
    },
    {
      field: "notes",
      headerName: "הערות",
      flex: 3,
      align: "right"
    },
    {
      field: "timestamp",
      headerName: "תאריך",
      flex: 2,
      align: "right",
      renderCell: (params) => (
        <div style={{ direction: "ltr" }}>
          {params.row.date} • {params.row.time}
        </div>
      )
    },
    {
      field: "sourceFullName",
      headerName: "פותח פניה",
      flex: 2,
      align: "right",
      renderCell: (params) => (
        <div className="contact-src-log" style={{ cursor: "pointer" }}>
          <Avatar {...stringAvatar(`${params.value}`)} />
          {params.value}
        </div>
      )
    }
  ];

  const columnsContactAdmin = [
    ...columnsContact,
    {
      field: "edit",
      headerName: "עריכה",
      align: "right",
      flex: 0.8,
      renderCell: (params) => (
        <div>
          <IconButton
            aria-label="edit"
            title="עריכה"
            onClick={() => setEditLog(params.row)}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            aria-label="delete"
            title="מחיקה"
            onClick={() => setDeleteContact(params.row.logDoc)}
          >
            <DeleteForeverIcon />
          </IconButton>
        </div>
      )
    }
  ];

  async function handleDeleteContact() {
    setDeleteContact("");
    const targetLog = deleteContact;
    // Delete the contact log
    const logRef = doc(db, "contact_log", targetLog);
    try {
      await deleteDoc(logRef);
      fetchContact();
    } catch (error) {
      console.error("Error deleting contact log:", error);
    }
  }

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
        docRef: doc.id
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
        taskDoc: task.docRef,
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
        docRef: doc.id
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
        eventDoc: event.docRef,
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

  async function fetchContact() {
    if (!profile) return;
    try {
      const logRef = collection(db, "contact_log");
      const q = query(
        logRef,
        where("destMember", "==", "members/" + profile.email)
      );
      const querySnapshot = await getDocs(q);
      const logAll = querySnapshot.docs.map((doc, index) => ({
        ...doc.data(),
        id: index + 1,
        docRef: doc.id
      }));

      // Fetch full names for each srcMember
      const logsWithFullNames = await Promise.all(
        logAll.map(async (log) => {
          const srcMemberRef = doc(db, log.srcMember);
          const srcMemberDoc = await getDoc(srcMemberRef);
          const srcMemberData = srcMemberDoc.data();
          return {
            ...log,
            srcFullName: srcMemberData ? srcMemberData.fullName : "Unknown" 
          };
        })
      );

      const logArray = logsWithFullNames.map((log, index) => ({
        id: index + 1,
        logDoc: log.docRef,
        subject: log.subject,
        description: log.description,
        notes: log.notes,
        timestamp: log.timestamp,
        date: log.timestamp.toDate().toLocaleDateString("de-DE"),
        time: log.timestamp.toDate().toLocaleTimeString("de-DE"),
        srcMember: log.srcMember,
        destMember: log.destMember,
        sourceFullName: log.srcFullName // Use the full name instead of the reference
      }));
      setRowContact(logArray);
    } catch (error) {
      console.error("Failed to fetch contact log:", error);
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
    fetchContact();
  }, [profile]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        changePasswordRef.current &&
        !changePasswordRef.current.contains(event.target) &&
        showResetPassword
      ) {
        setShowResetPassword(false);
      }
      if (
        editUserRef.current &&
        !editUserRef.current.contains(event.target) &&
        showEditProfile
      ) {
        setShowEditProfile(false);
      }
    };

    // Add event listener when the component mounts
    document.addEventListener("mousedown", handleClickOutside);

    // Return a cleanup function to remove the event listener when the component unmounts
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showResetPassword, showEditProfile]);
  const PageContent = ({ pageName }) => {
    switch (pageName) {
      case pages[0]: // Contact Logs
        return (
          <div>
            <button
              className="create-contact-log-button"
              onClick={() => setShowContact(true)}
            >
              תעד פנייה
            </button>
            {rowContact.length > 0 ? (
              <div style={{ height: 631, width: "100%" }}>
                <ThemeProvider theme={theme}>
                  <DataGrid
                    className="data-grid"
                    rows={rowContact}
                    columns={
                      user.privileges > 1 ? columnsContactAdmin : columnsContact
                    }
                    initialState={{
                      pagination: {
                        paginationModel: { page: 0, pageSize: 10 }
                      }
                    }}
                    pageSizeOptions={[10, 20, 50]}
                    localeText={{
                      MuiTablePagination: {
                        labelDisplayedRows: ({ from, to, count }) =>
                          `${from}-${to} מתוך ${
                            count !== -1 ? count : `יותר מ ${to}`
                          }`,
                        labelRowsPerPage: "שורות בכל עמוד:"
                      }
                    }}
                    onCellDoubleClick={(params) => {
                      if (params.field === "sourceFullName")
                        navigate(
                          `/profile/${params.row.srcMember.split("/")[1]}`
                        );
                    }}
                  />
                </ThemeProvider>
              </div>
            ) : (
              <div className="no-logs">אין תיעודים למשתמש זה</div>
            )}
          </div>
        );
      case pages[1]: // Open Tasks
        return (
          <div style={{ height: 631, width: "100%" }}>
            <ThemeProvider theme={theme}>
              <DataGrid
                direction="rtl"
                className="data-grid"
                rows={rowsTasks}
                columns={columnsTasks}
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 10 }
                  }
                }}
                pageSizeOptions={[10, 20, 50]}
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
                onRowDoubleClick={(params) =>
                  navigate(`/task/${params.row.taskDoc}`)
                }
              />
            </ThemeProvider>
          </div>
        );
      case pages[2]: // Upcoming Events
        return (
          <div style={{ height: 631, width: "100%" }}>
            <ThemeProvider theme={theme}>
              <DataGrid
                className="data-grid"
                rows={rowsEvents}
                columns={columnsEvents}
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 10 }
                  }
                }}
                pageSizeOptions={[10, 20, 50]}
                localeText={{
                  MuiTablePagination: {
                    labelDisplayedRows: ({ from, to, count }) =>
                      `${from}-${to} מתוך ${
                        count !== -1 ? count : `יותר מ ${to}`
                      }`,
                    labelRowsPerPage: "שורות בכל עמוד:"
                  }
                }}
                onRowDoubleClick={(params) =>
                  navigate(`/event/${params.row.eventDoc}`)
                }
              />
            </ThemeProvider>
          </div>
        );

      case pages[3]: // History
        return <div>פה יהיה תוכן של היסטוריה</div>;
      default: // Default case
        return <div>Page Not Found</div>;
    }
  };

  const handleCloseForm = () => {
    setShowEditProfile(false);
    setShowResetPassword(false);
    setShowContact(false);
  };

  return (
    <div>
      {editLog !== "" && (
        <div className="popup-overlay">
          <div className="popup-content">
            <EditContactLog
              target={editLog}
              onClose={() => {setEditLog("")
                fetchContact();
              }}
            />
          </div>
        </div>
      )}
      {deleteContact !== "" && (
        <div className="popup-overlay">
          <ConfirmAction
            className="popup-content"
            onConfirm={() => handleDeleteContact()}
            onCancel={() => setDeleteContact("")}
          />
        </div>
      )}
      {showResetPassword && (
        <div className="popup-overlay">
          <div ref={changePasswordRef} className="popup-content">
            <ChangePassword onClose={handleCloseForm} />
          </div>
        </div>
      )}
      {showEditProfile && (
        <div className="popup-overlay">
          <div ref={editUserRef} className="popup-content">
            <EditUser target={profile} onClose={handleCloseForm} />
          </div>
        </div>
      )}
      {showContact && (
        <div className="popup-overlay">
          <div ref={editUserRef} className="popup-content">
            <ContactUser
              target={profile}
              source={user}
              onClose={() => {
                handleCloseForm();
                fetchContact();
              
              }}
            />
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
                <h3>{numCompletedEvents} אירועים שהסתיימו</h3>
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
                <WhatsAppIcon />
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
              <ThemeProvider theme={navbarTheme}>
                <Box sx={{ width: "100%" }}>
                  <TabContext value={page}>
                    <TabList
                      onChange={handlePageSwitch}
                      aria-label="lab API tabs example"
                    >
                      {pages.map((page, index) => (
                        <Tab key={index} label={page} value={page} />
                      ))}
                    </TabList>
                  </TabContext>
                </Box>
              </ThemeProvider>
            </div>
            <div className="profile-content">
              <PageContent pageName={page} />
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
