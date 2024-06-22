import React, { useState, useEffect } from "react";
import { db, updateUserData } from "../firebase";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { DataGrid } from "@mui/x-data-grid";
import { heIL } from "@mui/material/locale";
import Navbar from "./Navbar";
import "../styles/Styles.css";
import "../styles/ManageTasks.css";
import EditIcon from "@mui/icons-material/Edit";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import CreateTask from "./CreateTask";
import Stack from "@mui/material/Stack";

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
    { field: "taskName", headerName: "שם המשימה", width: 150, align: "right", flex: 3 },
    { field: "taskDescription", headerName: "תיאור", width: 150, align: "right", flex: 4 },
    { field: "taskStartDate", headerName: "תאריך התחלה", width: 150, align: "right", flex: 1.5 },
    { field: "taskEndDate", headerName: "תאריך סיום", width: 150, align: "right", flex: 1.5 },
    { field: "taskTime", headerName: "שעת סיום", width: 150, align: "right", flex: 1 },
    { field: "taskStatus", headerName: "סטטוס", width: 150, align: "right", flex: 1.5 },
    {
      field: "assignTo",
      headerName: "משוייכים",
      width: 150,
      align: "right",
      flex: 2,
      renderCell: () => (
        <AvatarGroup className="manage-task-avatar-group" max={3}>
          <Avatar {...stringAvatar("Kent Dodds")} />
          <Avatar {...stringAvatar("פנחס מתיאס דגדגד")} />
          <Avatar {...stringAvatar("Cindy Baker")} />
          <Avatar {...stringAvatar("Agnes Walker")} />
          <Avatar {...stringAvatar("Trevor Henderson")} />
        </AvatarGroup>
      ),
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

  async function getTasks() {
    try {
      const querySnapshot = await getDocs(collection(db, "tasks"));
      const taskArray = querySnapshot.docs.map((doc, index) => ({
        ...doc.data(),
        id: index + 1,
      }));
      const rowsTasksData = taskArray.map((task, index) => ({
        id: index + 1,
        taskName: task.taskName,
        taskDescription: task.taskDescription,
        taskStartDate: task.taskStartDate,
        taskEndDate: task.taskEndDate,
        taskTime: task.taskTime,
        taskStatus: task.taskStatus,
        assignTo: task.assignTo || [],
      }));
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
      <Navbar />
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
        <div style={{ height: 1000, width: "90%" }}>
          <ThemeProvider theme={theme}>
            <DataGrid
              rows={rows}
              columns={columns}
              pageSize={5}
              rowsPerPageOptions={[5]}
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
    </div>
  );
}

export default ManageTasks;
