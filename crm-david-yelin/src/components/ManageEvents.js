import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDoc, doc, getDocs } from "firebase/firestore";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { DataGrid } from "@mui/x-data-grid";
import { heIL } from "@mui/material/locale";
import "../styles/Styles.css";
import "../styles/ManageEvents.css";
import EditIcon from "@mui/icons-material/Edit";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import CreateEvent from "./CreateEvent";

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

function ManageEvents() {
  const [rows, setRows] = useState([]);
  const [showCreateEvent, setShowCreateEvent] = useState(false);

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
    { field: "eventName", headerName: "שם האירוע", width: 150, align: "right", flex: 3 },
    { field: "eventLocation", headerName: "מיקום", width: 150, align: "right", flex: 4 },
    { field: "eventStartDate", headerName: "תאריך התחלה", width: 150, align: "right", flex: 1.5 },
    { field: "eventEndDate", headerName: "תאריך סיום", width: 150, align: "right", flex: 1.5 },
    { field: "eventTime", headerName: "שעת סיום", width: 150, align: "right", flex: 1 },
    { field: "eventStatus", headerName: "סטטוס", width: 150, align: "right", flex: 1.5 },
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

  async function getEvents() {
    try {
      const querySnapshot = await getDocs(collection(db, "events"));
      const eventsArray = querySnapshot.docs.map((doc, index) => ({
        ...doc.data(),
        id: index + 1,
      }));
      const rowsEventsData = await Promise.all(
        eventsArray.map(async (event, index) => {
          const assignees = Array.isArray(event.assignees) ? event.assignees : [];
          const assigneeData = await Promise.all(
            assignees.map(async (assignee) => {
              const email = assignee.split("/")[1];
              const fullName = await getMemberFullName(email);
              return { email, fullName };
            })
        );
      return {
        id: index + 1,
        eventName: event.eventName,
        eventLocation: event.eventLocation,
        eventStartDate: event.eventStartDate,
        eventEndDate: event.eventEndDate,
        eventTime: event.eventTime,
        eventStatus: event.eventStatus,
        assignTo: assigneeData || [],
      };
    }));
      setRows(rowsEventsData);
    } catch (e) {
      console.error("Error getting documents: ", e);
    }
  }

  useEffect(() => {
    getEvents();
  }, []);

  const handleShowCreateEvents = () => {
    setShowCreateEvent(true);
  };

  return (
    <div>
      <div className="manage-events-styles">
        <h1>אירועים</h1>
        <div className="display-create">
          {user.privileges > 1 && showCreateEvent && (
            <div>
              <div
                className="action-close"
                onClick={() => {
                  setShowCreateEvent(false);
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
              <CreateEvent />
            </div>
          )}
        </div>
        {user.privileges > 1 && (
          <div
            className="action-button add-events-button add-events-manage-events"
            onClick={handleShowCreateEvents}>
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
            הוסף אירוע
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

export default ManageEvents;
