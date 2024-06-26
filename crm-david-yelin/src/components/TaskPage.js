import React, { useEffect, useState,useCallback } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import Avatar from '@mui/material/Avatar';
import "../styles/TaskPage.css";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";

function TaskPage() {
  const { taskId } = useParams();
  const [task, setTask] = useState(null);
  const [assignees, setAssignees] = useState([]);
  const [eventName, setEventName] = useState("");
  const [userPrivileges, setUserPrivileges] = useState(1);



  const fetchUserPrivileges = useCallback(() => {
    const user = JSON.parse(sessionStorage.getItem('user'));
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
          setTask(taskData);

          // Fetch assignee data
          const assigneeEmails = taskData.assignees.map(email => email.split("/")[1]);
          const assigneePromises = assigneeEmails.map(email => getDoc(doc(db, "members", email)));
          const assigneeDocs = await Promise.all(assigneePromises);
          const assigneeData = assigneeDocs.map(doc => doc.exists() ? doc.data() : null).filter(data => data);
          setAssignees(assigneeData);

          // Extract event ID from the full path and fetch event data
          const eventPathSegments = taskData.relatedEvent.split("/");
          const eventId = eventPathSegments[eventPathSegments.length - 1];
          const eventDoc = await getDoc(doc(db, "events", eventId));
          if (eventDoc.exists()) {
            setEventName(eventDoc.data().eventName);
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

  }, [taskId]);

  if (!task) {
    return <div>טוען...</div>;
  }

  return (
    <div className="task-page">
      <div className="task-details">
        <h1>{task.taskName}</h1>
        <div className="task-info">
          <p><strong>תיאור:</strong> {task.taskDescription}</p>
          <p><strong>אירוע משוייך:</strong> {eventName}</p>
          <p><strong>תאריך התחלה:</strong> {task.taskStartDate}</p>
          <p><strong>תאריך יעד:</strong> {task.taskEndDate}</p>
          <p><strong>סטטוס:</strong> {task.taskStatus}</p>
          <p><strong>שעת סיום:</strong> {task.taskTime}</p>
        </div>
        {userPrivileges >= 2 && (
              <IconButton aria-label="edit" >
                <EditIcon />
              </IconButton>
            )}
      </div>
      <div className="task-assignees">
        <h2>משוייכים</h2>
        <div className="assignees-list">
          {assignees.map((assignee, index) => (
            <div key={index} className="assignee-item">
              <Avatar alt={assignee.fullName} src={assignee.avatarUrl || "/defaultAvatar.png"} />
              <p>{assignee.fullName}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TaskPage;
