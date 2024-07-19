import React, { useEffect, useState, useRef } from "react";
import "../styles/Styles.css";
import "../styles/ManageUser.css";
import { heIL } from "@mui/material/locale";
import { useNavigate } from "react-router-dom";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { DataGrid } from "@mui/x-data-grid";
import { db } from "../firebase";
import { updateDoc, doc, query, collection, getDocs, where, deleteDoc } from "firebase/firestore";
import EditIcon from "@mui/icons-material/Edit";
import IconButton from "@mui/material/IconButton";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import Alert from "@mui/material/Alert";
import EditUser from "./EditUser";
import CreateUser from "./CreateUser";
import DeleteIcon from "@mui/icons-material/Delete";
import ConfirmAction from "./ConfirmAction";
import VisibilityIcon from "@mui/icons-material/Visibility";
import KeyIcon from "@mui/icons-material/Key";
import EditAccess from "./EditAccess";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PersonIcon from "@mui/icons-material/Person";

function ManageUsers() {
  const [fullActiveMembers, setFullActiveMembers] = useState([]);
  const [fullDisabledMembers, setFullDisabledMembers] = useState([]);
  const [fullPendingMembers, setFullPendingMembers] = useState([]);

  const [activeMemberRows, setActiveMemberRows] = useState([]);
  const [pendingMemberRows, setPendingMemberRows] = useState([]);
  const [disabledMemberRows, setDisabledMemberRows] = useState([]);

  const [removeLastAdminAlert, setRemoveLastAdminAlert] = useState(false);
  const [editUserForm, setEditUserForm] = useState(false);
  const [editUser, setEditUser] = useState();
  const [editAdminAccess, setEditAdminAccess] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState("");
  const [removePermmisionTarget, setRemovePermmisionTarget] = useState("");

  const [user, setUser] = useState(null);

  const editUserRef = useRef(null);
  const createUserRef = useRef(null);
  const editAccessRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem("user"));
    if (userData) setUser(userData);
    else {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (userData) setUser(userData);
    }
  }, []);

  const handleDeleteClick = (email) => {
    setDeleteTarget(email);
  };

  const handleConfirmDelete = () => {
    deleteUser(deleteTarget);
    setDeleteTarget("");
    fetchUsers();
  };
  const handleCancelDelete = () => {
    setDeleteTarget("");
  };

  const theme = createTheme(
    {
      direction: "rtl",
      typography: {
        fontSize: 24,
      },
    },
    heIL
  );

  const awaitingCol = [
    {
      field: "id",
      headerName: "אינדקס",
      align: "right",
      flex: 1,
    },
    {
      field: "email",
      headerName: "אימייל",
      align: "right",
      flex: 3,
    },
    {
      field: "department",
      headerName: "מחלקה",
      align: "right",
      flex: 2,
    },
    {
      field: "role",
      headerName: "תפקיד",
      align: "right",
      flex: 2,
    },
  ];

  const awaitingColumns = [
    ...awaitingCol,
    ...(user && (user.privileges >= 2 || user.adminAccess.includes("createUser"))
      ? [
          {
            field: "edit",
            headerName: "מחיקה",
            align: "right",
            flex: 1.5,
            renderCell: (params) => (
              <div>
                <IconButton
                  aria-label="edit"
                  title="מחיקה"
                  onClick={() => {
                    handleDeleteClick(params.row.email);
                  }}>
                  <DeleteIcon />
                </IconButton>
              </div>
            ),
          },
        ]
      : []),
  ];

  const columns = [
    {
      field: "id",
      headerName: "אינדקס",
      align: "right",
      flex: 1,
      edittable: true,
    },
    {
      field: "firstName",
      headerName: "שם פרטי",
      align: "right",
      flex: 1.5,
      edittable: true,
    },
    {
      field: "lastName",
      headerName: "שם משפחה",
      align: "right",
      flex: 1.5,
      edittable: true,
    },
    {
      field: "email",
      headerName: "אימייל",
      align: "right",
      flex: 2.5,
    },
    {
      field: "phone",
      headerName: "טלפון",
      align: "right",
      flex: 1.8,
      renderCell: (params) => <span dir="ltr">{params.value}</span>,
    },
    {
      field: "department",
      headerName: "מחלקה",
      align: "right",
      flex: 2,
    },
    {
      field: "role",
      headerName: "תפקיד",
      align: "right",
      flex: 2,
    },
    {
      field: "privileges",
      headerName: "הרשאות",
      align: "right",
      flex: 1.5,
      renderCell: (params) => {
        const privileges = params.row.privileges;
        const hasAdminAccess =
          Array.isArray(params.row.adminAccess) && params.row.adminAccess.length > 0;

        if (privileges === 1) {
          return (
            <div className="user-privilege-indicator">
              משתמש פעיל
              {hasAdminAccess && <AddCircleOutlineIcon className="addition-indicator" />}
            </div>
          );
        } else if (privileges === 2) {
          return "מנהל ראשי";
        } else if (privileges === 3) {
          return "Evyevy12";
        } else if (privileges === 0) {
          return "ללא הרשאות";
        }
        return "לא מוגדר";
      },
    },
  ];

  const editEnabled = [
    ...columns,
    ...(user &&
    (user.privileges >= 2 ||
      user.adminAccess.includes("manageUser") ||
      user.adminAccess.includes("manageAdmin"))
      ? [
          {
            field: "edit",
            field: "edit",
            headerName: "עריכה",
            align: "right",
            flex: 2,
            renderCell: (params) => (
              <div>
                {(user.privileges >= 2 || user.adminAccess.includes("manageUser")) && (
                  <>
                    <IconButton
                      aria-label="edit"
                      title="עריכה"
                      onClick={() => {
                        setEditUser(params.row);
                        setEditUserForm(true);
                      }}>
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      aria-label="removePerm"
                      title="הסר גישה לאתר"
                      onClick={() => {
                        setRemovePermmisionTarget(params.row);
                      }}>
                      <PersonOffIcon />
                    </IconButton>
                  </>
                )}
                {(user.privileges >= 2 || user.adminAccess.includes("manageAdmin")) && (
                  <IconButton
                    aria-label="adminAccess"
                    title="עדכן גישות"
                    onClick={() => {
                      setEditUser(params.row);
                      setEditAdminAccess(true);
                    }}>
                    <KeyIcon />
                  </IconButton>
                )}
              </div>
            ),
          },
        ]
      : []),
    {
      field: "view",
      headerName: "הצגה",
      align: "right",
      flex: 0.8,
      renderCell: (params) => (
        <div>
          <IconButton
            aria-label="edit"
            title="הצגה"
            onClick={() => navigate(`/profile/${params.row.email}`)}>
            <VisibilityIcon />
          </IconButton>
        </div>
      ),
    },
  ];

  async function handleRemovePermissions() {
    setRemovePermmisionTarget("");
    try {
      const usersRef = collection(db, "members");
      if (removePermmisionTarget.privileges >= 3) {
        const q = query(usersRef, where("privileges", ">=", 3));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.size === 1) {
          setRemoveLastAdminAlert(true);
          setTimeout(() => {
            setRemoveLastAdminAlert(false);
          }, 5000);
          return;
        }
      }
      const targetUserRef = doc(usersRef, removePermmisionTarget.email);
      await updateDoc(targetUserRef, {
        privileges: 0,
        adminAccess: [],
      });
      fetchUsers();
    } catch (error) {
      console.error("Remove permissions error:", error);
    }
  }

  const editDisabled = [
    ...columns,
    ...(user && (user.privileges >= 2 || user.adminAccess.includes("manageUser"))
      ? [
          {
            field: "edit",
            headerName: "עריכה",
            align: "right",
            flex: 1.5,
            renderCell: (params) => (
              <div>
                <IconButton
                  aria-label="edit"
                  title="עריכה"
                  onClick={() => {
                    setEditUser(params.row);
                    setEditUserForm(true);
                  }}>
                  <EditIcon />
                </IconButton>
              </div>
            ),
          },
        ]
      : []),
    {
      field: "view",
      headerName: "הצגה",
      align: "right",
      flex: 0.8,
      renderCell: (params) => (
        <div>
          <IconButton
            aria-label="edit"
            title="הצגה"
            onClick={() => navigate(`/profile/${params.row.email}`)}>
            <VisibilityIcon />
          </IconButton>
        </div>
      ),
    },
  ];
  async function deleteUser(email) {
    try {
      const docRef = doc(db, "awaiting_registration", email);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error removing document: ", error);
    }
    fetchUsers();
  }
  async function fetchUsers() {
    try {
      const membersRef = collection(db, "members");
      const membersSnapshot = await getDocs(membersRef);
      const membersList = membersSnapshot.docs.map((doc) => doc.data());
      const disabledMembers = membersList.filter((member) => member.privileges === 0);
      const enabledMembers = membersList.filter((member) => member.privileges > 0);
      const disabledMembersFormatted = disabledMembers.map((member, index) => {
        return {
          id: index + 1,
          firstName: member.firstName || "",
          lastName: member.lastName || "",
          email: member.email || "",
          phone: member.phone || 0,
          department: member.department || "",
          role: member.role || "",
          privileges: member.privileges || 0,
        };
      });
      const enabledMembersFormatted = enabledMembers.map((member, index) => {
        return {
          id: index + 1,
          firstName: member.firstName || "",
          lastName: member.lastName || "",
          email: member.email || "",
          phone: member.phone || 0,
          department: member.department || "",
          role: member.role || "",
          privileges: member.privileges || 0,
          adminAccess: member.adminAccess || [],
        };
      });
      setDisabledMemberRows(disabledMembersFormatted);
      setActiveMemberRows(enabledMembersFormatted);

      setFullActiveMembers(enabledMembersFormatted);
      setFullDisabledMembers(disabledMembersFormatted);
    } catch (error) {
      console.error("Fetch user error:", error);
    }

    try {
      const membersRef = collection(db, "awaiting_registration");
      const membersSnapshot = await getDocs(membersRef);
      const membersList = membersSnapshot.docs.map((doc) => doc.data());
      const membersFormatted = membersList.map((member, index) => {
        return {
          id: index + 1,
          email: member.email || "",
          department: member.department || "",
          role: member.role || "",
        };
      });
      setPendingMemberRows(membersFormatted);
      setFullPendingMembers(membersFormatted);
    } catch (error) {
      console.error("Fetch user error:", error);
    }
  }

  useEffect(() => {
    fetchUsers();

    const handleClickOutside = (event) => {
      if (editUserRef.current && !editUserRef.current.contains(event.target)) {
        setEditUserForm(false);
      }

      if (createUserRef.current && !createUserRef.current.contains(event.target)) {
        setShowCreateUser(false);
      }

      if (editAccessRef.current && !editAccessRef.current.contains(event.target)) {
        setEditAdminAccess(false);
      }
    };
    // Add the event listener when the component mounts
    document.addEventListener("mousedown", handleClickOutside);

    // Return a cleanup function to remove the event listener when the component unmounts
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCloseForm = () => {
    setEditUserForm(false);
    setShowCreateUser(false);
    fetchUsers();
  };

  const handleRowDoubleClick = (params) => {
    navigate(`/profile/${params.row.email}`);
  };

  return (
    <div>
      {editAdminAccess && (
        <div className="popup-overlay">
          <div ref={editAccessRef} className="popup-content">
            <EditAccess
              target={editUser}
              onClose={() => {
                setEditAdminAccess(false);
                fetchUsers();
              }}
            />
          </div>
        </div>
      )}
      {editUserForm && (
        <div className="popup-overlay">
          <div ref={editUserRef} className="popup-content">
            <EditUser
              target={editUser}
              onClose={() => {
                handleCloseForm();
                fetchUsers();
              }}
            />
          </div>
        </div>
      )}
      {showCreateUser && (
        <div className="popup-overlay">
          <div ref={createUserRef} className="popup-content">
            <CreateUser onClose={handleCloseForm} />
          </div>
        </div>
      )}
      {removePermmisionTarget && (
        <div className="popup-overlay">
          <ConfirmAction
            className="popup-content"
            onConfirm={() => handleRemovePermissions()}
            onCancel={() => setRemovePermmisionTarget("")}
          />
        </div>
      )}
      {deleteTarget && (
        <div className="popup-overlay">
          <ConfirmAction
            className="popup-content"
            onConfirm={() => handleConfirmDelete()}
            onCancel={() => handleCancelDelete()}
          />
        </div>
      )}
      <div className="manage-users-container">
        <div className="page-title-manage-user-header">
          <PeopleAltIcon className="page-title-icon" />
          <div className="page-title-manage-users">ניהול משתמשים</div>
        </div>
        {user && (user.privileges >= 2 || user.adminAccess.includes("createUser")) && (
          <div className="action-button add-user-button" onClick={() => setShowCreateUser(true)}>
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
            הוסף משתמש
          </div>
        )}
        <div className="table-title-container">
          <PersonIcon className="manage-users-icon" />
          <div className="table-title">משתמשים פעילים</div>
        </div>
        <div className="search-active-users-table">
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
            placeholder="חיפוש משתמש"
            onChange={(event) => {
              const searchValue = event.target.value;
              const filteredMembers = fullActiveMembers.filter((member) => {
                const fullName = `${member.firstName} ${member.lastName}`;
                return fullName.includes(searchValue);
              });
              setActiveMemberRows(filteredMembers);
            }}
          />
        </div>
        {removeLastAdminAlert && (
          <Alert className="feedback-alert user-data-feedback" severity="warning">
            לא ניתן להסיר מנהל ראשי אחרון מהמערכת
          </Alert>
        )}
        <div className="datagrid-table" style={{ height: 371, width: "90%" }}>
          <ThemeProvider theme={theme}>
            <DataGrid
              className="data-grid"
              rows={activeMemberRows}
              columns={editEnabled}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 5 },
                },
              }}
              pageSizeOptions={[5, 10, 20]}
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
        <div className="unactive-users">
          <hr className="divider-manage-users" />
          <div className="table-title-container">
            <PersonOffIcon className="manage-users-icon" />
            <div className="table-title">משתמשים לא פעילים</div>
          </div>
          <div className="search-unactive-users-table">
            <svg
              viewBox="0 0 32 32"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              fill="#000000">
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
              placeholder="חיפוש משתמש"
              onChange={(event) => {
                const searchValue = event.target.value;
                const filteredMembers = fullDisabledMembers.filter((member) => {
                  const fullName = `${member.firstName} ${member.lastName}`;
                  return fullName.includes(searchValue);
                });
                setDisabledMemberRows(filteredMembers);
              }}
            />
          </div>
          <div className="datagrid-table" style={{ height: 371, width: "90%" }}>
            <ThemeProvider theme={theme}>
              <DataGrid
                className="data-grid"
                rows={disabledMemberRows}
                columns={editDisabled}
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 5 },
                  },
                }}
                pageSizeOptions={[5, 10, 20]}
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
        <div className="waiting-users">
          <hr className="divider-manage-users" />
          <div className="table-title-container">
            <PersonAddIcon className="manage-users-icon" />
            <div className="table-title">משתמשים שמחכים להרשמה</div>
          </div>
          <div className="search-waiting-users-table">
            <svg
              viewBox="0 0 32 32"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              fill="#000000">
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
              placeholder="חיפוש אימייל"
              onChange={(event) => {
                const searchValue = event.target.value;
                const filteredMembers = fullPendingMembers.filter((member) => {
                  return member.email.includes(searchValue);
                });
                setPendingMemberRows(filteredMembers);
              }}
            />
          </div>
          <div className="datagrid-table" style={{ height: 371, width: "90%" }}>
            <ThemeProvider theme={theme}>
              <DataGrid
                className="data-grid"
                rows={pendingMemberRows}
                columns={awaitingColumns}
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 5 },
                  },
                }}
                pageSizeOptions={[5, 10, 20]}
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
      <div className="footer"></div>
    </div>
  );
}
export default ManageUsers;
