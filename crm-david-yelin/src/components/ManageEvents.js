import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  getDoc,
  doc,
  getDocs,
  deleteDoc
} from "firebase/firestore";
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
import { Alert, Modal } from "@mui/material";
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
  const initials =
    nameParts.length >= 2 ? `${nameParts[0][0]}${nameParts[1][0]}` : name[0];
  return {
    sx: {
      bgcolor: stringToColor(name)
    },
    children: initials
  };
}

function ManageEvents() {
  const [rows, setRows] = useState([]);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState("");
  const [alert, setAlert] = useState(false);
  const [editEventDetails, setEditEventDetails] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const createEventRef = useRef(null);
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

  const user = JSON.parse(sessionStorage.getItem("user"));

  const baseColumns = [
    { field: "id", headerName: "אינדקס", width: "3%", align: "right", flex: 1 },
    {
      field: "eventName",
      headerName: "שם האירוע",
      width: 150,
      align: "right",
      flex: 3
    },
    {
      field: "eventLocation",
      headerName: "מיקום",
      width: 150,
      align: "right",
      flex: 4
    },
    {
      field: "eventStartDate",
      headerName: "תאריך התחלה",
      width: 150,
      align: "right",
      flex: 1.5,
      renderCell: (params) => {
        const date = new Date(params.row.eventStartDate);
        const formattedDate = date.toLocaleDateString("he-IL").replaceAll("/", "-");
        return (
          <div>
            {formattedDate}
          </div>
        );
      }
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
        return (
          <div>
            {formattedDate}
          </div>
        );
      }
    },
    {
      field: "eventTime",
      headerName: "שעת סיום",
      width: 150,
      align: "right",
      flex: 1
    },
    {
      field: "eventStatus",
      headerName: "סטטוס",
      width: 150,
      align: "right",
      flex: 1.5
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
          <AvatarGroup className="manage-task-avatar-group" max={3}>
            {assignees.map((user, index) => (
              <Avatar key={index} {...stringAvatar(user.fullName)} title={user.fullName} onClick={()=> navigate(`/profile/${user.email}`)}/>
            ))}
          </AvatarGroup>
        );
      }
    },
    {
      field: "view",
      headerName: "צפייה",
      width: 80,
      align: "center",
      flex: 0.5,
      renderCell: (params) => (
        <IconButton
          aria-label="view"
          onClick={() => navigate(`/event/${params.row.eventDoc}`)}
        >
          <VisibilityIcon />
        </IconButton>
      )
    }
  ];

  const editColumn = {
    field: "edit",
    headerName: "עריכה",
    width: 150,
    align: "right",
    flex: 1.5,
    renderCell: (params) => (
      <div>
        <IconButton
          aria-label="edit"
          onClick={() => handleEditClick(params.row)}
        >
          <EditIcon />
        </IconButton>
        <IconButton
          aria-label="delete"
          onClick={() => setDeleteTarget(params.row)}
        >
          <DeleteForeverIcon />
        </IconButton>
      </div>
    )
  };

  const columns =
    user.privileges > 1 ? [...baseColumns, editColumn] : baseColumns;

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
        eventDoc: doc.id
      }));
      const rowsEventsData = await Promise.all(
        eventsArray.map(async (event, index) => {
          const assignees = Array.isArray(event.assignees)
            ? event.assignees
            : [];
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
            eventTime: event.eventTime,
            eventStatus: event.eventStatus,
            assignTo: assigneeData || []
          };
        })
      );
      setRows(rowsEventsData);
    } catch (e) {
      console.error("Error getting documents: ", e);
    }
  }

  useEffect(() => {
    getEvents();

    const handleClickOutside = (event) => {
      if (
        createEventRef.current &&
        !createEventRef.current.contains(event.target)
      ) {
        setShowCreateEvent(false);
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
      setAlert(true);
      setTimeout(() => {
        setAlert(false);
      }, 5000);
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
        setEditEventDetails({ ...eventData, id: eventDoc.id });
        setIsEditing(true);
      } else {
        console.error("No such document!");
      }
    } catch (e) {
      console.error("Error fetching event: ", e);
    }
  };

  const handleCloseEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    getEvents(); // Refresh event details
  };

  return (
    <div>
      {deleteTarget && (
        <ConfirmAction
          onConfirm={() => handleDeleteEvent()}
          onCancel={() => setDeleteTarget("")}
        />
      )}
      <div className="manage-events-styles">
        <h1>אירועים</h1>
        <div ref={createEventRef} className="display-create">
          {user && user.privileges > 1 && showCreateEvent && (
            <div className="popup-overlay">
              <div ref={createEventRef} className="popup-content">
                <CreateEvent onClose={handleCloseForms} />
              </div>
            </div>
          )}
        </div>
        {user && user.privileges > 1 && (
          <div
            className="action-button add-events-button add-events-manage-events"
            onClick={handleShowCreateEvents}
          >
            <svg
              width="24px"
              height="24px"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
              <g
                id="SVGRepo_tracerCarrier"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></g>
              <g id="SVGRepo_iconCarrier">
                <path
                  d="M7 12L12 12M12 12L17 12M12 12V7M12 12L12 17"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
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
                  paginationModel: { page: 0, pageSize: 17 }
                }
              }}
              pageSizeOptions={[17, 25, 50]}
              localeText={{
                MuiTablePagination: {
                  labelDisplayedRows: ({ from, to, count }) =>
                    `${from}-${to} מתוך ${
                      count !== -1 ? count : `יותר מ ${to}`
                    }`,
                  labelRowsPerPage: "שורות בכל עמוד:"
                }
              }}
              onRowDoubleClick={handleRowDoubleClick}
            />
          </ThemeProvider>
        </div>
        {alert && (
          <Alert className="feedback-alert" severity="info">
            אירוע הוסר בהצלחה!
          </Alert>
        )}
      </div>
      <div className="footer"></div>
      <Modal
        open={isEditing}
        onClose={handleCloseEdit}
        aria-labelledby="edit-event-modal-title"
        aria-describedby="edit-event-modal-description"
      >
        <div className="modal-content">
          {editEventDetails && (
            <EditEvent
              eventDetails={editEventDetails}
              onClose={handleCloseEdit}
              onSave={handleSaveEdit}
            />
          )}
        </div>
      </Modal>
    </div>
  );
}

export default ManageEvents;
