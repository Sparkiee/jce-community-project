import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { db } from "../firebase";
import { collection, getDocs, getDoc, doc, deleteDoc } from "firebase/firestore";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { DataGrid } from "@mui/x-data-grid";
import { heIL } from "@mui/material/locale";
import "../styles/Styles.css";
import "../styles/ManageTasks.css";
import EditIcon from "@mui/icons-material/Edit";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import CreateTask from "./CreateTask";
import ConfirmAction from "./ConfirmAction";
import EditTask from "./EditTask";

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
  if (!name) {
    return { sx: { bgcolor: "#000000" }, children: "?" }; // Default values if name is undefined or null
  }
  const nameParts = name.split(" ");
  const initials = nameParts.length >= 2 ? `${nameParts[0][0]}${nameParts[1][0]}` : name[0];
  return {
    sx: {
      bgcolor: stringToColor(name),
    },
    children: initials,
  };
}

function ManageTasks() {
  const [rows, setRows] = useState([]);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState("");
  const [userPrivileges, setUserPrivileges] = useState(1);

  const createTaskRef = useRef(null);
  const editTaskRef = useRef(null);
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

  const user = JSON.parse(sessionStorage.getItem("user"));

  const baseColumns = [
    { field: "id", headerName: "אינדקס", align: "right", flex: 1 },
    {
      field: "taskName",
      headerName: "שם המשימה",
      width: 150,
      align: "right",
      flex: 2.5,
    },
    {
      field: "taskDescription",
      headerName: "תיאור",
      width: 150,
      align: "right",
      flex: 3,
    },
    {
      field: "relatedEvent",
      headerName: "שייך לאירוע",
      width: 150,
      align: "right",
      flex: 2,
    },
    ...(userPrivileges == 2
      ? [
          {
            field: "taskBudget",
            headerName: "תקציב",
            width: 150,
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
      width: 150,
      align: "right",
      flex: 1.5,
      renderCell: (params) => {
        const date = new Date(params.row.taskStartDate);
        const formattedDate = date.toLocaleDateString("he-IL").replaceAll("/", "-");
        return <div>{formattedDate}</div>;
      },
    },
    {
      field: "taskEndDate",
      headerName: "תאריך יעד",
      width: 150,
      align: "right",
      flex: 1.5,
      renderCell: (params) => {
        const date = new Date(params.row.taskEndDate);
        const formattedDate = date.toLocaleDateString("he-IL").replaceAll("/", "-");
        return <div>{formattedDate}</div>;
      },
    },
    {
      field: "taskTime",
      headerName: "שעת סיום",
      width: 150,
      align: "right",
      flex: 1,
    },
    {
      field: "taskStatus",
      headerName: "סטטוס",
      width: 150,
      align: "right",
      flex: 1.5,
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
      field: "assignTo",
      headerName: "משוייכים",
      width: 150,
      align: "right",
      flex: 2,
      renderCell: (params) => {
        return (
          <AvatarGroup className="manage-task-avatar-group" max={3}>
            {params.value.map((user, index) => (
              <Avatar
                key={index}
                {...stringAvatar(user.fullName)}
                title={user.fullName}
                onClick={() => navigate(`/profile/${user.email}`)}
              />
            ))}
          </AvatarGroup>
        );
      },
    },
    {
      field: "view",
      headerName: "צפייה",
      width: 80,
      align: "center",
      flex: 0.5,
      renderCell: (params) => (
        <IconButton aria-label="view" onClick={() => navigate(`/task/${params.row.taskDoc}`)}>
          <VisibilityIcon />
        </IconButton>
      ),
    },
  ];

  const columns = [
    ...baseColumns,
    ...(userPrivileges === 2 || user.adminAccess.includes("deleteTask") || user.adminAccess.includes("editTask")) ? [
      {
        field: "edit",
        headerName: "עריכה",
        width: 150,
        align: "right",
        flex: 1.5,
        renderCell: (params) => (
          <div>
            {(userPrivileges === 2 || user.adminAccess.includes("editTask")) && <IconButton aria-label="edit" onClick={() => handleEditClick(params.row)}>
              <EditIcon />
            </IconButton>}
            {(userPrivileges === 2 || user.adminAccess.includes("deleteTask")) && <IconButton aria-label="delete" onClick={() => setDeleteTarget(params.row)}>
              <DeleteForeverIcon />
            </IconButton>}
          </div>
        ),
      }
    ] : []
  ];

  // const columns = user.privileges > 1 ? [...baseColumns, editColumn] : baseColumns;

  async function getMemberFullName(email) {
    try {
      const memberDoc = await getDoc(doc(collection(db, "members"), email));
      if (memberDoc.exists()) {
        return memberDoc.data().fullName;
      }
    } catch (e) {
      console.error("Error getting member document: ", e);
    }
  }

  async function getRelatedEvent(relatedEvent) {
    if (!relatedEvent || relatedEvent.indexOf("/") === -1) return "";
    let relatedEventTitle = relatedEvent.split("/")[1];
    try {
      const eventDoc = await getDoc(doc(db, "events", relatedEventTitle));
      if (eventDoc.exists()) {
        return eventDoc.data().eventName;
      } else {
        return " ";
      }
    } catch (e) {
      console.error("Error getting documents: ", e);
      return " ";
    }
  }

  async function getTasks() {
    try {
      const querySnapshot = await getDocs(collection(db, "tasks"));
      const taskArray = querySnapshot.docs.map((doc, index) => ({
        ...doc.data(),
        id: index + 1,
        taskDoc: doc.id, // Ensure taskDoc is set correctly
      }));
      const rowsTasksData = await Promise.all(
        taskArray.map(async (task, index) => {
          const relatedEvent = await getRelatedEvent(task.relatedEvent);
          const assignees = Array.isArray(task.assignees) ? task.assignees : [];
          const assigneeData = await Promise.all(
            assignees.map(async (assigneePath) => {
              const email = assigneePath.split("/")[1];
              const fullName = await getMemberFullName(email);
              return { email, fullName };
            })
          );
          return {
            id: index + 1,
            taskDoc: task.taskDoc,
            taskName: task.taskName,
            taskDescription: task.taskDescription,
            relatedEvent,
            taskStartDate: task.taskStartDate,
            taskEndDate: task.taskEndDate,
            taskTime: task.taskTime,
            taskBudget: task.taskBudget,
            taskStatus: task.taskStatus,
            assignTo: assigneeData,
          };
        })
      );

      setRows(rowsTasksData);
    } catch (e) {
      console.error("Error getting documents: ", e);
    }
  }

  const handleEditClick = async (row) => {
    try {
      const taskDoc = await getDoc(doc(db, "tasks", row.taskDoc));
      if (taskDoc.exists()) {
        const taskData = taskDoc.data();
        const assigneeEmails = (taskData.assignees || []).map((email) => email.split("/")[1]); // Ensure taskData.assignees is an array
        const assigneePromises = assigneeEmails.map((email) => getDoc(doc(db, "members", email)));
        const assigneeDocs = await Promise.all(assigneePromises);
        const assigneeData = assigneeDocs
          .map((doc) => (doc.exists() ? doc.data() : []))
          .filter((data) => data);
        setEditingTask({
          ...taskData,
          taskDoc: row.taskDoc,
          assignTo: assigneeData.map((assignee) => ({
            value: assignee.email,
            label: assignee.fullName,
          })),
        });
      } else {
        console.error("No such document!");
      }
    } catch (error) {
      console.error("Error handling edit click: ", error);
    }
  };

  useEffect(() => {
    getTasks();

    const handleClickOutside = (event) => {
      if (createTaskRef.current && !createTaskRef.current.contains(event.target)) {
        setShowCreateTask(false);
      }
      if (editTaskRef.current && !editTaskRef.current.contains(event.target)) {
        setEditingTask(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleShowCreateTask = () => {
    setShowCreateTask(true);
  };

  const handleCloseForms = () => {
    setShowCreateTask(false);
  };

  async function handleDeleteTask() {
    try {
      const docRef = doc(db, "tasks", deleteTarget.taskDoc);
      await deleteDoc(docRef);
      setDeleteTarget("");
      getTasks();
    } catch (e) {
      console.error("Error deleting document: ", e);
    }
  }

  return (
    <div>
      {editingTask && (
        <div className="popup-overlay">
          <div ref={editTaskRef} className="popup-content">
            <EditTask
              task={editingTask}
              onClose={() => setEditingTask(null)}
              onTaskUpdated={getTasks}
            />
          </div>
        </div>
      )}
      {deleteTarget && (
        <div className="popup-overlay">
          <ConfirmAction onConfirm={handleDeleteTask} onCancel={() => setDeleteTarget("")} />
        </div>
      )}
      <div className="manage-tasks-styles">
        <h1>משימות</h1>
        <div ref={createTaskRef} className="display-create">
          {showCreateTask && (
            <div className="popup-overlay">
              <div ref={createTaskRef} className="popup-content">
                <CreateTask onClose={handleCloseForms} />
              </div>
            </div>
          )}
        </div>
        {(user.adminAccess.includes("createTask") || user.privileges == 2) && (
          <div
            className="action-button add-tasks-button add-tasks-manage-tasks"
            onClick={handleShowCreateTask}>
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
        <div style={{ height: 995, width: "90%" }}>
          <ThemeProvider theme={theme}>
            <DataGrid
              rows={rows}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 17 },
                },
              }}
              pageSizeOptions={[17, 25, 50]}
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
      </div>
      <div className="footer"></div>
    </div>
  );
}

export default ManageTasks;
