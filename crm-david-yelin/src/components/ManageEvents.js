import React, { useState, useEffect } from "react";
import { db, updateUserData } from "../firebase";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { DataGrid } from "@mui/x-data-grid";
import { heIL } from "@mui/material/locale";
import Navbar from "./Navbar";
import "../styles/Styles.css";
import "../styles/ManageEvents.css";
import EditIcon from "@mui/icons-material/Edit";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import Stack from "@mui/material/Stack";
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
      renderCell: () => (
        <AvatarGroup className="manage-events-avatar-group" max={3}>
          <Avatar {...stringAvatar("Kent Dodds")} src={require("../assets/profile.jpg")} />
          <Avatar {...stringAvatar("Travis Howard")} src="/static/images/avatar/2.jpg" />
          <Avatar {...stringAvatar("Cindy Baker")} src="/static/images/avatar/3.jpg" />
          <Avatar {...stringAvatar("Agnes Walker")} src="/static/images/avatar/4.jpg" />
          <Avatar {...stringAvatar("Trevor Henderson")} src="/static/images/avatar/5.jpg" />
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

  async function getEvents() {
    try {
      const querySnapshot = await getDocs(collection(db, "events"));
      const eventsArray = querySnapshot.docs.map((doc, index) => ({
        ...doc.data(),
        id: index + 1,
      }));
      const rowsEventsData = eventsArray.map((event, index) => ({
        id: index + 1,
        eventName: event.eventName,
        eventLocation: event.eventLocation,
        eventStartDate: event.eventStartDate,
        eventEndDate: event.eventEndDate,
        eventTime: event.eventTime,
        eventStatus: event.eventStatus,
        assignTo: event.assignTo || [],
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
      <Navbar />
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

export default ManageEvents;

