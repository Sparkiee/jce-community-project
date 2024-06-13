import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import { db } from "../firebase";
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
import CreateTask from "./CreateTask";

function HomePage() {
  const [tasks, setTasks] = useState([]); // Initialize state with an empty array
  const [numTasks, setNumTasks] = useState(0);
  const [numEvents, setNumEvents] = useState(0);
  const [showCreateTask, setShowCreateTask] = useState(false);

  useEffect(() => {
    async function grabMyTasks() {
      const user = JSON.parse(sessionStorage.getItem("user"));
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

        setTasks(tasksArray); // Update state with fetched tasks
        setNumTasks(tasksArray.length); // Update task count
      } catch (error) {
        // console.error("Failed to fetch tasks:", error);
      }
    }

    grabMyTasks();
  }, []);

  const handleShowCreateTask = () => {
    setShowCreateTask(true);
  };

  return (
    <div className="HomePage">
      <Navbar />
      {showCreateTask && <CreateTask />}
      <div className="home-content">
        <h1 className="title-home">דף הבית</h1>
        <div className="pending-tasks-actions">
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
          </div>
        {numTasks === 0 ? (
          <h2 className="pending-tasks">אין משימות פתוחות!</h2>
        ) : numTasks === 1 ? (
          <h2 className="pending-tasks">יש לך משימה אחת פתוחה</h2>
        ) : (
          <h2 className="pending-tasks">יש לך {numTasks} משימות פתוחות</h2>
        )}
        <div className="display-pending-tasks">
          {tasks.map((task, index) => (
            // Assuming Task is a component that takes a task object as a prop
            <Task key={index} task={task} />
            // Or if you don't have a Task component, you can directly render the task details here
            // <div key={index}>Task Name: {task.name}</div>
          ))}
        </div>
        <hr className="divider" />
        {numEvents === 0 ? (
          <h2 className="title-home">אין אירועים קרובים!</h2>
        ) : numEvents === 1 ? (
          <h2 className="title-home">יש אירוע אחד בקרוב</h2>
        ) : (
          <h2 className="title-home">יש {numEvents} אירועים בקרוב</h2>
        )}
      </div>
    </div>
  );
}

export default HomePage;
