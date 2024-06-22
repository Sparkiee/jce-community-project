import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";
import "../styles/Styles.css";
import "../styles/ManageUser.css";
import { heIL } from "@mui/material/locale";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { DataGrid } from "@mui/x-data-grid";
import { db } from "../firebase";
import {
  updateDoc,
  doc,
  query,
  collection,
  getDocs,
  where,
  deleteDoc
} from "firebase/firestore";
import EditIcon from "@mui/icons-material/Edit";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import IconButton from "@mui/material/IconButton";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import Alert from "@mui/material/Alert";
import EditUser from "./EditUser";
import CreateUser from "./CreateUser";
import DeleteIcon from "@mui/icons-material/Delete";

function ManageUsers() {
  const [disabledMemberRows, setDisabledMemberRows] = useState([]);
  const [activeMemberRows, setActiveMemberRows] = useState([]);
  const [pendingMemberRows, setPendingMemberRows] = useState([]);
  const [removeLastAdminAlert, setRemoveLastAdminAlert] = useState(false);
  const [editUserForm, setEditUserForm] = useState(false);
  const [editUser, setEditUser] = useState();
  const [showCreateUser, setShowCreateUser] = useState(false);

  const theme = createTheme(
    {
      direction: "rtl",
      typography: {
        fontSize: 24
      }
    },
    heIL
  );

  const awaitingColumns = [
    {
      field: "id",
      headerName: "אינדקס",
      align: "right",
      flex: 1
    },
    {
      field: "email",
      headerName: "אימייל",
      align: "right",
      flex: 3
    },
    {
      field: "department",
      headerName: "מחלקה",
      align: "right",
      flex: 2
    },
    {
      field: "role",
      headerName: "תפקיד",
      align: "right",
      flex: 2
    },
    {
      field: "edit",
      headerName: "מחיקה",
      width: 150,
      align: "right",
      flex: 1.5,
      renderCell: (params) => (
        <div>
          <IconButton
            aria-label="edit"
            title="מחיקה"
            onClick={() => {
              deleteUser(params.row.email);
            }}
          >
            <DeleteIcon />
          </IconButton>
        </div>
      )
    }
  ];

  const columns = [
    {
      field: "id",
      headerName: "אינדקס",
      align: "right",
      flex: 1,
      edittable: true
    },
    {
      field: "firstName",
      headerName: "שם פרטי",
      align: "right",
      flex: 2,
      edittable: true
    },
    {
      field: "lastName",
      headerName: "שם משפחה",
      align: "right",
      flex: 2,
      edittable: true
    },
    {
      field: "email",
      headerName: "אימייל",
      align: "right",
      flex: 3
    },
    {
      field: "phone",
      headerName: "טלפון",
      align: "right",
      flex: 2
    },
    {
      field: "department",
      headerName: "מחלקה",
      align: "right",
      flex: 2
    },
    {
      field: "role",
      headerName: "תפקיד",
      align: "right",
      flex: 2
    },
    {
      field: "privileges",
      headerName: "הרשאות",
      align: "right",
      flex: 2
    }
  ];

  const editEnabled = [
    ...columns,
    {
      field: "edit",
      headerName: "עריכה",
      width: 150,
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
            }}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            aria-label="removePerm"
            title="הסר גישה לאתר"
            onClick={() => {
              handleRemovePermissions(params.row);
              fetchUsers();
            }}
          >
            <PersonOffIcon />
          </IconButton>
        </div>
      )
    }
  ];

  async function handleRemovePermissions(targetUser) {
    try {
      const user = JSON.parse(sessionStorage.getItem("user"));
      if (user.privileges < 3) {
        return;
      }
      const usersRef = collection(db, "members");
      if (targetUser.privileges >= 3) {
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
      const targetUserRef = doc(usersRef, targetUser.email);
      await updateDoc(targetUserRef, {
        privileges: 0
      });
    } catch (error) {
      console.error("Remove permissions error:", error);
    }
  }

  const editDisabled = [
    ...columns,
    {
      field: "edit",
      headerName: "עריכה",
      width: 150,
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
              console.log("Edit row:", params.row);
            }}
          >
            <EditIcon />
          </IconButton>
        </div>
      )
    }
  ];
  async function deleteUser(email) {
    try {
      const docRef = doc(db, "awaiting_registration", email);
      await deleteDoc(docRef);
      console.log("Document successfully deleted!");
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
      const disabledMembers = membersList.filter(
        (member) => member.privileges === 0
      );
      const enabledMembers = membersList.filter(
        (member) => member.privileges > 0
      );
      const disabledMembersFormatted = disabledMembers.map((member, index) => {
        return {
          id: index + 1,
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          phone: member.phone,
          department: member.department,
          role: member.role,
          privileges: member.privileges
        };
      });
      const enabledMembersFormatted = enabledMembers.map((member, index) => {
        return {
          id: index + 1,
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          phone: member.phone,
          department: member.department,
          role: member.role,
          privileges: member.privileges
        };
      });
      setDisabledMemberRows(disabledMembersFormatted);
      setActiveMemberRows(enabledMembersFormatted);
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
          email: member.email,
          department: member.department,
          role: member.role
        };
      });
      setPendingMemberRows(membersFormatted);
    } catch (error) {
      console.error("Fetch user error:", error);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div>
      <Navbar />
      <div className="manage-users-container">
        {editUserForm && (
          <div className="display-edit-user">
            <div
              className="action-close"
              onClick={() => {
                setEditUserForm(false);
              }}
            >
              <svg
                width="24px"
                height="24px"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
              >
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
            <EditUser target={editUser} />
          </div>
        )}
        {showCreateUser && (
          <div className="display-create-user">
            <div
              className="action-close"
              onClick={() => {
                setShowCreateUser(false);
              }}
            >
              <svg
                width="24px"
                height="24px"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
              >
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
            <CreateUser />
          </div>
        )}
        <div className="page-title">ניהול משתמשים</div>
        <div className="pending-actions">
          <div
            className="action-button add-task-button"
            onClick={() => setShowCreateUser(true)}
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
            הוסף משתמש
          </div>
        </div>
        <div className="table-title">משתמשים פעילים</div>
        <div className="search-users-table">פה יהיה חיפוש</div>
        {removeLastAdminAlert && (
          <Alert
            className="feedback-alert user-data-feedback"
            severity="warning"
          >
            לא ניתן להסיר מנהל ראשי אחרון מהמערכת
          </Alert>
        )}
        <div className="datagrid-table">
          <ThemeProvider theme={theme}>
            <DataGrid
              className="data-grid"
              rows={activeMemberRows}
              columns={editEnabled}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 5 }
                }
              }}
              pageSizeOptions={[5]}
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
        <div className="table-title">משתמשים לא פעילים</div>
        <div className="search-users-table">פה יהיה חיפוש</div>
        <div className="datagrid-table">
          <ThemeProvider theme={theme}>
            <DataGrid
              className="data-grid"
              rows={disabledMemberRows}
              columns={editDisabled}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 5 }
                }
              }}
              pageSizeOptions={[5]}
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
        <div className="table-title">משתמשים שמחכים להרשמה</div>
        <div className="search-users-table">פה יהיה חיפוש</div>
        <div className="datagrid-table">
          <ThemeProvider theme={theme}>
            <DataGrid
              className="data-grid"
              rows={pendingMemberRows}
              columns={awaitingColumns}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 5 }
                }
              }}
              pageSizeOptions={[5]}
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
      </div>
    </div>
  );
}
export default ManageUsers;
