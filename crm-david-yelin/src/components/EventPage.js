import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, doc, getDoc, getDocs, query, where, orderBy } from "firebase/firestore";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { DataGrid } from "@mui/x-data-grid";
import { heIL } from "@mui/material/locale";
import "../styles/EventPage.css";
import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import EditEvent from "./EditEvent";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DiscussionList from "./DiscussionList";
import Box from "@mui/material/Box";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import { Tab } from "@mui/material";
import ChangeLog from "./ChangeLog";

function stringToColor(string) {
  let hash = 0;
  for (let i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = "#";
  for (let i = 0; i < 3; i += 1) {
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

function EventPage() {
  const pages = ["משימות קשורות", "צ'אט", "קבצים", "שינויים"];
  const handlePageSwitch = (event, newValue) => {
    setPage(newValue);
  };
  const [page, setPage] = useState(pages[0]);
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isUserAnAssignee, setIsUserAnAssignee] = useState(false);
  const [history, setHistory] = useState([]);
  const [changes, setChanges] = useState("");

  const changeLogRef = useRef(null);
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

  const navbarTheme = createTheme(
    {
      direction: "rtl",
      typography: {
        fontSize: 36
      }
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

  const fetchEvent = useCallback(async () => {
    try {
      const eventDoc = await getDoc(doc(db, "events", id));
      if (eventDoc.exists()) {
        const eventData = eventDoc.data();

        // Fetch event creator's full name
        const eventCreatorFullName = await getMemberFullName(eventData.eventCreator.split("/")[1]);

        const assigneesData = await Promise.all(
          (eventData.assignees || []).map(async (assigneePath) => {
            const email = assigneePath.split("/")[1];
            const fullName = await getMemberFullName(email);
            return { email, fullName };
          })
        );
        const userIsAssignee = assigneesData.some((assignee) => assignee.email === user.email);

        setEvent({ ...eventData, id: eventDoc.id, assigneesData, eventCreatorFullName });
        setIsUserAnAssignee(userIsAssignee);
      } else {
        console.error("No such document!");
      }
    } catch (e) {
      console.error("Error fetching event: ", e);
    }
  }, [id]);

  const fetchTasks = useCallback(async () => {
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
            id: doc.id,
            assignTo: assigneeData,
            index: index + 1
          };
        })
      );
      setTasks(tasksArray);
    } catch (e) {
      console.error("Error fetching tasks: ", e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  async function fetchHistory() {
    try {
      const q = query(
        collection(db, "log_events"),
        where("event", "==", `events/${id}`),
        orderBy("timestamp", "desc")
      );
      const querySnapshot = await getDocs(q);
      const historyArray = querySnapshot.docs.map((doc) => doc.data());
      const history = historyArray.map((item, index) => {
        return {
          id: index + 1,
          date: item.timestamp.toDate().toLocaleDateString("he-IL"),
          time: item.timestamp.toDate().toLocaleTimeString("he-IL"),
          ...item
        };
      });
      const nonEmptyHistory = history.filter(
        (item) => item.updatedFields && Object.keys(item.updatedFields).length > 0
      );
      const historyWithNames = await Promise.all(
        nonEmptyHistory.map(async (item) => {
          const fullName = await getMemberFullName(item.member.split("/")[1]);
          return { ...item, fullName: fullName };
        })
      );
      setHistory(historyWithNames);
    } catch (e) {
      console.log("Error fetching history: ", e);
    }
  }

  const user = JSON.parse(sessionStorage.getItem("user"));

  useEffect(() => {
    fetchEvent();
    fetchTasks();
    fetchHistory();
  }, []);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (createEventRef.current && !createEventRef.current.contains(event.target)) {
        setIsEditing(false);
      }
      if (changeLogRef.current && !changeLogRef.current.contains(event.target)) {
        setChanges("");
      }
    };

    if (isEditing) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditing]);

  const Participants = ({ assignees }) => {
    return (
      <div className="participants-list">
        {assignees.map((assignee, index) => (
          <div key={index} className="participant-item">
            <Link to={`/profile/${assignee.email}`}>
              <Avatar {...stringAvatar(assignee.fullName)} />
            </Link>
            <Link to={`/profile/${assignee.email}`} className="participants-name">
              <p>{assignee.fullName}</p>
            </Link>
          </div>
        ))}
      </div>
    );
  };

  const taskColumns = [
    { field: "index", headerName: "אינדקס", width: "3%", align: "right", flex: 1 },
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
    ...(user.privileges == 2 || isUserAnAssignee
      ? [
          {
            field: "taskBudget",
            headerName: "תקציב",
            width: 150,
            align: "right",
            flex: 1,
            renderCell: (params) => {
              return (
                <div>₪{params.row.taskBudget ? params.row.taskBudget.toLocaleString() : "אין"}</div>
              );
            }
          }
        ]
      : []),
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
              <Avatar key={index} {...stringAvatar(user.fullName)} />
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
        <IconButton aria-label="view" onClick={() => navigate(`/task/${params.row.id}`)}>
          <VisibilityIcon />
        </IconButton>
      )
    }
  ];

  function replaceFieldString(fieldName) {
    switch (fieldName) {
      case "eventName":
        return "שם האירוע";
      case "eventLocation":
        return "מיקום האירוע";
      case "eventStartDate":
        return "תאריך התחלת האירוע";
      case "eventEndDate":
        return "תאריך סיום האירוע";
      case "eventTime":
        return "שעת האירוע";
      case "eventStatus":
        return "סטטוס האירוע";
      case "eventBudget":
        return "תקציב האירוע";
      default:
        return fieldName;
    }
  }

  function generateHtmlListForFieldChanges(fields) {
    if (fields == null) return "";
    const array = Object.entries(fields);
    const formatted = array
      .map(([fieldName]) => {
        return `${replaceFieldString(fieldName)}`;
      })
      .join(", "); // Modified this line to add a comma and space

    return formatted;
  }

  const HistoryColumns = [
    { field: "id", headerName: "אינדקס", align: "right", flex: 0.8 },
    {
      field: "changeDate",
      headerName: "תאריך",
      align: "right",
      flex: 1.5,
      renderCell: (params) => {
        return <div>{params.row.date}</div>;
      }
    },
    {
      field: "changeTime",
      headerName: "שעה",
      align: "right",
      flex: 1.5,
      renderCell: (params) => {
        return <div>{params.row.time}</div>;
      }
    },
    {
      field: "changedBy",
      headerName: "שונה על ידי",
      align: "right",
      flex: 2,
      renderCell: (params) => {
        return (
          <div className="avatar-position-center" style={{ cursor: "pointer" }}>
            <Avatar {...stringAvatar(`${params.row.fullName}`)} />
            {params.row.fullName}
          </div>
        );
      }
    },
    {
      field: "changeDescription",
      headerName: "שדות שהשתנו",
      align: "right",
      flex: 3,
      renderCell: (params) => {
        return <div>{generateHtmlListForFieldChanges(params.row.updatedFields)}</div>;
      }
    },
    {
      field: "view",
      headerName: "צפייה",
      align: "right",
      flex: 0.8,
      renderCell: (params) => (
        <IconButton
          aria-label="view"
          onClick={() => setChanges(params.row.updatedFields)}
          style={{ padding: 0 }}>
          <VisibilityIcon />
        </IconButton>
      )
    }
  ];

  const PageContent = ({ pageName }) => {
    switch (pageName) {
      case pages[0]:
        return (
          <div className="event-tasks">
            {!loading && (
              <ThemeProvider theme={theme}>
                <DataGrid
                  rows={tasks}
                  columns={taskColumns}
                  initialState={{
                    pagination: {
                      paginationModel: { page: 0, pageSize: 5 }
                    }
                  }}
                  pageSizeOptions={[5, 25, 50]}
                  localeText={{
                    MuiTablePagination: {
                      labelDisplayedRows: ({ from, to, count }) =>
                        `${from}-${to} מתוך ${count !== -1 ? count : `יותר מ ${to}`}`,
                      labelRowsPerPage: "שורות בכל עמוד:"
                    }
                  }}
                  onRowDoubleClick={(params) => {
                    navigate(`/task/${params.row.taskDoc}`);
                  }}
                />
              </ThemeProvider>
            )}
          </div>
        );
      case pages[1]:
        return (
          <div className="event-page-comments">
            <h2>Chat</h2>
            {event && <DiscussionList eventId={event.id} />}
          </div>
        );
      case pages[2]:
        return <h2>פה יהיו הקבצים</h2>;
      case pages[3]:
        return (
          <div className="event-history">
            <ThemeProvider theme={theme}>
              <DataGrid
                rows={history}
                columns={HistoryColumns}
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 5 }
                  }
                }}
                pageSizeOptions={[5, 25, 50]}
                localeText={{
                  MuiTablePagination: {
                    labelDisplayedRows: ({ from, to, count }) =>
                      `${from}-${to} מתוך ${count !== -1 ? count : `יותר מ ${to}`}`,
                    labelRowsPerPage: "שורות בכל עמוד:"
                  }
                }}
                onRowDoubleClick={(params) => {
                  navigate(`/task/${params.row.taskDoc}`);
                }}
              />
            </ThemeProvider>
          </div>
        );
      default:
        return <h2>Page Not Found</h2>;
    }
  };

  return (
    <div className="event-page">
      <div className="event-page-container">
        <div className="event-page-right-side">
          <div className="event-page-style">
            <div className="event-details">
              {event && (
                <div className="event-box">
                  <h1>{event.eventName}</h1>
                  <div>
                    <p>
                      <strong>מיקום: </strong>
                      {event.eventLocation}
                    </p>
                    <p>
                      <strong>תאריך התחלה: </strong>
                      {event.eventStartDate}
                    </p>
                    <p>
                      <strong>תאריך יעד: </strong>
                      {event.eventEndDate}
                    </p>
                    <p>
                      <span className="status-cell">
                        <strong>סטטוס:</strong>
                        <span
                          className={`status-circle ${getStatusColorClass(
                            event.eventStatus
                          )} circle-space`}></span>
                        {event.eventStatus}
                      </span>
                    </p>
                    <p>
                      <strong>שעת סיום: </strong>
                      {event.eventTime}
                    </p>
                    {(user.privileges == 2 || isUserAnAssignee) && (
                      <p>
                        <strong>תקציב: </strong>₪{event.eventBudget.toLocaleString()}
                      </p>
                    )}
                    <p>
                      <strong>יוצר האירוע: </strong>
                      {event.eventCreatorFullName}
                    </p>
                  </div>
                  {(user.privileges == 2 || user.adminAccess.includes("editEvent")) && (
                    <IconButton
                      className="event-page-edit-icon"
                      aria-label="edit"
                      onClick={handleEditClick}>
                      <EditIcon />
                    </IconButton>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="event-page-participants">
            <h2>משתתפים</h2>
            {event && event.assigneesData && <Participants assignees={event.assigneesData} />}
          </div>

          {isEditing && event && (
            <div className="popup-overlay">
              <div ref={createEventRef} className="popup-content">
                <EditEvent eventDetails={event} onClose={handleSaveEdit} />
              </div>
            </div>
          )}
          {changes && (
            <div className="popup-overlay">
              <div ref={changeLogRef} className="popup-content">
                <ChangeLog fields={changes} onClose={() => setChanges("")} />
              </div>
            </div>
          )}
        </div>
        <div className="event-page-left-side">
          <div className="event-page-navbar">
            <ThemeProvider theme={navbarTheme}>
              <Box sx={{ width: "100%" }}>
                <TabContext value={page}>
                  <TabList onChange={handlePageSwitch} aria-label="lab API tabs example">
                    {pages.map((page, index) => (
                      <Tab key={index} label={page} value={page} />
                    ))}
                  </TabList>
                </TabContext>
              </Box>
            </ThemeProvider>
          </div>
          <div className="event-page-content">
            <PageContent pageName={page} />
          </div>
        </div>
      </div>
      <div className="footer"></div>
    </div>
  );
}

export default EventPage;
