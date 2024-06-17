import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import { db, updateUserData } from "../firebase";
import { collection, query, where, getDocs, doc } from "firebase/firestore";
import "../styles/HomePage.css";
import Task from "./Task";
import Event from "./Event";
import CreateTask from "./CreateTask";
import CreateEvent from "./CreateEvent";

import Box from "@mui/material/Box";
import { DataGrid } from "@mui/x-data-grid";
import { colors } from "@mui/material";

function HomePage() {
  const [tasks, setTasks] = useState([]); // Initialize state with an empty array
  const [events, setEvents] = useState([]); // Initialize state with an empty array
  const [numTasks, setNumTasks] = useState(0);
  const [numEvents, setNumEvents] = useState(0);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);

  const columns = [
    {
      field: "id",
      headerName: "אינדקס",
      width: "3%",
      align: "right",
      colors: "red",
      flex: 1
    },
    { field: "taskName", headerName: "משימה", width: 150, align: "right", flex: 2},
    {
      field: "taskDescription",
      headerName: "תיאור",
      width: 150,
      align: "right", flex: 3
    },
    {
      field: "taskStartDate",
      headerName: "תאריך התחלה",
      width: 150,
      align: "right", flex: 2
    },
    {
      field: "taskEndDate",
      headerName: "תאריך סיום",
      width: 150,
      align: "right", flex: 2
    },
    { field: "taskTime", headerName: "שעת סיום", width: 150, align: "right", flex: 2 },
    {
      field: "taskStatus",
      headerName: "סטטוס",
      width: 150,
      align: "right", flex: 2
    }
  ];

  const rows = [
    {
      id: 1,
      taskName: "משימה 1",
      taskDescription:
        "תיאור 1 מאוד מאוד מאוד מאוד ארוך מאוד מאוד מאוד מאוד ארוך מאוד מאוד מאוד מאוד ארוך מאוד מאוד מאוד מאוד ארוך מאוד מאוד מאוד מאוד ארוך",
      taskStartDate: "תאריך 1",
      taskEndDate: "תאריך 1",
      taskTime: "שעה 1",
      taskStatus: "סטטוס 1"
    },
    {
      id: 2,
      taskName: "משימה 2",
      taskDescription: "תיאור 2",
      taskStartDate: "תאריך 2",
      taskEndDate: "תאריך 2",
      taskTime: "שעה 2",
      taskStatus: "סטטוס 2"
    }
  ];
  const user = JSON.parse(sessionStorage.getItem("user"));

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
      setTasks(taskArray);
      console.log(taskArray);
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
        .filter((event) => event.eventStatus !== "הושלמה");
      setNumEvents(eventsArray.length); // Update event count

      setEvents(eventsArray);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    }
  }

  // Fix trigger for fetching events / tasks
  useEffect(() => {
    grabMyEvents();
    grabMyTasks();
  }, []);

  const handleShowCreateTask = () => {
    setShowCreateEvent(false);
    setShowCreateTask(true);
  };

  const handleShowCreateEvent = () => {
    setShowCreateTask(false);
    setShowCreateEvent(true);
  };

  return (
    <div className="HomePage">
      <Navbar />
      <div className="home-content">
        <div className="display-create">
          {user.privileges > 1 && showCreateTask && (
            <div>
              <div
                className="action-close"
                onClick={() => {
                  setShowCreateTask(false);
                  updateUserData(user.email);
                }}
              >
                <svg
                  width="24px"
                  height="24px"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                >
                  <line
                    x1="17"
                    y1="7"
                    x2="7"
                    y2="17"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="7"
                    y1="7"
                    x2="17"
                    y2="17"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <CreateTask />
            </div>
          )}
          {user.privileges > 1 && showCreateEvent && (
            <div>
              <div
                className="action-close"
                onClick={() => {
                  setShowCreateEvent(false);
                  updateUserData(user.email);
                }}
              >
                <svg
                  width="24px"
                  height="24px"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                >
                  <line
                    x1="17"
                    y1="7"
                    x2="7"
                    y2="17"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="7"
                    y1="7"
                    x2="17"
                    y2="17"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <CreateEvent />
            </div>
          )}
        </div>
        <h1 className="title-home">דף הבית</h1>
        {user.privileges > 1 && (
          <div className="pending-actions">
            <div className="task-button" onClick={handleShowCreateTask}>
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
            <div className="task-button" onClick={handleShowCreateEvent}>
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
          <h2 className="pending-tasks">אין משימות פתוחות!</h2>
        ) : numTasks === 1 ? (
          <h2 className="pending-tasks">יש לך משימה אחת פתוחה</h2>
        ) : (
          <h2 className="pending-tasks">יש לך {numTasks} משימות פתוחות</h2>
        )}
        {numTasks > 0 && (
          <div className="display-pending-tasks">
            <Task
              key={0}
              task={{
                id: "אינדקס",
                taskName: "משימה",
                taskDescription: "תיאור",
                taskDate: "תאריך",
                taskTime: "שעה",
                taskStatus: "סטטוס",
                taskType: "title"
              }}
            />
            {tasks.map((task, index) => (
              <Task key={index} task={task} />
            ))}
          </div>
          // <Box
          //   sx={{ height: 400, width: "80%", margin: "auto" }}
          //   className="display-data"
          // >
          //   <DataGrid
          //     columns={columns}
          //     rows={rows}
          //     pageSize={5}
          //     sx={{
          //       "& .MuiDataGrid-cell": {
          //         color: "black",
          //         fontWeight: "bold"
          //         // Or any color that makes the text more visible
          //       }
          //     }}
          //   />
          // </Box>
        )}
        <hr className="divider" />
        {numEvents === 0 ? (
          <h2 className="title-home">אין אירועים קרובים!</h2>
        ) : numEvents === 1 ? (
          <h2 className="title-home">יש לך אירוע אחד בקרוב</h2>
        ) : (
          <h2 className="title-home">יש לך {numEvents} אירועים בקרוב</h2>
        )}
        {numEvents > 0 && (
          <div className="display-pending-events">
            <Event
              key={0}
              event={{
                id: "אינדקס",
                eventName: "אירוע",
                eventDescription: "תיאור",
                eventDate: "תאריך",
                eventTime: "שעה",
                eventStatus: "סטטוס",
                eventType: "title"
              }}
            />
            {events.map((event, index) => (
              <Event key={index} event={event} />
            ))}
          </div>

          // <Box sx={{ height: 400, width: "100%" }}></Box>
        )}
      </div>
    </div>
  );
}

export default HomePage;
