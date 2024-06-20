import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";
import "../styles/Styles.css";
import "../styles/ManageUser.css";
import { heIL } from "@mui/material/locale";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { DataGrid } from "@mui/x-data-grid";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import EditIcon from "@mui/icons-material/Edit";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import IconButton from "@mui/material/IconButton";
import PersonOffIcon from "@mui/icons-material/PersonOff";

function ManageUsers() {
  const [disabledMemberRows, setDisabledMemberRows] = useState([]);
  const [activeMemberRows, setActiveMemberRows] = useState([]);

  const theme = createTheme(
    {
      direction: "rtl",
      typography: {
        fontSize: 24
      }
    },
    heIL
  );

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
      renderCell: () => (
        <div>
          <IconButton aria-label="edit" title="עריכה">
            <EditIcon />
          </IconButton>
          <IconButton aria-label="removePerm" title="הסר גישה לאתר" onClick={() => console.log("well")}>
            <PersonOffIcon />
          </IconButton>
        </div>
      )
    }
  ];

  const editDisabled = [
    ...columns,
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
        </div>
      )
    }
  ];

  const fakeRows = [
    {
      id: 1,
      firstName: "ישראל ישראלי",
      email: "israeli@example.com",
      phone: "050-1234567",
      department: "הנדסה",
      role: "מהנדס תוכנה",
      privileges: "מנהל"
    },
    {
      id: 2,
      firstName: "דנה כהן",
      email: "dcohen@example.com",
      phone: "052-7654321",
      department: "שיווק",
      role: "מנהלת שיווק",
      privileges: "עורך"
    },
    {
      id: 3,
      firstName: "אבי לוי",
      email: "levy@example.com",
      phone: "054-9876543",
      department: "מכירות",
      role: "נציג מכירות",
      privileges: "משתמש"
    }
  ];

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
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div>
      <Navbar />
      <div className="manage-users-container">
        <div className="page-title">ניהול משתמשים</div>
        <div className="table-title">משתמשים פעילים</div>
        <div className="search-users-table">פה יהיה חיפוש</div>
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
      </div>
    </div>
  );
}
export default ManageUsers;
