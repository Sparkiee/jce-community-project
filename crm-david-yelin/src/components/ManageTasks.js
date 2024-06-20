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

function ManageTasks() {
  const [rows, setRows] = useState([]);

  const theme = createTheme(
    {
      direction: "rtl",
      typography: {
        fontSize: 24,
      },
    },
    heIL
  );

  const columns = [
    {
      field: "id",
      headerName: "אינדקס",
      width: "3%",
      align: "right",
      colors: "red",
      flex: 1,
    },
    {
      field: "taskName",
      headerName: "שם המשימה",
      width: 150,
      align: "right",
      flex: 3,
    },
    {
      field: "taskDescription",
      headerName: "תיאור",
      width: 150,
      align: "right",
      flex: 4,
    },
    {
      field: "taskStartDate",
      headerName: "תאריך התחלה",
      width: 150,
      align: "right",
      flex: 1.5,
    },
    {
      field: "taskEndDate",
      headerName: "תאריך סיום",
      width: 150,
      align: "right",
      flex: 1.5,
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
    },
    {
      field: "assignTo",
      headerName: "משוייכים",
      width: 150,
      align: "right",
      flex: 1.5,
      renderCell: (params) => (
        <AvatarGroup max={3}>
          {params.value.map((assignee, index) => (
            <Avatar key={index} alt={assignee.name} src={assignee.avatar} />
          ))}
        </AvatarGroup>
      ),
    },
    {
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
    },
  ];

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

  return (
    <div>
      <Navbar />
      <div className="manage-tasks-styles">
        <h1>משימות</h1>
        <div style={{ height: 1000, width: "90%" }}>
          <ThemeProvider theme={theme}>
            <DataGrid
              rows={rows}
              columns={columns}
              pageSize={5}
              rowsPerPageOptions={[5]}
              checkboxSelection
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
