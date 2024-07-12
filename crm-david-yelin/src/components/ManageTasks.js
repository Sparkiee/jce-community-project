import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { db } from "../firebase";
import { collection, getDocs, getDoc, doc, deleteDoc, query, orderBy } from "firebase/firestore";
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
      bgcolor: stringToColor(name)
    },
    children: initials
  };
}

function ManageTasks() {
  const [rows, setRows] = useState([]);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState("");
  const [allRows, setAllRows] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [user, setUser] = useState(null);

  const createTaskRef = useRef(null);
  const editTaskRef = useRef(null);
  const navigate = useNavigate();

  const theme = createTheme(
    {
      direction: "rtl",
      typography: {
        fontSize: 24
      }
    },
    heIL
  );

  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem("user"));
    if (userData)
      setUser(userData);
    else {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (userData)
        setUser(userData);
    }
  }, []);

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

  const baseColumns = [
    { field: "id", headerName: "אינדקס", align: "right", flex: 1 },
    {
      field: "taskName",
      headerName: "שם המשימה",
      align: "right",
      flex: 2.5
    },
    {
      field: "taskDescription",
      headerName: "תיאור",
      align: "right",
      flex: 3
    },
    {
      field: "relatedEvent",
      headerName: "שייך לאירוע",
      align: "right",
      flex: 2
    },
    ...(user && user.privileges >= 2
      ? [
          {
            field: "taskBudget",
            headerName: "תקציב",
            align: "right",
            flex: 1,
            renderCell: (params) => {
              return (
                <div title={params.row.taskBudget ? `₪${params.row.taskBudget.toLocaleString()}` : "אין"}>
                  {params.row.taskBudget ? `₪${params.row.taskBudget.toLocaleString()}` : "אין"}
                </div>
              );
            }
          }
        ]
      : []),
    {
      field: "taskStartDate",
      headerName: "תאריך התחלה",
      align: "right",
      flex: 1.5,
      renderCell: (params) => {
        const date = new Date(params.row.taskStartDate);
        const formattedDate = date.toLocaleDateString("he-IL").replaceAll("/", "-");
        return <div>{formattedDate}</div>;
      }
    },
    {
      field: "taskEndDate",
      headerName: "תאריך יעד",
      align: "right",
      flex: 1.5,
      renderCell: (params) => {
        const date = new Date(params.row.taskEndDate);
        const formattedDate = date.toLocaleDateString("he-IL").replaceAll("/", "-");
        return <div>{formattedDate}</div>;
      }
    },
    {
      field: "taskTime",
      headerName: "שעת סיום",
      align: "right",
      flex: 1
    },
    {
      field: "taskStatus",
      headerName: "סטטוס",
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
      }
    },
    {
      field: "assignTo",
      headerName: "משוייכים",
      align: "right",
      flex: 2,
      renderCell: (params) => {
        return (
          <AvatarGroup className="manage-task-avatar-group avatar-position" max={3}>
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
      }
    },
    {
      field: "view",
      headerName: "צפייה",
      align: "center",
      flex: 0.8,
      renderCell: (params) => (
        <IconButton aria-label="view" onClick={() => navigate(`/task/${params.row.taskDoc}`)}>
          <VisibilityIcon />
        </IconButton>
      )
    }
  ];

  const columns = [
    ...baseColumns,
    ...(user && (user.privileges >= 2 || user.adminAccess.includes("deleteTask") || user.adminAccess.includes("editTask"))
      ? [
          {
            field: "edit",
            headerName: "עריכה",
            align: "right",
            flex: 1.5,
            renderCell: (params) => (
              <div>
                {(user.privileges >= 2 || user.adminAccess.includes("editTask")) && (
                  <IconButton aria-label="edit" onClick={() => handleEditClick(params.row)}>
                    <EditIcon />
                  </IconButton>
                )}
                {(user.privileges >= 2 || user.adminAccess.includes("deleteTask")) && (
                  <IconButton aria-label="delete" onClick={() => setDeleteTarget(params.row)}>
                    <DeleteForeverIcon />
                  </IconButton>
                )}
              </div>
            )
          }
        ]
      : [])
  ];

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
      const taskRef = collection(db, "tasks");
      const q = query(taskRef, orderBy("taskEndDate", "desc"), orderBy("taskTime", "desc"), orderBy("taskName", "desc"));
      const querySnapshot = await getDocs(q);
      const taskArray = querySnapshot.docs.map((doc, index) => ({
        ...doc.data(),
        id: index + 1,
        taskDoc: doc.id // Ensure taskDoc is set correctly
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
            assignTo: assigneeData
          };
        })
      );
      setAllRows(rowsTasksData);
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
        const assigneeData = assigneeDocs.map((doc) => (doc.exists() ? doc.data() : [])).filter((data) => data);
        setEditingTask({
          ...taskData,
          taskDoc: row.taskDoc,
          assignTo: assigneeData.map((assignee) => ({
            value: assignee.email,
            label: assignee.fullName
          }))
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

  const handleSearchChange = (event) => {
    const value = event.target.value.toLowerCase();
    setSearchValue(value);

    const filteredRows = allRows.filter((row) => row.taskName.toLowerCase().includes(value));
    setRows(filteredRows);
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
            <EditTask task={editingTask} onClose={() => setEditingTask(null)} onTaskUpdated={getTasks} />
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
                <CreateTask
                  onClose={() => {
                    handleCloseForms();
                    getTasks();
                  }}
                />
              </div>
            </div>
          )}
        </div>
        {(user && (user.adminAccess.includes("createTask") || user.privileges >= 2)) && (
          <div className="action-button add-tasks-button add-tasks-manage-tasks" onClick={handleShowCreateTask}>
            <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
        <div className="search-task-bar">
          <svg viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#000000">
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
            <g id="SVGRepo_iconCarrier">
              <title>search</title>
              <desc>Created with Sketch Beta.</desc>
              <defs></defs>
              <g id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                <g id="Icon-Set" transform="translate(-256.000000, -1139.000000)" fill="#000000">
                  <path
                    d="M269.46,1163.45 C263.17,1163.45 258.071,1158.44 258.071,1152.25 C258.071,1146.06 263.17,1141.04 269.46,1141.04 C275.75,1141.04 280.85,1146.06 280.85,1152.25 C280.85,1158.44 275.75,1163.45 269.46,1163.45 L269.46,1163.45 Z M287.688,1169.25 L279.429,1161.12 C281.591,1158.77 282.92,1155.67 282.92,1152.25 C282.92,1144.93 276.894,1139 269.46,1139 C262.026,1139 256,1144.93 256,1152.25 C256,1159.56 262.026,1165.49 269.46,1165.49 C272.672,1165.49 275.618,1164.38 277.932,1162.53 L286.224,1170.69 C286.629,1171.09 287.284,1171.09 287.688,1170.69 C288.093,1170.3 288.093,1169.65 287.688,1169.25 L287.688,1169.25 Z"
                    id="search"></path>
                </g>
              </g>
            </g>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="חיפוש משימות"
            value={searchValue}
            onChange={handleSearchChange}
          />
        </div>
        <div style={{ height: 995, width: "90%" }}>
          <ThemeProvider theme={theme}>
            <DataGrid
              rows={rows}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 17 }
                }
              }}
              pageSizeOptions={[17, 25, 50]}
              localeText={{
                MuiTablePagination: {
                  labelDisplayedRows: ({ from, to, count }) =>
                    `${from}-${to} מתוך ${count !== -1 ? count : `יותר מ ${to}`}`,
                  labelRowsPerPage: "שורות בכל עמוד:"
                }
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
