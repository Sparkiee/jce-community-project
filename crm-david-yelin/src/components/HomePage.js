import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import { db, updateUserData } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc
} from "firebase/firestore";
import "../styles/HomePage.css";
import Task from "./Task";
import Event from "./Event";
import CreateTask from "./CreateTask";
import CreateEvent from "./CreateEvent";

function HomePage() {
  const [tasks, setTasks] = useState([]); // Initialize state with an empty array
  const [events, setEvents] = useState([]); // Initialize state with an empty array
  const [numTasks, setNumTasks] = useState(0);
  const [numEvents, setNumEvents] = useState(0);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);

  const user = JSON.parse(sessionStorage.getItem("user"));

  useEffect(() => {
    async function grabMyTasks() {
      try {
        const tasksRef = collection(db, "tasks");

        const q = query(tasksRef, where("assignees", "!=", null));

        const querySnapshot = await getDocs(q);
        const memberDocRef = doc(db, "members", user.email);
        const tasksArray = querySnapshot.docs
          .map((doc) => doc.data()) // Transform each doc to its data
          .filter(
            (task) =>
              task.assignees.some(
                (assignee) => assignee.path === memberDocRef.path
              ) && task.status !== "הושלמה"
          );

        // setTasks(tasksArray); // Update state with fetched tasks
        setNumTasks(tasksArray.length); // Update task count

        const indexedTasks = tasksArray.map((task, index) => ({
          ...task,
          id: index + 1
        }));

        setTasks(indexedTasks);
      } catch (error) {
        // console.error("Failed to fetch tasks:", error);
      }
    }

    async function grabMyEvents() {
      try {
        const eventsRef = collection(db, "events");
        const q = query(eventsRef, where("assignees", "!=", null));
        const querySnapshot = await getDocs(q);

        // console.log(querySnapshot.docs.);

        const memberDocRef = doc(db, "members", user.email);
        const eventsArray = querySnapshot.docs
          .map((doc) => ({
            ...doc.data(), // Spread the document data
            id: doc.id, // Save the document ID, assuming you want the Firestore document ID as a reference
            docRef: doc.ref // Save the document reference
          }))
          .filter(
            (event) =>
              event.assignees.some(
                (assignee) => assignee.path === memberDocRef.path
              ) && event.status !== "הושלמה"
          );
        //   .map((doc) => doc.data()) // Transform each doc to its data
        //   .filter(
        //     (event) =>
        //       event.assignees.some(
        //         (assignee) => assignee.path === memberDocRef.path
        //       ) && event.status !== "הושלמה"
        //   );
        setNumEvents(eventsArray.length); // Update event count

        const indexedEvents = eventsArray.map((event, index) => ({
          ...event,
          id: index + 1
        }));

        setEvents(indexedEvents);
      } catch (error) {
        // console.error("Failed to fetch tasks:", error);
      }
    }

    grabMyEvents();
    grabMyTasks();
  }, [user]);

  const handleShowCreateTask = () => {
    setShowCreateTask(true);
  };

  const handleShowCreateEvent = () => {
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
                taskName: "משימה",
                taskDescription: "תיאור",
                taskDate: "תאריך",
                taskTime: "שעה",
                taskStatus: "סטטוס",
                taskType: "title"
              }}
            />
            {tasks.map((task, index) => (
              // Assuming Task is a component that takes a task object as a prop
              <Task key={index} task={task} />
              // Or if you don't have a Task component, you can directly render the task details here
              // <div key={index}>Task Name: {task.name}</div>
            ))}
          </div>
        )}
        <hr className="divider" />
        {numEvents === 0 ? (
          <h2 className="title-home">אין אירועים קרובים!</h2>
        ) : numEvents === 1 ? (
          <h2 className="title-home">יש אירוע אחד בקרוב</h2>
        ) : (
          <h2 className="title-home">יש {numEvents} אירועים בקרוב</h2>
        )}
        <div className="display-pending-tasks">
          <Event
            key={0}
            event={{
              eventName: "משימה",
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
      </div>
    </div>
  );
}

export default HomePage;
