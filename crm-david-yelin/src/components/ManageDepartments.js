import React, { useEffect, useRef, useState } from "react";
import "../styles/ManageDepartments.css";
import { db } from "../firebase";
import { collection, getDocs, doc, query, where, deleteDoc, updateDoc, setDoc } from "firebase/firestore";
import IconButton from "@mui/material/IconButton";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { DataGrid } from "@mui/x-data-grid";
import { heIL } from "@mui/material/locale";
import EditIcon from "@mui/icons-material/Edit";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import ConfirmAction from "./ConfirmAction";
import EditDepartment from "./EditDepartment";
import CreateDepartment from "./CreateDepartment";

function ManageDepartments() {
  const [departments, setDepartments] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState("");
  const [editTarget, setEditTarget] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [user, setUser] = useState(null);

  const editDepartmentRef = useRef(null);

  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem("user"));
    if (userData) setUser(userData);
    else {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (userData) setUser(userData);
    }
  }, []);

  async function getDepartments() {
    const collectionRef = collection(db, "departments");
    try {
      const snapshot = await getDocs(collectionRef);
      const departmentsPromises = snapshot.docs.map(async (doc, index) => {
        // Query members for each department
        const membersRef = collection(db, "members");
        const q = query(membersRef, where("department", "==", doc.data().name));
        const membersSnapshot = await getDocs(q);
        const memberCount = membersSnapshot.docs.length; // Count members in department

        return {
          ...doc.data(),
          docRef: doc.id,
          id: index + 1,
          name: doc.data().name,
          memberCount: memberCount // Include member count
        };
      });

      const departments = await Promise.all(departmentsPromises);
      setDepartments(departments);
    } catch (e) {
      console.error("Error getting documents: ", e);
    }
  }

  const columns = [
    { field: "id", headerName: "אינדקס", align: "right", flex: 0.5 },
    { field: "name", headerName: "שם המחלקה", align: "right", flex: 3 },
    { field: "memberCount", headerName: "מספר חברים פעילים", align: "right", flex: 2 },
    {
      field: "view",
      headerName: "עריכה",
      width: 80,
      align: "right",
      flex: 0.5,
      renderCell: (params) => (
        <div>
          {(user.privileges >= 2 || user.adminAccess.includes("editDepartment")) && (
            <IconButton aria-label="edit" onClick={() => setEditTarget(params.row)}>
              <EditIcon />
            </IconButton>
          )}
          {(user.privileges >= 2 || user.adminAccess.includes("deleteDepartment")) && (
            <IconButton aria-label="delete" onClick={() => setDeleteTarget(params.row)}>
              <DeleteForeverIcon />
            </IconButton>
          )}
        </div>
      )
    }
  ];

  const theme = createTheme(
    {
      direction: "rtl",
      typography: {
        fontSize: 24
      }
    },
    heIL
  );

  async function updateMemberDepartment(oldDepartment, newDepartment) {
    const memberRef = collection(db, "members");
    const q = query(memberRef, where("department", "==", oldDepartment));
    try {
      const querySnapshot = await getDocs(q);
      const updatePromises = querySnapshot.docs.map((document) => {
        const docRef = doc(db, "members", document.id);
        return updateDoc(docRef, {
          department: newDepartment
        });
      });
      await Promise.all(updatePromises);
    } catch (e) {
      console.error("Error updating documents: ", e);
    }
    const pendingRef = collection(db, "awaiting_registration");
    const qPending = query(pendingRef, where("department", "==", oldDepartment));
    try {
      const querySnapshot = await getDocs(qPending);
      const updatePromises = querySnapshot.docs.map((document) => {
        const docRef = doc(db, "awaiting_registration", document.id);
        return updateDoc(docRef, {
          department: newDepartment
        });
      });
      await Promise.all(updatePromises);
    } catch (e) {
      console.error("Error updating documents: ", e);
    }
  }

  async function handleDeleteDepartment() {
    try {
      const docRef = doc(db, "departments", deleteTarget.docRef);
      await deleteDoc(docRef);
      setDeleteTarget("");
      updateMemberDepartment(deleteTarget.name, "נא לעדכן מחלקה");
      getDepartments();
    } catch (e) {
      console.error("Error deleting document: ", e);
    }
  }

  useEffect(() => {
    getDepartments();

    const handleClickOutside = (event) => {
      if (editDepartmentRef.current && !editDepartmentRef.current.contains(event.target)) {
        setEditTarget("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  async function handleUpdateDepartment(department) {
    setEditTarget("");
    try {
      const docToDelete = doc(db, "departments", editTarget.docRef);
      await deleteDoc(docToDelete);
      const newDocRef = doc(db, "departments", department);
      await setDoc(newDocRef, { name: department });
      await updateMemberDepartment(editTarget.name, department);
      getDepartments();
    } catch (e) {
      console.error("Error updating document: ", e);
    }
  }

  return (
    <div>
      {editTarget && (
        <div className="popup-overlay">
          <div ref={editDepartmentRef} className="popup-content">
            <EditDepartment
              onClose={() => setEditTarget("")}
              department={editTarget}
              onComplete={handleUpdateDepartment}
            />
          </div>
        </div>
      )}
      {deleteTarget && (
        <div className="popup-overlay">
          <ConfirmAction onConfirm={() => handleDeleteDepartment()} onCancel={() => setDeleteTarget("")} />
        </div>
      )}
      {showAddForm && (
        <div className="popup-overlay">
          <div className="popup-content">
            <CreateDepartment
              onClose={() => setShowAddForm(false)}
              onComplete={() => {
                setShowAddForm(false);
                getDepartments();
              }}
            />
          </div>
        </div>
      )}
      <div className="manage-departments">
        <h1>ניהול מחלקות</h1>
        {user && ((Array.isArray(user.adminAccess) && user.adminAccess.includes("createDepartment")) || user.privileges >= 2) &&(<div className="action-button add-department-button" onClick={() => setShowAddForm(true)}>
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
          יצירת מחלקה חדשה
        </div>)}
        <div style={{ height: 995, width: "90%" }}>
          <ThemeProvider theme={theme}>
            <DataGrid
              direction="rtl"
              className="data-grid"
              rows={departments}
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
                    `${from}-${to} מתוך ${count !== -1 ? count : `יותר מ-${to}`}`,
                  labelRowsPerPage: "שורות בכל עמוד:"
                }
              }}
              onRowDoubleClick={(params) => {
                console.log(`${params.row}`);
              }}
            />
          </ThemeProvider>
        </div>
      </div>
    </div>
  );
}

export default ManageDepartments;
