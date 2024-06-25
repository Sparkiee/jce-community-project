import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { DataGrid } from "@mui/x-data-grid";
import { heIL } from "@mui/material/locale";
import "../styles/EventPage.css";
import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import EditEvent from "./EditEvent";
import Modal from "@mui/material/Modal";

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
      bgcolor: stringToColor(name)
    },
    children: `${name.split(" ")[0][0]}${name.split(" ")[1][0]}`
  };
}

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

function EventPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [userPrivileges, setUserPrivileges] = useState(0); // Assuming default privilege level is 0
  const theme = createTheme(
    {
      direction: "rtl",
      typography: {
        fontSize: 24
      }
    },
    heIL
  );

  const fetchEvent = async () => {
    try {
      const eventDoc = await getDoc(doc(db, "events", id));
      if (eventDoc.exists()) {
        const eventData = eventDoc.data();
        setEvent({ ...eventData, id: eventDoc.id });
      } else {
        console.error("No such document!");
      }
    } catch (e) {
      console.error("Error fetching event: ", e);
    }
  };

  useEffect(() => {
    fetchEvent();

    async function fetchTasks() {
      try {
        const q = query(collection(db, "tasks"), where("relatedEvent", "==", `events/${id}`));
        const querySnapshot = await getDocs(q);
        const tasksArray = await Promise.all(
          querySnapshot.docs.map(async (doc, index) => {
            const taskData = doc.data();
            const assignees = Array.isArray(taskData.assignees) ? taskData.assignees : [];
            const assigneeData = await Promise.all(
              assignees.map(async (assigneePath) => {
                const email = assigneePath.split("/")[1];
                const fullName = await getMemberFullName(email);
                return { email, fullName };
              })
            );
            return {
              ...taskData,
              id: index + 1,
              assignTo: assigneeData
            };
          })
        );
        setTasks(tasksArray);
      } catch (e) {
        console.error("Error fetching tasks: ", e);
      }
    }

    function fetchUserPrivileges() {
      const user = JSON.parse(sessionStorage.getItem('user'));
      if (user && user.privileges) {
        setUserPrivileges(user.privileges);
      }
    }

    fetchTasks();
    fetchUserPrivileges(); // Fetch the user privileges from session storage
  }, [id]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCloseEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    fetchEvent(); // Refresh event details
  };

  const taskColumns = [
    { field: "id", headerName: "אינדקס", width: "3%", align: "right", flex: 1 },
    {
      field: "taskName",
      headerName: "שם המשימה",
      width: 150,
      align: "right",
      flex: 3
    },
    {
      field: "taskDescription",
      headerName: "תיאור",
      width: 150,
      align: "right",
      flex: 4
    },
    {
      field: "taskStatus",
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
        return (
          <AvatarGroup className="manage-task-avatar-group" max={3}>
            {params.value.map((user, index) => (
              <Avatar key={index} {...stringAvatar(user.fullName)} />
            ))}
          </AvatarGroup>
        );
      }
    }
  ];

  return (
    <div className="event-page">
      <div className="event-details">
        {event && (
          <>
            <h1>{event.eventName}</h1>
            <div>
              <p>מיקום: {event.eventLocation}</p>
              <p>תאריך התחלה: {event.eventStartDate}</p>
              <p>תאריך יעד: {event.eventEndDate}</p>
              <p>סטטוס: {event.eventStatus}</p>
              <p>שעת סיום: {event.eventTime}</p>
            </div>
            {userPrivileges >= 2 && (
              <IconButton aria-label="edit" onClick={handleEditClick}>
                <EditIcon />
              </IconButton>
            )}
          </>
        )}
      </div>
      <div className="event-tasks">
        <ThemeProvider theme={theme}>
          <DataGrid
            rows={tasks}
            columns={taskColumns}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 10 }
              }
            }}
            pageSizeOptions={[10, 25, 50]}
            localeText={{
              MuiTablePagination: {
                labelDisplayedRows: ({ from, to, count }) =>
                  `${from}-${to} מתוך ${
                    count !== -1 ? count : `יותר מ ${to}`
                  }`,
                labelRowsPerPage: "שורות בכל עמוד:"
              }
            }}
          />
        </ThemeProvider>
      </div>
      <Modal
        open={isEditing}
        onClose={handleCloseEdit}
        aria-labelledby="edit-event-modal-title"
        aria-describedby="edit-event-modal-description"
      >
        <div className="modal-content">
          {event && (
            <EditEvent
              eventDetails={event}
              onClose={handleCloseEdit}
              onSave={handleSaveEdit}
            />
          )}
        </div>
      </Modal>
    </div>
  );
}

export default EventPage;
