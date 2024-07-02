import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDoc, doc, getDocs, deleteDoc } from "firebase/firestore";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { DataGrid } from "@mui/x-data-grid";
import { heIL } from "@mui/material/locale";
import "../styles/Styles.css";
import "../styles/ManageEvents.css";
import EditIcon from "@mui/icons-material/Edit";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import VisibilityIcon from "@mui/icons-material/Visibility";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import CreateEvent from "./CreateEvent";
import ConfirmAction from "./ConfirmAction";
import EditEvent from "./EditEvent";

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

function ManageEvents() {
  const [rows, setRows] = useState([]);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState("");
  const [editEventDetails, setEditEventDetails] = useState(null);
  const [allRows, setAllRows] = useState([]);
  const [searchValue, setSearchValue] = useState("");

  const createEventRef = useRef(null);
  const editEventRef = useRef(null);

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
    { field: "id", headerName: "אינדקס", width: "3%", align: "right", flex: 1 },
    {
      field: "eventName",
      headerName: "שם האירוע",
      width: 150,
      align: "right",
      flex: 3,
    },
    {
      field: "eventLocation",
      headerName: "מיקום",
      width: 150,
      align: "right",
      flex: 4,
    },
    ...(user.privileges >= 2
      ? [
          {
            field: "eventBudget",
            headerName: "תקציב",
            width: 150,
            align: "right",
            flex: 1,
            renderCell: (params) => {
              return (
                <div
                  title={
                    params.row.eventBudget ? `₪${params.row.eventBudget.toLocaleString()}` : "אין"
                  }>
                  {params.row.eventBudget ? `₪${params.row.eventBudget.toLocaleString()}` : "אין"}
                </div>
              );
            },
          },
        ]
      : []),
    {
      field: "eventStartDate",
      headerName: "תאריך התחלה",
      width: 150,
      align: "right",
      flex: 1.5,
      renderCell: (params) => {
        const date = new Date(params.row.eventStartDate);
        const formattedDate = date.toLocaleDateString("he-IL").replaceAll("/", "-");
        return <div>{formattedDate}</div>;
      },
    },
    {
      field: "eventEndDate",
      headerName: "תאריך יעד",
      width: 150,
      align: "right",
      flex: 1.5,
      renderCell: (params) => {
        const date = new Date(params.row.eventEndDate);
        const formattedDate = date.toLocaleDateString("he-IL").replaceAll("/", "-");
        return <div>{formattedDate}</div>;
      },
    },
    {
      field: "eventTime",
      headerName: "שעת סיום",
      width: 150,
      align: "right",
      flex: 1,
    },
    {
      field: "eventStatus",
      headerName: "סטטוס",
      width: 150,
      align: "right",
      flex: 1.5,
      renderCell: (params) => {
        const colorClass = getStatusColorClass(params.row.eventStatus);
        return (
          <div className="status-cell">
            <span className={`status-circle ${colorClass}`}></span>
            {params.row.eventStatus}
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
        const assignees = Array.isArray(params.value) ? params.value : [];
        return (
          <AvatarGroup className="manage-task-avatar-group avatar-position" max={3}>
            {assignees.map((user, index) => (
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
        <IconButton aria-label="view" onClick={() => navigate(`/event/${params.row.eventDoc}`)}>
          <VisibilityIcon />
        </IconButton>
      ),
    },
  ];

  const columns = [
    ...baseColumns,
    ...(user.privileges >= 2 ||
    user.adminAccess.includes("deleteEvent") ||
    user.adminAccess.includes("editEvent")
      ? [
          {
            field: "edit",
            headerName: "עריכה",
            width: 150,
            align: "right",
            flex: 1.5,
            renderCell: (params) => (
              <div>
                {(user.privileges >= 2 || user.adminAccess.includes("editEvent")) && (
                  <IconButton aria-label="edit" onClick={() => handleEditClick(params.row)}>
                    <EditIcon />
                  </IconButton>
                )}
                {(user.privileges >= 2 || user.adminAccess.includes("deleteEvent")) && (
                  <IconButton aria-label="delete" onClick={() => setDeleteTarget(params.row)}>
                    <DeleteForeverIcon />
                  </IconButton>
                )}
              </div>
            ),
          },
        ]
      : []),
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

  async function getEvents() {
    try {
      const querySnapshot = await getDocs(collection(db, "events"));
      const eventsArray = querySnapshot.docs.map((doc, index) => ({
        ...doc.data(),
        id: index + 1,
        eventDoc: doc.id,
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
            eventDoc: event.eventDoc,
            eventName: event.eventName,
            eventLocation: event.eventLocation,
            eventStartDate: event.eventStartDate,
            eventEndDate: event.eventEndDate,
            eventBudget: event.eventBudget,
            eventTime: event.eventTime,
            eventStatus: event.eventStatus,
            assignees: event.assignees,
            eventCreator: event.eventCreator,
            assignTo: assigneeData || [],
          };
        })
      );
      setAllRows(rowsEventsData);
      setRows(rowsEventsData);
    } catch (e) {
      console.error("Error getting documents: ", e);
    }
  }

  useEffect(() => {
    getEvents();

    const handleClickOutside = (event) => {
      if (createEventRef.current && !createEventRef.current.contains(event.target)) {
        setShowCreateEvent(false);
      }
      if (editEventRef.current && !editEventRef.current.contains(event.target)) {
        setEditEventDetails(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleShowCreateEvents = () => {
    setShowCreateEvent(true);
  };

  const handleCloseForms = () => {
    setShowCreateEvent(false);
  };

  async function handleDeleteEvent() {
    try {
      const docRef = doc(db, "events", deleteTarget.eventDoc);
      await deleteDoc(docRef);
      setDeleteTarget("");
      getEvents();
    } catch (e) {
      console.error("Error deleting document: ", e);
    }
  }

  const handleRowDoubleClick = (params) => {
    navigate(`/event/${params.row.eventDoc}`);
  };

  const handleEditClick = async (row) => {
    try {
      const eventDoc = await getDoc(doc(db, "events", row.eventDoc));
      if (eventDoc.exists()) {
        const eventData = eventDoc.data();
        const assignees = await Promise.all(
          eventData.assignees.map(async (assigneePath) => {
            const email = assigneePath.split("/")[1];
            const fullName = await getMemberFullName(email);
            return { email, fullName };
          })
        );
        setEditEventDetails({ ...eventData, id: eventDoc.id, assigneesData: assignees });
      } else {
        console.error("No such document!");
      }
    } catch (e) {
      console.error("Error fetching event: ", e);
    }
  };

  const handleSearchChange = (event) => {
    const value = event.target.value.toLowerCase();
    setSearchValue(value);

    const filteredRows = allRows.filter((row) => row.eventName.toLowerCase().includes(value));
    setRows(filteredRows);
  };

  return (
    <div>
      {editEventDetails && (
        <div className="popup-overlay">
          <div ref={editEventRef} className="popup-content">
            <EditEvent
              eventDetails={editEventDetails}
              onClose={() => {
                setEditEventDetails(false);
                getEvents();
              }}
            />
          </div>
        </div>
      )}
      {deleteTarget && (
        <div className="popup-overlay">
          <ConfirmAction
            onConfirm={() => handleDeleteEvent()}
            onCancel={() => setDeleteTarget("")}
          />
        </div>
      )}
      <div className="manage-events-styles">
        <h1>אירועים</h1>
        <div ref={createEventRef} className="display-create">
          {showCreateEvent && (
            <div className="popup-overlay">
              <div ref={createEventRef} className="popup-content">
                <CreateEvent onClose={()=> {
                  handleCloseForms();
                  getEvents();
                }} />
              </div>
            </div>
          )}
        </div>
        {(user.adminAccess.includes("createEvent") || user.privileges == 2) && (
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
        <div className="search-events-bar">
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
            placeholder="חיפוש אירועים"
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
              onRowDoubleClick={handleRowDoubleClick}
            />
          </ThemeProvider>
        </div>
      </div>
      <div className="footer"></div>
    </div>
  );
}

export default ManageEvents;
