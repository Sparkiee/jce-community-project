import React, { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { db, storage } from "../firebase";
import {
  doc,
  getDoc,
  query,
  collection,
  where,
  getDocs,
  orderBy,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  listAll,
  getMetadata,
  deleteObject,
} from "firebase/storage";
import Avatar from "@mui/material/Avatar";
import "../styles/TaskPage.css";
import "../styles/Styles.css";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import EditTask from "./EditTask";
import Forum from "./Forum";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { heIL } from "@mui/material/locale";
import Box from "@mui/material/Box";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import { Tab } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { DataGrid } from "@mui/x-data-grid";
import ChangeLog from "./ChangeLog";
import { FilePond, registerPlugin } from "react-filepond";
import "filepond/dist/filepond.min.css";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";
import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import FilePondPluginFileValidateSize from "filepond-plugin-file-validate-size";
import ConfirmAction from "./ConfirmAction";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";

// Register the plugins
registerPlugin(
  FilePondPluginFileValidateType,
  FilePondPluginImagePreview,
  FilePondPluginFileValidateSize
);

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
  const nameParts = name.split(" ");
  let initials = nameParts[0][0];
  if (nameParts.length > 1) {
    initials += nameParts[1][0];
  }
  return {
    sx: {
      bgcolor: stringToColor(name),
    },
    children: initials,
  };
}

function formatFileSize(bytes) {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Byte";
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

const CustomAlert = React.forwardRef(function CustomAlert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} action={null} />;
});

