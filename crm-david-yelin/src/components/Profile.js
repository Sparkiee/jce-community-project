import React, { useEffect, useRef, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  doc,
  getDoc,
  deleteDoc,
  orderBy,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../firebase";
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
import { Avatar, Tab, Button, IconButton, Popover, Box } from "@mui/material";
import TaskIcon from "@mui/icons-material/Task";
import AssignmentIcon from "@mui/icons-material/Assignment";
import EditIcon from "@mui/icons-material/Edit";
import AlternateEmailIcon from "@mui/icons-material/AlternateEmail";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import CircularProgress from "@mui/material/CircularProgress";
import SettingsIcon from "@mui/icons-material/Settings";
import VisibilityIcon from "@mui/icons-material/Visibility";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import ContactUser from "./ContactUser";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import Chart from "chart.js/auto";

function Profile() {
  const pages = ["פניות", "משימות פתוחות", "אירועים פתוחים", "משימות שיצר", "אירועים שיצר"];
  const handlePageSwitch = (event, newValue) => {
    setPage(newValue);
  };

  const [user, setUser] = useState(null);
  const [page, setPage] = useState(pages[0]);
  const [rowsTasks, setRowsTasks] = useState([]);
  const [rowsEvents, setRowsEvents] = useState([]);
  const [rowContact, setRowContact] = useState([]);
  const [filteredContactRows, setFilteredContactRows] = useState([]);
  const [numTasks, setNumTasks] = useState(0);
  const [numEvents, setNumEvents] = useState(0);
  const [numCompletedTasks, setNumCompletedTasks] = useState(0);
  const [numCompletedEvents, setNumCompletedEvents] = useState(0);
  const [taskPercentage, setTaskPercentage] = useState(0);
  const [eventPercentage, setEventPercentage] = useState(0);
  const [rowsCreatedTasks, setRowsCreatedTasks] = useState([]);
  const [rowsCreatedEvents, setRowsCreatedEvents] = useState([]);

  const [profile, setProfile] = useState();
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const [deleteContact, setDeleteContact] = useState("");
  const [editLog, setEditLog] = useState("");

  const [anchorEl, setAnchorEl] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem("user"));
    if (userData) setUser(userData);
    else {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (userData) setUser(userData);
    }
  }, []);

  const editUserRef = useRef(null);
  const changePasswordRef = useRef(null);
  const contactLogRef = useRef(null);
  const editContactLogRef = useRef(null);
  const searchInputRef = useRef(null);

  const { email } = useParams();

  const fetchProfile = async () => {
    const docRef = doc(db, "members", email);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setProfile(docSnap.data());
    }
  };

  useEffect(() => {
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
        bgcolor: stringToColor(name),
      },
      children: `${firstInitial}${secondInitial}`,
    };
  }

  const getStatusColorClass = (status) => {
    switch (status) {
      case "טרם החלה":
        return "status-not-started";
      case "טרם החל":
        return "status-not-started";
      case "בתהליך":
        return "status-in-progress";
      case "הושלמה":
        return "status-finished";
      case "הסתיים":
        return "status-finished";
      default:
        return "";
    }
  };

  const theme = createTheme(
    {
      direction: "rtl",
      typography: {
        fontSize: 24,
      },
    },
    heIL
  );

  const navbarTheme = createTheme(
    {
      direction: "rtl",
      typography: {
        fontSize: 36,
      },
    },
    heIL
  );

  const columnsTasks = [
    // {
    //   field: "id",
    //   headerName: "אינדקס",
    //   align: "right",
    //   flex: 0.8,
    // },
    {
      field: "taskName",
      headerName: "משימה",
      align: "right",
      flex: 2,
    },
    {
      field: "taskDescription",
      headerName: "תיאור",
      align: "right",
      flex: 3,
    },
    ...(user &&
    (user.privileges >= 2 ||
      (Array.isArray(user.adminAccess) && user.adminAccess.includes("viewBudget")) ||
      (profile && profile.email === user.email))
      ? [
          {
            field: "taskBudget",
            headerName: "תקציב",
            align: "right",
            flex: 1,
            renderCell: (params) => {
              return (
                <div>
                  {params.row.taskBudget ? `₪${params.row.taskBudget.toLocaleString()}` : "אין"}
                </div>
              );
            },
          },
        ]
      : []),
    {
      field: "taskStartDate",
      headerName: "תאריך התחלה",
      align: "right",
      flex: 2,
      renderCell: (params) => {
        const date = new Date(params.row.taskStartDate);
        const formattedDate = date.toLocaleDateString("he-IL").replaceAll("/", "-");
        return <div>{formattedDate}</div>;
      },
    },
    {
      field: "taskEndDate",
      headerName: "תאריך יעד",
      align: "right",
      flex: 2,
      renderCell: (params) => {
        const date = new Date(params.row.taskEndDate);
        const formattedDate = date.toLocaleDateString("he-IL").replaceAll("/", "-");
        return <div>{formattedDate}</div>;
      },
    },
    {
      field: "taskTime",
      headerName: "שעת סיום",
      align: "right",
      flex: 2,
    },
    {
      field: "taskStatus",
      headerName: "סטטוס",
      align: "right",
      flex: 2,
      renderCell: (params) => {
        const colorClass = getStatusColorClass(params.row.taskStatus);
        return (
          <div className="status-cell">
            <span className={`status-circle ${colorClass}`}></span>
            {params.row.taskStatus}
          </div>
        );
      },
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
            onClick={() => navigate(`/task/${params.row.taskDoc}`)}>
            <VisibilityIcon />
          </IconButton>
        </div>
      ),
    },
  ];

  const remToPixels = (rem) => {
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
  };

  useEffect(() => {
    // Assuming your canvas element has an id of 'myChart'
    const ctx = document.getElementById("eventCompletionChart");
    if (!ctx) return; // Exit the effect if the element does not exist
    const data = {
      labels: ["אירועים פתוחים", "אירועים שהסתיימו"],
      datasets: [
        {
          data: [numEvents, numCompletedEvents], // Make sure numEvents and numCompletedEvents are defined
          backgroundColor: ["#f9c846", "#02044f"],
          hoverBackgroundColor: ["#f9c846", "#02044f"],
        },
      ],
    };

    let chart = new Chart(ctx, {
      type: "pie",
      data: data,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              font: {
                size: remToPixels(1.4),
              },

              color: "#000000",
            },
          },
          tooltip: {
            titleFont: {
              size: 18,
            },
            bodyFont: {
              size: 18,
            },
            footerFont: {
              size: 18,
            },
          },
        },
      },
    });

    // Cleanup function to destroy chart on component unmount
    return () => chart.destroy();
  }, [numEvents, numCompletedEvents]);

  useEffect(() => {
    const ctx = document.getElementById("taskCompletionChart");
    if (!ctx) return; // Exit the effect if the element does not exist

    const data = {
      labels: ["משימות פתוחות", "משימות שהושלמו"],
      datasets: [
        {
          data: [numTasks, numCompletedTasks], // Make sure numTasks and numCompletedTasks are defined
          backgroundColor: ["#f9c846", "#02044f"],
          hoverBackgroundColor: ["#f9c846", "#02044f"],
        },
      ],
    };
    let chart = new Chart(ctx, {
      type: "pie",
      data: data,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              font: {
                size: remToPixels(1.4),
              },

              color: "#000000",
            },
          },
          tooltip: {
            titleFont: {
              size: 18,
            },
            bodyFont: {
              size: 18,
            },
            footerFont: {
              size: 18,
            },
          },
        },
      },
    });

    // Cleanup function to destroy chart on component unmount
    return () => chart.destroy();
  }, [numTasks, numCompletedTasks]);

  const columnsEvents = [
    // {
    //   field: "id",
    //   headerName: "אינדקס",
    //   align: "right",
    //   flex: 0.8,
    // },
    {
      field: "eventName",
      headerName: "שם האירוע",
      align: "right",
      flex: 2,
    },
    {
      field: "eventLocation",
      headerName: "מיקום האירוע",
      align: "right",
      flex: 3,
    },
    ...(user &&
    (user.privileges >= 2 ||
      (Array.isArray(user.adminAccess) && user.adminAccess.includes("viewBudget")) ||
      (profile && user.email === profile.email))
      ? [
          {
            field: "eventBudget",
            headerName: "תקציב/תקציב שנותר",
            align: "right",
            flex: 1.5,
            renderCell: (params) => {
              if (params.row.eventBudget === undefined || params.row.eventBudget === null) {
                return <div>לא הוגדר תקציב</div>;
              }
              const usedBudget = Math.abs(params.row.totalTaskBudget - params.row.eventBudget) || 0;
              const isOverBudget = params.row.isOverBudget;

              return (
                <div className={`budget-status ${isOverBudget ? "over-budget" : ""}`}>
                  <span>{`${params.row.eventBudget.toLocaleString()} / ${
                    isOverBudget ? `${usedBudget.toLocaleString()}-` : usedBudget.toLocaleString()
                  } ₪`}</span>
                </div>
              );
            },
          },
        ]
      : []),
    {
      field: "eventStartDate",
      headerName: "תאריך התחלה",
      align: "right",
      flex: 2,
      renderCell: (params) => {
        const date = new Date(params.row.eventStartDate);
        const formattedDate = date.toLocaleDateString("he-IL").replaceAll("/", "-");
        return <div>{formattedDate}</div>;
      },
    },
    {
      field: "eventEndDate",
      headerName: "תאריך יעד",
      align: "right",
      flex: 2,
      renderCell: (params) => {
        const date = new Date(params.row.eventEndDate);
        const formattedDate = date.toLocaleDateString("he-IL").replaceAll("/", "-");
        return <div>{formattedDate}</div>;
      },
    },
    {
      field: "eventTime",
      headerName: "שעת סיום",
      align: "right",
      flex: 2,
    },
    {
      field: "eventStatus",
      headerName: "סטטוס",
      align: "right",
      flex: 2,
      renderCell: (params) => {
        const colorClass = getStatusColorClass(params.row.eventStatus);
        return (
          <div className="status-cell">
            <span className={`status-circle ${colorClass}`}></span>
            {params.row.eventStatus}
          </div>
        );
      },
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
            onClick={() => navigate(`/event/${params.row.eventDoc}`)}>
            <VisibilityIcon />
          </IconButton>
        </div>
      ),
    },
  ];

  const columnsContact = [
    // {
    //   field: "id",
    //   headerName: "אינדקס",
    //   align: "right",
    //   flex: 0.8,
    // },
    {
      field: "subject",
      headerName: "נושא",
      flex: 2,
      align: "right",
    },
    {
      field: "description",
      headerName: "תיאור",
      flex: 3,
      align: "right",
    },
    {
      field: "notes",
      headerName: "הערות",
      flex: 2,
      align: "right",
    },
    {
      field: "timestamp",
      headerName: "תאריך וזמן",
      flex: 2.5,
      align: "right",
      renderCell: (params) => (
        <div style={{ direction: "ltr" }}>
          {params.row.date} • {params.row.time}
        </div>
      ),
    },
    {
      field: "sourceFullName",
      headerName: "פותח פניה",
      flex: 2.5,
      align: "right",
      renderCell: (params) => (
        <div
          className="avatar-position-center"
          style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {params.row.sourceProfileImage ? (
            <Avatar src={params.row.sourceProfileImage} alt={params.value} />
          ) : (
            <Avatar {...stringAvatar(params.value)} />
          )}
          <span>{params.value}</span>
        </div>
      ),
    },
  ];

  const columnsContactAdmin = [
    ...columnsContact,
    {
      field: "edit",
      headerName: "עריכה",
      align: "right",
      flex: 1.5,
      renderCell: (params) => (
        <div>
          <IconButton aria-label="edit" title="עריכה" onClick={() => setEditLog(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton
            aria-label="delete"
            title="מחיקה"
            onClick={() => setDeleteContact(params.row.logDoc)}>
            <DeleteForeverIcon />
          </IconButton>
        </div>
      ),
    },
  ];

  async function handleDeleteContact() {
    setDeleteContact("");
    const targetLog = deleteContact;
    // Delete the contact log
    const logRef = doc(db, "log_contact", targetLog);
    try {
      await deleteDoc(logRef);
      fetchContact();
    } catch (error) {
      console.error("Error deleting contact log:", error);
    }
  }

  async function grabAllTasks() {
    if (!profile) return;
    try {
      const tasksRef = collection(db, "tasks");
      const myTasksQuery = query(
        tasksRef,
        where("assignees", "array-contains", "members/" + profile.email),
        orderBy("taskEndDate", "desc")
      );
      const createdTasksQuery = query(
        tasksRef,
        where("taskCreator", "==", "members/" + profile?.email),
        orderBy("taskEndDate", "desc")
      );

      const [myTasksSnapshot, createdTasksSnapshot] = await Promise.all([
        getDocs(myTasksQuery),
        getDocs(createdTasksQuery),
      ]);

      // Process myTasks
      const myTasksAll = myTasksSnapshot.docs.map((doc, index) => ({
        ...doc.data(),
        id: index + 1,
        docRef: doc.id,
      }));

      let completeNum = myTasksAll.filter((task) => task.taskStatus === "הושלמה").length;
      setNumCompletedTasks(completeNum);
      setTaskPercentage(Math.round((completeNum / myTasksAll.length) * 100));
      const myTasksArray = myTasksAll.filter((task) => task.taskStatus !== "הושלמה");
      setNumTasks(myTasksArray.length);
      setRowsTasks(
        myTasksArray.map((task, index) => ({
          id: index + 1,
          taskDoc: task.docRef,
          taskName: task.taskName,
          taskDescription: task.taskDescription,
          taskStartDate: task.taskStartDate,
          taskEndDate: task.taskEndDate,
          taskTime: task.taskTime,
          taskBudget: task.taskBudget,
          taskStatus: task.taskStatus,
        }))
      );

      // Process createdTasks
      const createdTasksArray = createdTasksSnapshot.docs
        .map((doc, index) => ({
          ...doc.data(),
          id: index + 1,
          docRef: doc.id,
        }))
        .filter((task) => task.taskStatus !== "הושלמה");
      setRowsCreatedTasks(
        createdTasksArray.map((task, index) => ({
          id: index + 1,
          taskDoc: task.docRef,
          taskName: task.taskName,
          taskDescription: task.taskDescription,
          taskStartDate: task.taskStartDate,
          taskEndDate: task.taskEndDate,
          taskTime: task.taskTime,
          taskBudget: task.taskBudget,
          taskStatus: task.taskStatus,
        }))
      );
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    }
  }

  async function grabAllEvents() {
    if (!profile) return;
    try {
      const eventsRef = collection(db, "events");
      const myEventsQuery = query(
        eventsRef,
        where("assignees", "array-contains", "members/" + profile.email),
        orderBy("eventEndDate", "desc")
      );
      const createdEventsQuery = query(
        eventsRef,
        where("eventCreator", "==", "members/" + profile?.email),
        orderBy("eventEndDate", "desc")
      );
      const tasksRef = collection(db, "tasks");
      const allTasksQuery = query(tasksRef);

      const [myEventsSnapshot, createdEventsSnapshot, allTasksSnapshot] = await Promise.all([
        getDocs(myEventsQuery),
        getDocs(createdEventsQuery),
        getDocs(allTasksQuery),
      ]);

      // Process all tasks to create a map of event budgets
      const eventBudgets = {};
      allTasksSnapshot.docs.forEach((doc) => {
        const task = doc.data();
        if (task.relatedEvent) {
          const eventId = task.relatedEvent.split("/")[1];
          eventBudgets[eventId] = (eventBudgets[eventId] || 0) + (task.taskBudget || 0);
        }
      });

      // Process myEvents
      const myEventsAll = myEventsSnapshot.docs.map((doc, index) => {
        const event = doc.data();
        const totalTaskBudget = eventBudgets[doc.id] || 0;
        const isOverBudget =
          event.eventBudget !== undefined &&
          event.eventBudget !== null &&
          totalTaskBudget > event.eventBudget;
        return {
          ...event,
          id: index + 1,
          docRef: doc.id,
          totalTaskBudget,
          isOverBudget,
        };
      });

      let completeNum = myEventsAll.filter((event) => event.eventStatus === "הסתיים").length;
      setNumCompletedEvents(completeNum);
      setEventPercentage(Math.round((completeNum / myEventsAll.length) * 100));
      const myEventsArray = myEventsAll.filter((event) => event.eventStatus !== "הסתיים");
      setNumEvents(myEventsArray.length);
      setRowsEvents(
        myEventsArray.map((event, index) => ({
          id: index + 1,
          eventDoc: event.docRef,
          eventName: event.eventName,
          eventLocation: event.eventLocation,
          eventStartDate: event.eventStartDate,
          eventEndDate: event.eventEndDate,
          eventTime: event.eventTime,
          eventBudget: event.eventBudget,
          eventStatus: event.eventStatus,
          totalTaskBudget: event.totalTaskBudget,
          isOverBudget: event.isOverBudget,
        }))
      );

      // Process createdEvents
      const createdEventsArray = createdEventsSnapshot.docs
        .map((doc, index) => {
          const event = doc.data();
          const totalTaskBudget = eventBudgets[doc.id] || 0;
          const isOverBudget =
            event.eventBudget !== undefined &&
            event.eventBudget !== null &&
            totalTaskBudget > event.eventBudget;
          return {
            ...event,
            id: index + 1,
            docRef: doc.id,
            totalTaskBudget,
            isOverBudget,
          };
        })
        .filter((event) => event.eventStatus !== "הסתיים");

      setRowsCreatedEvents(
        createdEventsArray.map((event, index) => ({
          id: index + 1,
          eventDoc: event.docRef,
          eventName: event.eventName,
          eventLocation: event.eventLocation,
          eventStartDate: event.eventStartDate,
          eventEndDate: event.eventEndDate,
          eventTime: event.eventTime,
          eventBudget: event.eventBudget,
          eventStatus: event.eventStatus,
          totalTaskBudget: event.totalTaskBudget,
          isOverBudget: event.isOverBudget,
        }))
      );
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
  }

  async function fetchContact() {
    if (!profile) return;
    try {
      const logRef = collection(db, "log_contact");
      const q = query(
        logRef,
        where("destMember", "==", "members/" + profile.email),
        orderBy("timestamp", "desc")
      );
      const querySnapshot = await getDocs(q);
      const logAll = querySnapshot.docs.map((doc, index) => ({
        ...doc.data(),
        id: index + 1,
        docRef: doc.id,
      }));

      // Fetch full names for each srcMember
      const logsWithFullNames = await Promise.all(
        logAll.map(async (log) => {
          const srcMemberRef = doc(db, log.srcMember);
          const srcMemberDoc = await getDoc(srcMemberRef);
          const srcMemberData = srcMemberDoc.data();
          return {
            ...log,
            srcFullName: srcMemberData ? srcMemberData.fullName : "Unknown",
            srcProfileImage: srcMemberData ? srcMemberData.profileImage : null,
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
        sourceFullName: log.srcFullName,
        sourceProfileImage: log.srcProfileImage,
      }));
      setRowContact(logArray);
      setFilteredContactRows(logArray); // Set filteredContactRows to logArray initially
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
          grabAllEvents();
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
          grabAllTasks();
        }
      });
    });

    const createdTasksRef = collection(db, "tasks");
    const createdTasksQuery = query(
      createdTasksRef,
      where("taskCreator", "==", "members/" + user?.email)
    );
    const unsubscribeCreatedTasks = onSnapshot(createdTasksQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          grabAllTasks();
        }
      });
    });

    const createdEventsRef = collection(db, "events");
    const createdEventsQuery = query(
      createdEventsRef,
      where("eventCreator", "==", "members/" + user?.email)
    );
    const unsubscribeCreatedEvents = onSnapshot(createdEventsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" || change.type === "modified") {
          grabAllEvents();
        }
      });
    });

    // Cleanup function to unsubscribe from both snapshots
    return () => {
      unsubscribeEvents();
      unsubscribeTasks();
      unsubscribeCreatedTasks();
      unsubscribeCreatedEvents();
    };
  }, []);

  useEffect(() => {
    grabAllTasks();
    grabAllEvents();
    fetchContact();
  }, [profile]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (changePasswordRef.current && !changePasswordRef.current.contains(event.target)) {
        setShowResetPassword(false);
      }
      if (editUserRef.current && !editUserRef.current.contains(event.target)) {
        setShowEditProfile(false);
      }
      if (contactLogRef.current && !contactLogRef.current.contains(event.target)) {
        setShowContact(false);
      }
      if (editContactLogRef.current && !editContactLogRef.current.contains(event.target)) {
        setEditLog("");
      }
      if (anchorEl && !anchorEl.contains(event.target)) {
        setAnchorEl(null);
      }
    };

    // Add event listener when the component mounts
    document.addEventListener("mousedown", handleClickOutside);

    // Return a cleanup function to remove the event listener when the component unmounts
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showResetPassword, showEditProfile, anchorEl]);

  const handleSearchChange = (event) => {
    const searchValue = event.target.value.toLowerCase();
    setSearchValue(searchValue);
    const filteredRows = rowContact.filter((row) => {
      return (
        row.subject.toLowerCase().includes(searchValue) ||
        row.description.toLowerCase().includes(searchValue) ||
        row.sourceFullName.toLowerCase().includes(searchValue)
      );
    });
    setFilteredContactRows(filteredRows);
  };

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchValue]);

  const handleAvatarClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileImageChange = async (event) => {
    const file = event.target.files[0];
    if (file && profile) {
      if (profile.profileImage) {
        const storageRef = ref(storage, profile.profileImage);
        await deleteObject(storageRef);
      }
      const storageRef = ref(storage, `profile/${profile.email}/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      await updateDoc(doc(db, "members", profile.email), {
        profileImage: downloadURL,
      });
      fetchProfile();
      setAnchorEl(null);
    }
  };

  const handleDeleteProfileImage = async () => {
    if (profile && profile.profileImage) {
      const storageRef = ref(storage, profile.profileImage);
      await deleteObject(storageRef);
      await updateDoc(doc(db, "members", profile.email), {
        profileImage: "",
      });
      fetchProfile();
      setAnchorEl(null);
    }
  };

  const open = Boolean(anchorEl);
  const id = open ? "simple-popover" : undefined;

  const PageContent = ({ pageName }) => {
    switch (pageName) {
      case pages[0]:
        return (
          <div>
            <div className="user-profile-action-div">
              {user &&
                (user.privileges >= 2 ||
                  (Array.isArray(user.adminAccess) &&
                    user.adminAccess.includes("addContactUser"))) && (
                  <button
                    className="create-contact-log-button"
                    onClick={() => setShowContact(true)}>
                    תיעוד פנייה חדשה
                  </button>
                )}
              <div className="search-log-table">
                <svg
                  viewBox="0 0 32 32"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="#000000">
                  <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                  <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                  <g id="SVGRepo_iconCarrier">
                    <title>search</title>
                    <desc>Created with Sketch Beta.</desc>
                    <defs></defs>
                    <g id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                      <g
                        id="Icon-Set"
                        transform="translate(-256.000000, -1139.000000)"
                        fill="#000000">
                        <path
                          d="M269.46,1163.45 C263.17,1163.45 258.071,1158.44 258.071,1152.25 C258.071,1146.06 263.17,1141.04 269.46,1141.04 C275.75,1141.04 280.85,1146.06 280.85,1152.25 C280.85,1158.44 275.75,1163.45 269.46,1163.45 L269.46,1163.45 Z M287.688,1169.25 L279.429,1161.12 C281.591,1158.77 282.92,1155.67 282.92,1152.25 C282.92,1144.93 276.894,1139 269.46,1139 C262.026,1139 256,1144.93 256,1152.25 C256,1159.56 262.026,1165.49 269.46,1165.49 C272.672,1165.49 275.618,1164.38 277.932,1162.53 L286.224,1170.69 C286.629,1171.09 287.284,1171.09 287.688,1170.69 C288.093,1170.3 288.093,1169.65 287.688,1169.25 L287.688,1169.25 Z"
                          id="search"></path>
                      </g>
                    </g>
                  </g>
                </svg>
                <input
                  type="text"
                  ref={searchInputRef}
                  className="search-input"
                  placeholder="חיפוש תיעודים"
                  value={searchValue}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
            {filteredContactRows.length > 0 ? (
              <div style={{ height: 631, width: "100%" }}>
                <ThemeProvider theme={theme}>
                  <DataGrid
                    className="data-grid"
                    rows={filteredContactRows}
                    columns={user.privileges > 1 ? columnsContactAdmin : columnsContact}
                    initialState={{
                      pagination: {
                        paginationModel: { page: 0, pageSize: 10 },
                      },
                    }}
                    pageSizeOptions={[10, 20, 50]}
                    localeText={{
                      MuiTablePagination: {
                        labelDisplayedRows: ({ from, to, count }) =>
                          `${from}-${to} מתוך ${count !== -1 ? count : `יותר מ ${to}`}`,
                        labelRowsPerPage: "שורות בכל עמוד:",
                      },
                    }}
                    onCellDoubleClick={(params) => {
                      if (params.field === "sourceFullName")
                        navigate(`/profile/${params.row.srcMember.split("/")[1]}`);
                    }}
                  />
                </ThemeProvider>
              </div>
            ) : (
              <div className="no-logs">אין תיעודים למשתמש זה</div>
            )}
          </div>
        );
      case pages[1]:
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
                    paginationModel: { page: 0, pageSize: 10 },
                  },
                }}
                pageSizeOptions={[10, 20, 50]}
                localeText={{
                  MuiTablePagination: {
                    labelDisplayedRows: ({ from, to, count }) =>
                      `${from}-${to} מתוך ${count !== -1 ? count : `יותר מ-${to}`}`,
                    labelRowsPerPage: "שורות בכל עמוד:",
                  },
                }}
                onRowDoubleClick={(params) => navigate(`/task/${params.row.taskDoc}`)}
              />
            </ThemeProvider>
          </div>
        );
      case pages[2]:
        return (
          <div style={{ height: 631, width: "100%" }}>
            <ThemeProvider theme={theme}>
              <DataGrid
                className="data-grid"
                rows={rowsEvents}
                columns={columnsEvents}
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 10 },
                  },
                }}
                pageSizeOptions={[10, 20, 50]}
                localeText={{
                  MuiTablePagination: {
                    labelDisplayedRows: ({ from, to, count }) =>
                      `${from}-${to} מתוך ${count !== -1 ? count : `יותר מ ${to}`}`,
                    labelRowsPerPage: "שורות בכל עמוד:",
                  },
                }}
                onRowDoubleClick={(params) => navigate(`/event/${params.row.eventDoc}`)}
              />
            </ThemeProvider>
          </div>
        );
      case pages[3]:
        return (
          <div style={{ height: 631, width: "100%" }}>
            <ThemeProvider theme={theme}>
              <DataGrid
                className="data-grid"
                rows={rowsCreatedTasks}
                columns={columnsTasks}
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 10 },
                  },
                }}
                pageSizeOptions={[10, 20, 50]}
                localeText={{
                  MuiTablePagination: {
                    labelDisplayedRows: ({ from, to, count }) =>
                      `${from}-${to} מתוך ${count !== -1 ? count : `יותר מ ${to}`}`,
                    labelRowsPerPage: "שורות בכל עמוד:",
                  },
                }}
                onRowDoubleClick={(params) => navigate(`/task/${params.row.taskDoc}`)}
              />
            </ThemeProvider>
          </div>
        );
      case pages[4]:
        return (
          <div style={{ height: 631, width: "100%" }}>
            <ThemeProvider theme={theme}>
              <DataGrid
                className="data-grid"
                rows={rowsCreatedEvents}
                columns={columnsEvents}
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 10 },
                  },
                }}
                pageSizeOptions={[10, 20, 50]}
                localeText={{
                  MuiTablePagination: {
                    labelDisplayedRows: ({ from, to, count }) =>
                      `${from}-${to} מתוך ${count !== -1 ? count : `יותר מ ${to}`}`,
                    labelRowsPerPage: "שורות בכל עמוד:",
                  },
                }}
                onRowDoubleClick={(params) => navigate(`/event/${params.row.eventDoc}`)}
              />
            </ThemeProvider>
          </div>
        );
      default:
        return <div>Page Not Found</div>;
    }
  };

  const handleCloseForm = () => {
    setShowEditProfile(false);
    setShowResetPassword(false);
    setShowContact(false);
  };

  return (
    <div className="profile-page">
      {editLog !== "" && (
        <div className="popup-overlay">
          <div ref={editContactLogRef} className="popup-content">
            <EditContactLog
              target={editLog}
              onClose={() => {
                setEditLog("");
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
            <EditUser
              target={profile}
              onClose={() => {
                handleCloseForm();
                fetchProfile();
              }}
            />
          </div>
        </div>
      )}
      {showContact && (
        <div className="popup-overlay">
          <div ref={contactLogRef} className="popup-content">
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
            {(user.privileges === 2 || user.adminAccess.includes("manageUser")) && (
              <IconButton
                color="primary"
                className="profile-edit-icon"
                onClick={() => setShowEditProfile(true)}>
                <EditIcon color="default" className="edit-button" />
              </IconButton>
            )}
            <h1>{profile && profile.fullName}</h1>
            <h2>
              {profile && profile.department} • {profile && profile.role}
            </h2>
            <div className="profile-info-header">
              <input
                type="file"
                id="profileImageUpload"
                accept="image/*"
                onChange={handleProfileImageChange}
              />
              <div className="editImage">
                <Avatar
                  className="profile-avatar"
                  {...(profile && profile.profileImage
                    ? { src: profile.profileImage }
                    : stringAvatar(`${profile && profile.fullName}`))}
                  onClick={handleAvatarClick}
                  style={{ cursor: "pointer" }}
                />
                {user.email === profile.email && (
                  <IconButton id="editAvatar" onClick={handleAvatarClick}>
                    <EditIcon />
                  </IconButton>
                )}
              </div>
              {user.email === profile.email && (
                <Popover
                  id={id}
                  open={open}
                  anchorEl={anchorEl}
                  onClose={() => setAnchorEl(null)}
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                  }}
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "left",
                  }}>
                  <Box p={2}>
                    <label htmlFor="profileImageUpload">
                      <Button variant="text" component="span" className="upload-profile-pic">
                        העלאת תמונה
                      </Button>
                    </label>
                    {profile && profile.profileImage && (
                      <Button
                        variant="text"
                        onClick={handleDeleteProfileImage}
                        className="delete-profile-pic">
                        מחק תמונה
                      </Button>
                    )}
                  </Box>
                </Popover>
              )}
            </div>
            <div className="profile-stats-personal">
              <h2 className="title-info">פרטים אישיים</h2>
              <div
                className="profile-stats-row profile-personal-info"
                onClick={() => window.open(`https://wa.me/${profile && profile.phone}`, "_blank")}>
                <WhatsAppIcon />
                <h3 className="profile-phone">{profile && profile.phone}</h3>
              </div>
              <div className="profile-stats-row profile-personal-info">
                <AlternateEmailIcon />
                <h3>{profile && profile.email}</h3>
              </div>
            </div>
            <div className="profile-stats">
              <div className="profile-prsonal-progress">
                <h2 className="title-info">התקדמות אישית</h2>
                <div className="profile-stats-row">
                  <AssignmentIcon />
                  <h3>{numTasks} משימות פתוחות</h3>
                </div>
                <div className="profile-stats-row">
                  <AssignmentIcon />
                  <h3>{numEvents} אירועים פתוחים</h3>
                </div>
              </div>
              <div className="profile-info-progress">
                <div className="profile-tasks-progress">
                  <div className="profile-stats-row">
                    <TaskIcon />
                    <h3>{numCompletedTasks} משימות שהושלמו</h3>
                    <h3>({taskPercentage ? taskPercentage : 0}%)</h3>
                  </div>
                  {numCompletedTasks > 0 || numTasks > 0 ? (
                    <canvas id="taskCompletionChart"></canvas>
                  ) : (
                    ""
                  )}
                </div>
                <div className="profile-events-progress">
                  <div className="profile-stats-row">
                    <TaskIcon />
                    <h3>{numCompletedEvents} אירועים שהסתיימו</h3>
                    <h3>({eventPercentage ? eventPercentage : 0}%)</h3>
                  </div>
                  {numCompletedEvents > 0 || numEvents > 0 ? (
                    <canvas id="eventCompletionChart"></canvas>
                  ) : (
                    ""
                  )}
                </div>
              </div>
            </div>
            {user && profile && user.email === profile.email ? (
              <div className="profile-stats actions">
                <h2 className="title-info">פעולות משתמש</h2>
                <div
                  className="profile-stats-row profile-personal-info"
                  onClick={() => setShowResetPassword(true)}>
                  <VpnKeyIcon />
                  <h3 className="profile-phone">שינוי סיסמה נוכחית</h3>
                </div>
                <div
                  className="profile-stats-row profile-personal-info"
                  onClick={() => setShowEditProfile(true)}>
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
                    <TabList onChange={handlePageSwitch} aria-label="lab API tabs example">
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
