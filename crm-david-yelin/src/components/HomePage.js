import React, { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  getDoc,
  doc,
  orderBy,
} from "firebase/firestore";
import "../styles/HomePage.css";
import CreateTask from "./CreateTask";
import CreateEvent from "./CreateEvent";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { DataGrid } from "@mui/x-data-grid";
import { heIL } from "@mui/material/locale";
import { useNavigate } from "react-router-dom";
import "../styles/Styles.css";

function HomePage() {
  const [numTasks, setNumTasks] = useState(0);
  const [numEvents, setNumEvents] = useState(0);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [rowsTasks, setRowsTasks] = useState([]);
  const [rowsEvents, setRowsEvents] = useState([]);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();

  const theme = createTheme(
    {
      direction: "rtl",
      typography: {
        fontSize: 24,
      },
    },
    heIL
  );

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

  const columnsTasks = [
    {
      field: "id",
      headerName: "אינדקס",
      align: "right",
      flex: 1,
    },
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
    {
      field: "taskBudget",
      headerName: "תקציב",
      align: "right",
      flex: 1,
      renderCell: (params) => {
        return (
          <div>{params.row.taskBudget ? `₪${params.row.taskBudget.toLocaleString()}` : "אין"}</div>
        );
      },
    },
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
  ];

  const columnsEvents = [
    {
      field: "id",
      headerName: "אינדקס",
      align: "right",
      flex: 1,
    },
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
      flex: 2,
    },
    {
      field: "eventBudget",
      headerName: "תקציב/תקציב נותר",
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
    {
      field: "eventStartDate",
      headerName: "תאריך התחלה",
      align: "right",
      flex: 1.5,
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
      flex: 1.5,
      renderCell: (params) => {
        const date = new Date(params.row.eventEndDate);
        const formattedDate = date.toLocaleDateString("he-IL").replaceAll("/", "-");
        return <div>{formattedDate}</div>;
      },
    },
    {
      field: "eventTime",
      headerName: "שעה",
      align: "right",
      flex: 1.5,
    },
    {
      field: "eventStatus",
      headerName: "סטטוס",
      align: "right",
      flex: 1.5,
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
      field: "completionPercentage",
      headerName: "אחוז השלמה",
      align: "right",
      flex: 1,
    },
  ];

  const createTaskRef = useRef(null);
  const createEventRef = useRef(null);

  async function grabMyTasks() {
    try {
      const tasksRef = collection(db, "tasks");
      const q = query(tasksRef, where("assignees", "array-contains", "members/" + user?.email));
      const querySnapshot = await getDocs(q);
      const taskArray = querySnapshot.docs
        .map((doc, index) => ({
          ...doc.data(),
          id: index + 1,
          docRef: doc.id,
        }))
        .filter((task) => task.taskStatus !== "הושלמה");

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
        taskBudget: task.taskBudget,
        taskStatus: task.taskStatus,
      }));
      setRowsTasks(rowsTasksData); // Update rows state
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    }
  }

  async function calculateEventStats(eventId, eventBudget) {
    let completionPercentage;
    try {
      const eventDoc = await getDoc(doc(db, "events", eventId));
      if (eventDoc.exists() && eventDoc.data().eventStatus === "הסתיים") {
        completionPercentage = 100;
      }

      const tasksQuery = query(
        collection(db, "tasks"),
        where("relatedEvent", "==", `events/${eventId}`),
        orderBy("taskEndDate", "desc")
      );
      const tasksSnapshot = await getDocs(tasksQuery);
      const tasks = tasksSnapshot.docs.map((doc) => doc.data());

      if (tasks.length === 0) {
        tasks.length = 1;
      }

      const completedTasks = tasks.filter((task) => task.taskStatus === "הושלמה").length;
      if (eventDoc.data().eventStatus !== "הסתיים") {
        completionPercentage = (completedTasks / tasks.length) * 100;
      }

      const totalTaskBudget = tasks.reduce((sum, task) => sum + (task.taskBudget || 0), 0);
      const isOverBudget = totalTaskBudget > eventBudget;

      return {
        completionPercentage,
        totalTaskBudget,
        isOverBudget,
      };
    } catch (error) {
      console.error("Error calculating event stats:", error);
      return { completionPercentage: 0, totalTaskBudget: 0, isOverBudget: false };
    }
  }

  async function grabMyEvents() {
    try {
      const eventsRef = collection(db, "events");
      const q = query(
        eventsRef,
        where("assignees", "array-contains", "members/" + user?.email),
        orderBy("eventEndDate", "desc")
      );
      const querySnapshot = await getDocs(q);
      const eventsArray = querySnapshot.docs
        .map((doc, index) => ({
          ...doc.data(),
          id: index + 1,
          docRef: doc.id,
        }))
        .filter((event) => event.eventStatus !== "הסתיים");
      setNumEvents(eventsArray.length);

      const rowsEventsData = await Promise.all(
        eventsArray.map(async (event, index) => {
          const { completionPercentage, totalTaskBudget, isOverBudget } = await calculateEventStats(
            event.docRef,
            event.eventBudget
          );
          return {
            id: index + 1,
            eventDoc: event.docRef,
            eventName: event.eventName,
            eventLocation: event.eventLocation,
            eventStartDate: event.eventStartDate,
            eventEndDate: event.eventEndDate,
            eventTime: event.eventTime,
            eventBudget: event.eventBudget,
            eventStatus: event.eventStatus,
            completionPercentage: `${completionPercentage}%`,
            totalTaskBudget: totalTaskBudget,
            isOverBudget: isOverBudget,
          };
        })
      );
      setRowsEvents(rowsEventsData);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
  }

  useEffect(() => {
    const eventsRef = collection(db, "events");
    const eventsQuery = query(
      eventsRef,
      where("assignees", "array-contains", "members/" + user?.email)
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
      where("assignees", "array-contains", "members/" + user?.email)
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
    // Fetch tasks and events when the user changes
    grabMyTasks();
    grabMyEvents();
  }, [user]);

  const handleShowCreateTask = () => {
    setShowCreateEvent(false);
    setShowCreateTask(true);
  };

  const handleShowCreateEvent = () => {
    setShowCreateTask(false);
    setShowCreateEvent(true);
  };

  const handleCloseForms = () => {
    setShowCreateTask(false);
    setShowCreateEvent(false);
  };

  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem("user"));
    if (userData) setUser(userData);
    else {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (userData) setUser(userData);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (createTaskRef.current && !createTaskRef.current.contains(event.target)) {
        setShowCreateTask(false);
      }

      if (createEventRef.current && !createEventRef.current.contains(event.target)) {
        setShowCreateEvent(false);
      }
    };
    // Add the event listener when the component mounts
    document.addEventListener("mousedown", handleClickOutside);

    // Return a cleanup function to remove the event listener when the component unmounts
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="home-content">
      <div className="display-create">
        {user &&
          ((Array.isArray(user.adminAccess) && user.adminAccess.includes("createEvent")) ||
            user.privileges >= 2) &&
          showCreateTask && (
            <div className="popup-overlay">
              <div ref={createTaskRef} className="popup-content">
                <CreateTask onClose={handleCloseForms} />
              </div>
            </div>
          )}
        {user &&
          ((Array.isArray(user.adminAccess) && user.adminAccess.includes("createEvent")) ||
            user.privileges >= 2) &&
          showCreateEvent && (
            <div className="popup-overlay">
              <div ref={createEventRef} className="popup-content">
                <CreateEvent onClose={handleCloseForms} />
              </div>
            </div>
          )}
      </div>

      <h1 className="page-title-home">היי {user?.fullName}</h1>
      <div className="page-subtitle">כאן ניתן להתעדכן עם האירועים והמשימות שלך</div>
      <div className="pending-actions">
        {user &&
          ((user && Array.isArray(user.adminAccess) && user.adminAccess.includes("createTask")) ||
            user.privileges >= 2) && (
            <div className="action-button add-task-button" onClick={handleShowCreateTask}>
              <svg
                width="24px"
                height="24px"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                <g id="SVGRepo_iconCarrier">
                  <path
                    d="M7 12L12 12M12 12L17 12M12 12V7M12 12L12 17"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"></path>
                </g>
              </svg>
              הוסף משימה
            </div>
          )}
        {user &&
          user &&
          ((Array.isArray(user.adminAccess) && user.adminAccess.includes("createEvent")) ||
            user.privileges >= 2) && (
            <div className="action-button add-event-button" onClick={handleShowCreateEvent}>
              <svg
                width="24px"
                height="24px"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                <g id="SVGRepo_iconCarrier">
                  <path
                    d="M7 12L12 12M12 12L17 12M12 12V7M12 12L12 17"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"></path>
                </g>
              </svg>
              הוסף אירוע
            </div>
          )}
      </div>
      {numTasks === 0 ? (
        <h2 className="title-home">אין משימות פתוחות!</h2>
      ) : numTasks === 1 ? (
        <h2 className="title-home">יש לך משימה אחת פתוחה</h2>
      ) : (
        <h2 className="title-home">יש לך {numTasks} משימות פתוחות</h2>
      )}
      <div style={{ height: 372, width: "90%" }}>
        <ThemeProvider theme={theme}>
          <DataGrid
            direction="rtl"
            className="data-grid"
            rows={rowsTasks}
            columns={columnsTasks}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 5 },
              },
            }}
            pageSizeOptions={[5, 10, 20]}
            localeText={{
              // Customizing displayed rows text
              MuiTablePagination: {
                labelDisplayedRows: ({ from, to, count }) =>
                  `${from}-${to} מתוך ${count !== -1 ? count : `יותר מ-${to}`}`,
                labelRowsPerPage: "שורות בכל עמוד:", // Optional: customize other texts
              },
            }}
            onRowDoubleClick={(params) => {
              navigate(`/task/${params.row.taskDoc}`);
            }}
          />
        </ThemeProvider>
      </div>
      <hr className="divider" />
      {numEvents === 0 ? (
        <h2 className="title-home">אין אירועים פתוחים!</h2>
      ) : numEvents === 1 ? (
        <h2 className="title-home">יש לך אירוע פתוח אחד</h2>
      ) : (
        <h2 className="title-home">יש לך {numEvents} אירועים פתוחים</h2>
      )}
      <div style={{ height: 372, width: "90%" }}>
        <ThemeProvider theme={theme}>
          <DataGrid
            className="data-grid"
            rows={rowsEvents}
            columns={columnsEvents}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 5 },
              },
            }}
            pageSizeOptions={[5, 10, 20]}
            localeText={{
              MuiTablePagination: {
                labelDisplayedRows: ({ from, to, count }) =>
                  `${from}-${to} מתוך ${count !== -1 ? count : `יותר מ ${to}`}`,
                labelRowsPerPage: "שורות בכל עמוד:",
              },
            }}
            onRowDoubleClick={(params) => {
              navigate(`/event/${params.row.eventDoc}`);
            }}
          />
        </ThemeProvider>
      </div>
      <div className="footer"></div>
    </div>
  );
}

export default HomePage;
