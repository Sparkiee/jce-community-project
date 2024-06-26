import React, { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot
} from "firebase/firestore";
import "../styles/HomePage.css";
import CreateTask from "./CreateTask";
import CreateEvent from "./CreateEvent";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { DataGrid } from "@mui/x-data-grid";
import { heIL } from "@mui/material/locale";
import "../styles/Styles.css";

function HomePage() {
  const [numTasks, setNumTasks] = useState(0);
  const [numEvents, setNumEvents] = useState(0);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [rowsTasks, setRowsTasks] = useState([]);
  const [rowsEvents, setRowsEvents] = useState([]);

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
      headerName: "שעה",
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

  const user = JSON.parse(sessionStorage.getItem("user"));
  const createTaskRef = useRef(null);
  const createEventRef = useRef(null);

  async function grabMyTasks() {
    try {
      const tasksRef = collection(db, "tasks");
      const q = query(
        tasksRef,
        where("assignees", "array-contains", "members/" + user.email)
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
        where("assignees", "array-contains", "members/" + user.email)
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
      where("assignees", "array-contains", "members/" + user.email)
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
      where("assignees", "array-contains", "members/" + user.email)
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
    const handleClickOutside = (event) => {
      if (
        createTaskRef.current &&
        !createTaskRef.current.contains(event.target)
      ) {
        setShowCreateTask(false);
      }
      if (
        createEventRef.current &&
        !createEventRef.current.contains(event.target)
      ) {
        setShowCreateEvent(false);
      }
    };

    if (showCreateTask || showCreateEvent) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCreateTask, showCreateEvent]);

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

  return (
    <div className="home-content">
      <div className="display-create">
        {user.privileges > 1 && showCreateTask && (
          <div className="popup-overlay" ref={createTaskRef}>
            <div className="popup-content">
              <CreateTask onClose={handleCloseForms} />
            </div>
          </div>
        )}
        {user.privileges > 1 && showCreateEvent && (
          <div ref={createEventRef} className="popup-overlay">
            <div className="popup-content">
              <CreateEvent onClose={handleCloseForms} />
            </div>
          </div>
        )}
      </div>

      <div className="page-title-home">
        <h1>היי {user.fullName}</h1>
      </div>
      <div className="page-subtitle">
        כאן תוכל להתעדכן עם האירועים והמשימות שלך
      </div>
      {user.privileges > 1 && (
        <div className="pending-actions">
          <div
            className="action-button add-task-button"
            onClick={handleShowCreateTask}
          >
            <svg
              width="24px"
              height="24px"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
              <g
                id="SVGRepo_tracerCarrier"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></g>
              <g id="SVGRepo_iconCarrier">
                <path
                  d="M7 12L12 12M12 12L17 12M12 12V7M12 12L12 17"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </g>
            </svg>
            הוסף משימה
          </div>
          <div
            className="action-button add-event-button"
            onClick={handleShowCreateEvent}
          >
            <svg
              width="24px"
              height="24px"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
              <g
                id="SVGRepo_tracerCarrier"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></g>
              <g id="SVGRepo_iconCarrier">
                <path
                  d="M7 12L12 12M12 12L17 12M12 12V7M12 12L12 17"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </g>
            </svg>
            הוסף אירוע
          </div>
        </div>
      )}
      {numTasks === 0 ? (
        <h2 className="title-home">אין משימות פתוחות!</h2>
      ) : numTasks === 1 ? (
        <h2 className="title-home">יש לך משימה אחת פתוחה</h2>
      ) : (
        <h2 className="title-home">יש לך {numTasks} משימות פתוחות</h2>
      )}
      <div style={{ height: 371, width: "80%" }}>
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
                  `${from}-${to} מתוך ${count !== -1 ? count : `יותר מ-${to}`}`,
                labelRowsPerPage: "שורות בכל עמוד:" // Optional: customize other texts
              }
            }}
          />
        </ThemeProvider>
      </div>
      <hr className="divider" />
      {numEvents === 0 ? (
        <h2 className="title-home">אין אירועים קרובים!</h2>
      ) : numEvents === 1 ? (
        <h2 className="title-home">יש לך אירוע אחד בקרוב</h2>
      ) : (
        <h2 className="title-home">יש לך {numEvents} אירועים בקרוב</h2>
      )}
      <div style={{ height: 372, width: "80%" }}>
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
                  `${from}-${to} מתוך ${count !== -1 ? count : `יותר מ ${to}`}`,
                labelRowsPerPage: "שורות בכל עמוד:"
              }
            }}
          />
        </ThemeProvider>
      </div>
      <div className="footer"></div>
    </div>
  );
}

export default HomePage;
