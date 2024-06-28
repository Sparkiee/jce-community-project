import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import Avatar from "@mui/material/Avatar";
import "../styles/TaskPage.css";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import EditTask from "./EditTask";

function stringToColor(string) {
  let hash = 0;
  for (let i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = "#";
  for (let i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  return color;
}

function stringAvatar(name) {
  const nameParts = name.split(" ");
  let initials = nameParts[0][0];
  if (nameParts.length > 1) {
    initials += nameParts[1][0];
  }
  return {
    sx: {
      bgcolor: stringToColor(name),
    },
    children: initials,
  };
}

function TaskPage() {
  const { taskId } = useParams();
  const [task, setTask] = useState(null);
  const [assignees, setAssignees] = useState([]);
  const [eventName, setEventName] = useState("");
  const [userPrivileges, setUserPrivileges] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const editTaskRef = useRef(null);
  const [isUserAnAssignee, setIsUserAnAssignee] = useState(false);

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

  const fetchUserPrivileges = useCallback(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (user && user.privileges) {
      setUserPrivileges(user.privileges);
    }
  }, []);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const taskDoc = await getDoc(doc(db, "tasks", taskId));
        if (taskDoc.exists()) {
          const taskData = taskDoc.data();
          setTask({ ...taskData, taskDoc: taskId }); // Ensure taskDoc is included in the task object

          // Fetch assignee data
          const assigneeEmails = taskData.assignees.map((email) => email.split("/")[1]);
          const assigneePromises = assigneeEmails.map((email) => getDoc(doc(db, "members", email)));
          const assigneeDocs = await Promise.all(assigneePromises);
          const assigneeData = assigneeDocs
            .map((doc) => (doc.exists() ? doc.data() : null))
            .filter((data) => data);
          setAssignees(assigneeData);

          const user = JSON.parse(sessionStorage.getItem("user"));
          if (user && assigneeEmails.includes(user.email)) {
            setIsUserAnAssignee(true);
          }

          // Extract event ID from the full path and fetch event data
          if (taskData.relatedEvent && taskData.relatedEvent.split("/").length === 2) {
            const eventPathSegments = taskData.relatedEvent.split("/");
            const eventId = eventPathSegments[eventPathSegments.length - 1];
            const eventDoc = await getDoc(doc(db, "events", eventId));
            if (eventDoc.exists()) {
              setEventName(eventDoc.data().eventName);
            }
          } else {
            setEventName("");
          }
        } else {
          console.error("No such document!");
        }
      } catch (error) {
        console.error("Error fetching task:", error);
      }
    };

    fetchTask();
    fetchUserPrivileges();
  }, [taskId, fetchUserPrivileges]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCloseEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    // Fetch task details again to refresh the data
    const fetchTask = async () => {
      try {
        const taskDoc = await getDoc(doc(db, "tasks", taskId));
        if (taskDoc.exists()) {
          const taskData = taskDoc.data();
          setTask({ ...taskData, taskDoc: taskId }); // Ensure taskDoc is included in the task object

          // Fetch assignee data
          const assigneeEmails = taskData.assignees.map((email) => email.split("/")[1]);
          const assigneePromises = assigneeEmails.map((email) => getDoc(doc(db, "members", email)));
          const assigneeDocs = await Promise.all(assigneePromises);
          const assigneeData = assigneeDocs
            .map((doc) => (doc.exists() ? doc.data() : null))
            .filter((data) => data);
          setAssignees(assigneeData);

          // Extract event ID from the full path and fetch event data
          if (taskData.relatedEvent && taskData.relatedEvent.split("/").length === 2) {
            const eventPathSegments = taskData.relatedEvent.split("/");
            const eventId = eventPathSegments[eventPathSegments.length - 1];
            const eventDoc = await getDoc(doc(db, "events", eventId));
            if (eventDoc.exists()) {
              setEventName(eventDoc.data().eventName);
            }
          } else {
            setEventName("");
          }
        } else {
          console.error("No such document!");
        }
      } catch (error) {
        console.error("Error fetching task:", error);
      }
    };

    fetchTask();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (editTaskRef.current && !editTaskRef.current.contains(event.target)) {
        setIsEditing(false);
      }
    };

    if (isEditing) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditing]);

  if (!task) {
    return <div>טוען...</div>;
  }

  return (
    <div className="task-page">
      <div className="task-page-style">
        <div className="task-page-details">
          <h1>{task.taskName}</h1>
          <div className="task-page-info">
            <div>
              <p>
                <strong>תיאור:</strong> {task.taskDescription}
              </p>
              <p>
                <strong>אירוע משוייך:</strong> {eventName}
              </p>
              <p>
                <strong>תאריך התחלה:</strong> {task.taskStartDate}
              </p>
              <p>
                <strong>תאריך יעד:</strong> {task.taskEndDate}
              </p>
              <p>
                <span className="status-cell">
                  <strong>סטטוס: </strong>
                  <span className={`status-circle ${getStatusColorClass(task.taskStatus)}`}></span>
                  {task.taskStatus}
                </span>
              </p>
              <p>
                <strong>שעת סיום:</strong> {task.taskTime}
              </p>
              {(userPrivileges >= 2 || isUserAnAssignee) && (
                <p>
                  <strong>תקציב: </strong>₪{task.taskBudget.toLocaleString()}
                </p>
              )}
              {/* display currency only to admins and task related members */}
            </div>
            {userPrivileges >= 2 && (
              <IconButton
                className="task-page-edit-icon"
                aria-label="edit"
                onClick={handleEditClick}>
                <EditIcon />
              </IconButton>
            )}
          </div>
        </div>

        {isEditing && task && (
          <div className="edit-task-page-popup">
            <div className="edit-task-page-popup-content" ref={editTaskRef}>
              <div className="action-close" onClick={handleCloseEdit}>
                <svg
                  width="24px"
                  height="24px"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor">
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
              <EditTask task={task} onClose={handleCloseEdit} onTaskUpdated={handleSaveEdit} />
            </div>
          </div>
        )}
      </div>
      <div className="lower-task-page-content">
        <div className="task-page-participants">
          <h2>משתתפים</h2>
          {assignees.map((assignee, index) => (
            <div key={index} className="assignee-task-page-item">
              <Avatar {...stringAvatar(assignee.fullName)} />
              <p>{assignee.fullName}</p>
            </div>
          ))}
        </div>
        <div className="task-page-files">
          <h2>This is where the files will be</h2>
        </div>
      </div>
      <div className="task-page-comments">
        <h2>The is where the chat will be</h2>
      </div>
      <div className="footer"></div>
    </div>
  );
}

export default TaskPage;