function TaskPage() {
  const pages = ["פורום", "קבצים", "שינויים"];
  const handlePageSwitch = (event, newValue) => {
    setPage(newValue);
  };
  const [page, setPage] = useState(pages[0]);
  const { taskId } = useParams();
  const [task, setTask] = useState(null);
  const [assignees, setAssignees] = useState([]);
  const [eventName, setEventName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [fullDiscussion, setFullDiscussion] = useState(null);
  const [isUserAnAssignee, setIsUserAnAssignee] = useState(false);
  const [taskCreatorFullName, setTaskCreatorFullName] = useState("");
  const [eventId, setEventId] = useState("");
  const [history, setHistory] = useState([]);
  const [changes, setChanges] = useState("");
  const [user, setUser] = useState(null);
  const [fileError, setFileError] = useState(false);
  const [fileErrorMessage, setFileErrorMessage] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [deleteFile, setDeleteFile] = useState(null);
  const [fileRows, setFileRows] = useState([]);
  const editTaskRef = useRef(null);
  const changelogRef = useRef(null);
  const navigate = useNavigate();

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

  function replaceFieldString(field) {
    switch (field) {
      case "assignees":
        return "משוייכים";
      case "taskName":
        return "שם המשימה";
      case "taskDescription":
        return "תיאור";
      case "taskStatus":
        return "סטטוס";
      case "taskStartDate":
        return "תאריך התחלה";
      case "taskEndDate":
        return "תאריך סיום";
      case "taskTime":
        return "שעה";
      case "taskBudget":
        return "תקציב";
      case "relatedEvent":
        return "אירוע קשור";
    }
  }

  const theme = createTheme(
    {
      direction: "rtl",
      typography: {
        fontSize: 24,
      },
    },
    heIL
  );

  const navbarTheme = createTheme(
    {
      direction: "rtl",
      typography: {
        fontSize: 36,
      },
    },
    heIL
  );

  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem("user"));
    if (userData) setUser(userData);
    else {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (userData) setUser(userData);
    }
  }, []);

  async function getMemberData(email) {
    if (!email) {
      console.warn("Attempted to get member data with empty email");
      return null;
    }
    try {
      const memberDoc = await getDoc(doc(collection(db, "members"), email));
      if (memberDoc.exists()) {
        const data = memberDoc.data();
        return {
          fullName: data.fullName,
          email: data.email,
          profileImage: data.profileImage,
        };
      } else {
        console.warn(`No member document found for email: ${email}`);
        return null;
      }
    } catch (e) {
      console.error("Error getting member document: ", e);
    }
  }

  useEffect(() => {
    fetchHistory();
    fetchTask();
  }, []);

  const fetchTask = async () => {
    try {
      const taskDoc = await getDoc(doc(db, "tasks", taskId));
      if (taskDoc.exists()) {
        const taskData = taskDoc.data();

        // Fetch task creator's data
        const taskCreatorData = await getMemberData(taskData.taskCreator.split("/")[1]);

        // Fetch assignee data
        const assigneeEmails = taskData.assignees.map((email) => email.split("/")[1]);
        const assigneeData = await Promise.all(assigneeEmails.map(getMemberData));

        setTask({
          ...taskData,
          taskDoc: taskId,
          taskCreatorFullName: taskCreatorData.fullName,
          taskCreatorProfileImage: taskCreatorData.profileImage,
          assignees: assigneeData,
        });
        setTaskCreatorFullName(taskCreatorData.fullName);
        setAssignees(assigneeData);

        if (user && assigneeEmails.includes(user.email)) {
          setIsUserAnAssignee(true);
        }

        // Extract event ID from the full path and fetch event data
        if (taskData.relatedEvent && taskData.relatedEvent.split("/").length === 2) {
          const eventPathSegments = taskData.relatedEvent.split("/");
          const eventId = eventPathSegments[eventPathSegments.length - 1];
          setEventId(eventId);
          const eventDoc = await getDoc(doc(db, "events", eventId));
          if (eventDoc.exists()) {
            setEventName(eventDoc.data().eventName);
          }
        } else {
          setEventName("");
        }
        fetchFiles(); // Fetch files related to the task
      } else {
        console.error("No such document!");
        navigate("/tasks");
      }
    } catch (error) {
      console.error("Error fetching task:", error);
    }
  };

  async function fetchHistory() {
    try {
      const q = query(
        collection(db, "log_tasks"),
        where("task", "==", `tasks/${taskId}`),
        orderBy("timestamp", "desc")
      );
      const querySnapshot = await getDocs(q);
      const historyArray = querySnapshot.docs.map((doc) => doc.data());
      const history = historyArray.map((item, index) => {
        return {
          id: index + 1,
          date: item.timestamp.toDate().toLocaleDateString("he-IL"),
          time: item.timestamp.toDate().toLocaleTimeString("he-IL"),
          ...item,
        };
      });
      const nonEmptyHistory = history.filter(
        (item) => item.updatedFields && Object.keys(item.updatedFields).length > 0
      );
      const historyWithMemberData = await Promise.all(
        nonEmptyHistory.map(async (item) => {
          const memberData = await getMemberData(item.member.split("/")[1]);
          return { ...item, ...memberData };
        })
      );
      setHistory(historyWithMemberData);
    } catch (e) {
      console.error("Error getting history: ", e);
    }
  }

  const fetchItemUrl = async (imagePath) => {
    const imageRef = ref(storage, imagePath);
    try {
      const metadata = await getDownloadURL(imageRef);
      return metadata;
    } catch (error) {
      console.error("Error fetching item URL:", error);
      return null;
    }
  };

  const fetchFiles = async () => {
    try {
      const taskDoc = await getDoc(doc(db, "tasks", taskId));
      if (taskDoc.exists()) {
        const taskData = taskDoc.data();
        const fileData = taskData.taskFiles || [];

        const filesWithUrls = await Promise.all(
          fileData.map(async (file) => {
            const itemPath = `tasks/${taskId}/${file.name}`;
            const itemUrl = await fetchItemUrl(itemPath);
            return { ...file, id: file.name, itemUrl, itemPath };
          })
        );

        setFileRows(filesWithUrls);
      }
    } catch (e) {
      console.error("Error fetching files: ", e);
    }
  };

  const handleDeleteFile = async () => {
    try {
      const taskDocRef = doc(db, "tasks", taskId);
      const taskDoc = await getDoc(taskDocRef);
      if (taskDoc.exists()) {
        const taskData = taskDoc.data();
        const updatedFiles = taskData.taskFiles.filter((file) => file.name !== deleteFile.name);
        await updateDoc(taskDocRef, { taskFiles: updatedFiles });
      }
      await deleteObject(ref(storage, `tasks/${taskId}/${deleteFile.name}`));
      fetchFiles();
    } catch (e) {
      console.error("Error deleting file:", e);
    }
    setDeleteFile(null);
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCloseEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    fetchTask();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (editTaskRef.current && !editTaskRef.current.contains(event.target)) {
        setIsEditing(false);
      }
      if (changelogRef.current && !changelogRef.current.contains(event.target)) {
        setChanges("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditing]);

  const handleShowFullDiscussion = async (commentId) => {
    try {
      const commentDoc = await getDoc(doc(db, "discussions", commentId));
      if (commentDoc.exists()) {
        setFullDiscussion(commentDoc.data());
      } else {
        console.error("No such discussion document!");
      }
    } catch (error) {
      console.error("Error fetching discussion:", error);
    }
  };

  if (!task) {
    return <div>טוען...</div>;
  }

  function generateHtmlListForFieldChanges(fields) {
    if (fields == null) return "";
    const array = Object.entries(fields);
    const formatted = array
      .map(([fieldName]) => {
        return `${replaceFieldString(fieldName)}`;
      })
      .join(", ");

    return formatted;
  }

  const HistoryColumns = [
    // { field: "id", headerName: "אינדקס", align: "right", flex: 0.8 },
    {
      field: "changeDate",
      headerName: "תאריך",
      align: "right",
      flex: 1.5,
      renderCell: (params) => {
        return <div>{params.row.date}</div>;
      },
    },
    {
      field: "changeTime",
      headerName: "שעה",
      align: "right",
      flex: 1.5,
      renderCell: (params) => {
        return <div>{params.row.time}</div>;
      },
    },
    {
      field: "changedBy",
      headerName: "שונה על ידי",
      align: "right",
      flex: 2,
      renderCell: (params) => (
        <div className="avatar-position-center" style={{ cursor: "pointer" }}>
          <Avatar
            src={params.row.profileImage}
            alt={params.row.fullName}
            {...(!params.row.profileImage && stringAvatar(params.row.fullName))}
          />
          {params.row.fullName}
        </div>
      ),
    },
    {
      field: "changeDescription",
      headerName: "שדות שהשתנו",
      align: "right",
      flex: 3,
      renderCell: (params) => {
        return <div>{generateHtmlListForFieldChanges(params.row.updatedFields)}</div>;
      },
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
      ),
    },
  ];

  const fileColumns = [
    {
      field: "preview",
      headerName: "תצוגה מקדימה",
      align: "right",
      flex: 1,
      renderCell: (params) => (
        <div>
          {params.row.type.includes("image") ? (
            <img className="event-file-image-preview" src={params.row.itemUrl} />
          ) : (
            ""
          )}
        </div>
      ),
    },
    { field: "name", headerName: "שם הקובץ", align: "right", flex: 3 },
    {
      field: "size",
      headerName: "גודל הקובץ",
      align: "right",
      flex: 1,
      renderCell: (params) => <div className="event-file-size">{params.row.size}</div>,
    },
    {
      field: "type",
      headerName: "סוג הקובץ",
      align: "right",
      flex: 1,
      renderCell: (params) => <div>{params.row.type.split("/")[1]}</div>,
    },
    {
      field: "uploadedAt",
      headerName: "תאריך העלאה",
      align: "right",
      flex: 1,
      renderCell: (params) => (
        <div>{params.value ? params.value.toDate().toLocaleDateString("he-IL") : ""}</div>
      ),
    },
    {
      field: "edit",
      headerName: "עריכה",
      align: "right",
      flex: 1,
      renderCell: (params) => (
        <>
          <IconButton aria-label="download" onClick={() => downloadFile(params.row.itemUrl)}>
            <DownloadIcon />
          </IconButton>
          {user &&
            (user.privileges >= 2 ||
              (Array.isArray(user.adminAccess) && user.adminAccess.includes("deleteFile"))) && (
              <IconButton aria-label="delete" onClick={() => setDeleteFile(params.row)}>
                <DeleteForeverIcon />
              </IconButton>
            )}
        </>
      ),
    },
  ];

  const downloadFile = (url) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = url.split("/").pop();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const PageContent = ({ pageName }) => {
    switch (pageName) {
      case pages[0]:
        return (
          <div className="task-discussion">
            <Forum
              eventId={taskId}
              type="task"
              name={task.taskName}
              onShowFullDiscussion={handleShowFullDiscussion}
            />
          </div>
        );
      case pages[1]:
        return (
          <div className="task-files">
            {user &&
              (user.privileges >= 2 ||
                (Array.isArray(user.adminAccess) && user.adminAccess.includes("uploadFile"))) && (
                <div>
                  <h2>העלאת קבצים</h2>
                  <FilePond
                    files={uploadedFiles}
                    allowMultiple
                    maxFileSize="1024MB"
                    labelMaxFileSize="1GB גודל הקובץ המרבי הוא"
                    credits={false}
                    labelMaxFileSizeExceeded="הקובץ גדול מדי"
                    onremovefile={() => {
                      fetchFiles();
                    }}
                    server={{
                      process: async (fieldName, file, metadata, load, error, progress, abort) => {
                        const storageRef = ref(storage, `tasks/${taskId}/${file.name}`);
                        const listRef = ref(storage, `tasks/${taskId}/`);
                        try {
                          const existingFiles = await listAll(listRef);
                          const fileNames = existingFiles.items.map((item) => item.name);

                          if (fileNames.includes(file.name)) {
                            setFileError(true);
                            setFileErrorMessage(`קובץ עם השם ${file.name} כבר קיים במערכת.`);
                            abort();
                            return;
                          }
                        } catch (listError) {
                          console.error("Error listing files:", listError);
                          error(listError.message);
                          return;
                        }

                        const uploadTask = uploadBytesResumable(storageRef, file);

                        uploadTask.on(
                          "state_changed",
                          (snapshot) => {
                            progress(true, snapshot.bytesTransferred, snapshot.totalBytes);
                          },
                          (uploadError) => {
                            error(uploadError.message);
                          },
                          async () => {
                            try {
                              const fileMetadata = await getMetadata(uploadTask.snapshot.ref);
                              const formattedFileSize = formatFileSize(fileMetadata.size);
                              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                              const taskDocRef = doc(db, "tasks", taskId);
                              await updateDoc(taskDocRef, {
                                taskFiles: arrayUnion({
                                  name: file.name,
                                  size: formattedFileSize,
                                  type: file.type,
                                  uploadedAt: new Date(),
                                }),
                              });
                              load(downloadURL);
                            } catch (downloadURLError) {
                              console.error("Error getting download URL:", downloadURLError);
                              error(downloadURLError.message);
                            }
                          }
                        );

                        return {
                          abort: () => {
                            uploadTask.cancel();
                            abort();
                          },
                        };
                      },
                    }}
                    name="files"
                    labelIdle='גרור ושחרר קבצים או <span class="filepond--label-action">בחר קבצים</span>'
                  />
                  <Snackbar
                    open={fileError}
                    autoHideDuration={3000}
                    onClose={() => setFileError(false)}
                    anchorOrigin={{ vertical: "top", horizontal: "center" }}>
                    <CustomAlert severity="error">{fileErrorMessage}</CustomAlert>
                  </Snackbar>
                </div>
              )}
            <h2>רשימת קבצים</h2>
            <div className="task-files-table">
              <ThemeProvider theme={theme}>
                <DataGrid
                  rows={fileRows}
                  columns={fileColumns}
                  initialState={{
                    pagination: { paginationModel: { page: 0, pageSize: 10 } },
                  }}
                  pageSizeOptions={[10, 20, 50]}
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
        );
      case pages[2]:
        return (
          <div className="task-history">
            <ThemeProvider theme={theme}>
              <DataGrid
                rows={history}
                columns={HistoryColumns}
                initialState={{
                  pagination: { paginationModel: { page: 0, pageSize: 10 } },
                }}
                pageSizeOptions={[10, 20, 50]}
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
        );
      default:
        return <h2>Page Not Found</h2>;
    }
  };

  return (
    <div className="task-page">
      {changes && (
        <div className="popup-overlay">
          <div ref={changelogRef} className="popup-content">
            <ChangeLog fields={changes} onClose={() => setChanges("")} />
          </div>
        </div>
      )}
      {deleteFile && (
        <div className="popup-overlay">
          <ConfirmAction onConfirm={handleDeleteFile} onCancel={() => setDeleteFile(null)} />
        </div>
      )}
      <div className="task-page-container">
        <div className="task-page-right-side">
          <div className="task-page-style">
            <div className="task-page-details">
              <h1>{task.taskName}</h1>
              <div className="task-page-info">
                <div>
                  <p>
                    <strong>תיאור:</strong> {task.taskDescription}
                  </p>
                  {eventId && (
                    <p className="link-to-event-from-task-page">
                      <strong>שייך לאירוע :</strong>{" "}
                      <Link to={`/event/${eventId}`}>{eventName}</Link>
                    </p>
                  )}
                  <p>
                    <strong>תאריך התחלה:</strong> {task.taskStartDate}
                  </p>
                  <p>
                    <strong>תאריך יעד:</strong> {task.taskEndDate}
                  </p>
                  <p>
                    <span className="status-cell">
                      <strong>סטטוס: </strong>
                      <span
                        className={`status-circle ${getStatusColorClass(
                          task.taskStatus
                        )} circle-space`}></span>
                      {task.taskStatus}
                    </span>
                  </p>
                  <p>
                    <strong>שעת סיום:</strong> {task.taskTime}
                  </p>
                  {((user && user.privileges >= 2) ||
                    isUserAnAssignee ||
                    (Array.isArray(user.adminAccess) &&
                      user.adminAccess.includes("viewBudget"))) && (
                    <p>
                      <strong>תקציב: </strong>₪{task.taskBudget.toLocaleString()}
                    </p>
                  )}
                  <p>
                    <strong>יוצר המשימה: </strong>
                    {taskCreatorFullName}
                  </p>
                </div>
                {(user.adminAccess.includes("editTask") || user.privileges >= 2) && (
                  <IconButton
                    className="task-page-edit-icon"
                    aria-label="edit"
                    onClick={handleEditClick}>
                    <EditIcon />
                  </IconButton>
                )}
              </div>
            </div>
            <div className="task-page-participants">
              <h2>משתתפים</h2>
              {assignees.map((assignee, index) => (
                <div key={index} className="assignee-task-page-item">
                  <Link className="profile-link" to={`/profile/${assignee.email}`}>
                    <Avatar
                      src={assignee.profileImage}
                      alt={assignee.fullName}
                      {...(!assignee.profileImage && stringAvatar(assignee.fullName))}
                    />
                  </Link>
                  <Link to={`/profile/${assignee.email}`}>
                    <p>{assignee.fullName}</p>
                  </Link>
                </div>
              ))}
            </div>

            {isEditing && task && (
              <div className="popup-overlay">
                <div ref={editTaskRef} className="popup-content">
                  <EditTask task={task} onClose={handleCloseEdit} onTaskUpdated={handleSaveEdit} />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="task-page-left-side">
          <div className="task-page-navbar">
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
          <div className="task-page-content">
            <PageContent pageName={page} />
          </div>
        </div>
      </div>
      <div className="footer"></div>
    </div>
  );
}

export default TaskPage;
