import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import Avatar from "@mui/material/Avatar";
import "../styles/TaskPage.css";
import "../styles/Styles.css";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import EditTask from "./EditTask";
import DiscussionList from "./DiscussionList";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { heIL } from "@mui/material/locale";
import Box from "@mui/material/Box";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import { Tab } from "@mui/material";

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
  const pages = ["קבצים", "צאט"];
  const handlePageSwitch = (event, newValue) => {
    setPage(newValue);
  };
  const [page, setPage] = useState(pages[0]);
  const { taskId } = useParams();
  const [task, setTask] = useState(null);
  const [assignees, setAssignees] = useState([]);
  const [eventName, setEventName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [fullDiscussion, setFullDiscussion] = useState(null);
  const editTaskRef = useRef(null);
  const [isUserAnAssignee, setIsUserAnAssignee] = useState(false);
  const [taskCreatorFullName, setTaskCreatorFullName] = useState("");
  const [eventId, setEventId] = useState("");

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

  const user = JSON.parse(sessionStorage.getItem("user"));

  const getMemberFullName = async (email) => {
    try {
      const memberDoc = await getDoc(doc(db, "members", email));
      if (memberDoc.exists()) {
        return memberDoc.data().fullName;
      }
    } catch (e) {
      console.error("Error getting member document: ", e);
    }
  };

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const taskDoc = await getDoc(doc(db, "tasks", taskId));
        if (taskDoc.exists()) {
          const taskData = taskDoc.data();
          setTask({ ...taskData, taskDoc: taskId }); // Ensure taskDoc is included in the task object

          // Fetch task creator's full name
          const taskCreatorFullName = await getMemberFullName(taskData.taskCreator.split("/")[1]);
          setTaskCreatorFullName(taskCreatorFullName);

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
            setEventId(eventId);
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
  }, [taskId]);

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
            setEventId(eventId);
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

  const handleShowFullDiscussion = async (commentId) => {
    try {
      const commentDoc = await getDoc(doc(db, "discussions", commentId));
      if (commentDoc.exists()) {
        setFullDiscussion(commentDoc.data());
      } else {
        console.error("No such discussion document!");
      }
    } catch (error) {
      console.error("Error fetching discussion:", error);
    }
  };

  if (!task) {
    return <div>טוען...</div>;
  }

  const PageContent = ({ pageName }) => {
    switch (pageName) {
      case pages[0]:
        return <h2>פה יהיו הקבצים</h2>;
      case pages[1]:
        return (
          <div className="task-discussion">
            <DiscussionList eventId={taskId} onShowFullDiscussion={handleShowFullDiscussion} />
          </div>
        );
      default:
        return <h2>Page Not Found</h2>;
    }
  };

  return (
    <div className="task-page">
      <div className="task-page-container">
        <div className="task-page-right-side">
          <div className="task-page-style">
            <div className="task-page-details">
              <h1>{task.taskName}</h1>
              <div className="task-page-info">
                <div>
                  <p>
                    <strong>תיאור:</strong> {task.taskDescription}
                  </p>
                  <p className="link-to-event-from-task-page">
                    <strong>שייך לאירוע :</strong> <Link to={`/event/${eventId}`}>{eventName}</Link>
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
                      <span
                        className={`status-circle ${getStatusColorClass(
                          task.taskStatus
                        )} circle-space`}></span>
                      {task.taskStatus}
                    </span>
                  </p>
                  <p>
                    <strong>שעת סיום:</strong> {task.taskTime}
                  </p>
                  {(user.privileges == 2 || isUserAnAssignee) && (
                    <p>
                      <strong>תקציב: </strong>₪{task.taskBudget.toLocaleString()}
                    </p>
                  )}
                  <p>
                    <strong>יוצר המשימה: </strong>
                    {taskCreatorFullName}
                  </p>
                </div>
                {(user.adminAccess.includes("editTask") || user.privileges == 2) && (
                  <IconButton
                    className="task-page-edit-icon"
                    aria-label="edit"
                    onClick={handleEditClick}>
                    <EditIcon />
                  </IconButton>
                )}
              </div>
            </div>
            <div className="task-page-participants">
              <h2>משתתפים</h2>
              {assignees.map((assignee, index) => (
                <div key={index} className="assignee-task-page-item">
                  <Link className="profile-link" to={`/profile/${assignee.email}`}>
                    <Avatar {...stringAvatar(assignee.fullName)} />
                  </Link>
                  <Link to={`/profile/${assignee.email}`}>
                    <p>{assignee.fullName}</p>
                  </Link>
                </div>
              ))}
            </div>

            {isEditing && task && (
              <div className="popup-overlay">
                <div ref={editTaskRef} className="popup-content">
                  <EditTask task={task} onClose={handleCloseEdit} onTaskUpdated={handleSaveEdit} />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="task-page-left-side">
          <div className="task-page-navbar">
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
          <div className="task-page-content">
            <PageContent pageName={page} />
          </div>
        </div>
      </div>
      <div className="footer"></div>
    </div>
  );
}

export default TaskPage;
