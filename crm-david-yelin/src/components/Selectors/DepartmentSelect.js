import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { setDoc, doc, getDocs, collection } from "firebase/firestore";

function DepartmentSelect({ department, setDepartment }) {
  const [departmentList, setDepartmentList] = useState([]);
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const [newDepartment, setNewDepartment] = useState("");

  useEffect(() => {
    async function fetchDepartments() {
      try {
        const querySnapshot = await getDocs(collection(db, "departments"));
        const departments = querySnapshot.docs.map((doc) => doc.data().name);
        setDepartmentList(departments);
      } catch (e) {
        console.error("Error fetching departments: ", e);
      }
    }

    fetchDepartments();
  }, []);

  async function addDepartment() {
    if (newDepartment && !departmentList.includes(newDepartment)) {
      setDepartmentList([...departmentList, newDepartment]);
      setDepartment(newDepartment);
      try {
        const docRef = doc(db, "departments", newDepartment);
        await setDoc(docRef, {
          name: newDepartment,
        });
      } catch (e) {
        console.error("Error adding document: ", e);
      }
    }
    setIsOtherSelected(false);
    setNewDepartment("");
  }

  return (
    <div className="department-select">
      <select
        name="department"
        value={department}
        onChange={(event) => {
          const value = event.target.value;
          if (value === "other") {
            setIsOtherSelected(true);
            setDepartment("");
          } else {
            setIsOtherSelected(false);
            setDepartment(value);
          }
        }}
        className="forms-input">
        <option value="" disabled>
          בחר מחלקה
        </option>
        {departmentList.map((dept, index) => (
          <option key={index} value={dept}>
            {dept}
          </option>
        ))}
        <option value="other">הוסף מחלקה</option>
      </select>
      {isOtherSelected && (
        <div className="new-department">
          <input
            type="text"
            value={newDepartment}
            placeholder="הוסף מחלקה"
            onChange={(event) => setNewDepartment(event.target.value)}
            className="forms-input"
          />
          <button
            type="button"
            onClick={addDepartment}
            className="primary-button extra-create-user-button">
            הוסף מחלקה
          </button>
        </div>
      )}
    </div>
  );
}

export default DepartmentSelect;
