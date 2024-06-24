import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, getDoc, doc } from "firebase/firestore";
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

function stringToColor(string) {
  let hash = 0;
  let i;

  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = "#";

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }

  return color;
}

function stringAvatar(name) {
  return {
    sx: {
      bgcolor: stringToColor(name),
    },
    children: `${name.split(" ")[0][0]}${name.split(" ")[1][0]}`,
  };
}

function ManageTasks() {
  const [rows, setRows] = useState([]);
  const [showCreateTask, setShowCreateTask] = useState(false);

  const theme = createTheme(
    {
      direction: "rtl",
      typography: {
        fontSize: 24,
      },
    },
    heIL
  );

  const user = JSON.parse(sessionStorage.getItem("user"));

  const baseColumns = [
    { field: "id", headerName: "אינדקס", width: "3%", align: "right", flex: 1 },
    { field: "taskName", headerName: "שם המשימה", width: 150, align: "right", flex: 2.5 },
    { field: "taskDescription", headerName: "תיאור", width: 150, align: "right", flex: 3 },
    { field: "relatedEvent", headerName: "שייך לאירוע", width: 150, align: "right", flex: 2 },
    { field: "taskStartDate", headerName: "תאריך התחלה", width: 150, align: "right", flex: 1.5 },
    { field: "taskEndDate", headerName: "תאריך סיום", width: 150, align: "right", flex: 1.5 },
    { field: "taskTime", headerName: "שעת סיום", width: 150, align: "right", flex: 1 },
    { field: "taskStatus", headerName: "סטטוס", width: 150, align: "right", flex: 1 },
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
              <Avatar key={index} {...stringAvatar(user.fullName)} />
            ))}
          </AvatarGroup>
        );
      },
    },
  ];

  const editColumn = {
    field: "edit",
    headerName: "עריכה",
    width: 150,
    align: "right",
    flex: 1.5,
    renderCell: () => (
      <div>
        <IconButton aria-label="edit">
          <EditIcon />
        </IconButton>
        <IconButton aria-label="delete">
          <DeleteForeverIcon />
        </IconButton>
      </div>
    ),
  };

  const columns = user.privileges > 1 ? [...baseColumns, editColumn] : baseColumns;

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
    if (!relatedEvent) return "";
    let relatedEventTitle = relatedEvent.split("/")[1];
    try {
      const querySnapshot = await getDoc(doc(db, "events", relatedEventTitle));
      if (querySnapshot.exists()) {
        return querySnapshot.data().eventName;
      } else {
        return " ";
      }
    } catch (e) {
      console.error("Error getting documents: ", e);
    }
  }

  async function getTasks() {
    try {
      const querySnapshot = await getDocs(collection(db, "tasks"));
      const taskArray = querySnapshot.docs.map((doc, index) => ({
        ...doc.data(),
        id: index + 1,
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
            taskName: task.taskName,
            taskDescription: task.taskDescription,
            relatedEvent,
            taskStartDate: task.taskStartDate,
            taskEndDate: task.taskEndDate,
            taskTime: task.taskTime,
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

  useEffect(() => {
    getTasks();
  }, []);

  const handleShowCreateTask = () => {
    setShowCreateTask(true);
  };

  return (
    <div>
      <div className="manage-tasks-styles">
        <h1>משימות</h1>
        <div className="display-create">
          {user.privileges > 1 && showCreateTask && (
            <div>
              <div
                className="action-close"
                onClick={() => {
                  setShowCreateTask(false);
                }}>
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
              <CreateTask />
            </div>
          )}
        </div>
        {user.privileges > 1 && (
          <div
            className="action-button add-task-button add-task-manage-tasks"
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
            />
          </ThemeProvider>
        </div>
      </div>
      <div className="footer"></div>
    </div>
  );
}

export default ManageTasks;
