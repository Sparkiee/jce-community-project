import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, updateDoc, getDocs, collection, query, where, getDoc, addDoc, serverTimestamp } from "firebase/firestore";
import "../styles/Styles.css";
import "../styles/EditTask.css";
import { Alert } from "@mui/material";
import Select from "react-select";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";

function EditTask(props) {
  const [assignTo, setAssignTo] = useState([]);
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [editedSuccessfully, setEditedSuccessfully] = useState(false);
  const [search, setSearch] = useState("");
  
  const [task, setTask] = useState(props.task);
  const [originalTask, setOriginalTask] = useState(props.task);

  function getUpdatedFields(task, originalTask) {
    const updatedFields = {};
    Object.keys(task).forEach((key) => {
      if (task[key] !== originalTask[key]) {
        updatedFields[key] = { oldValue: originalTask[key], newValue: task[key] };
      }
    });
    return updatedFields;
  }

  const user = JSON.parse(sessionStorage.getItem("user"));

  useEffect(() => {
    fetchEvents();
    fetchMembers();
    loadExistingAssignees();
  }, []);

  const fetchEvents = async () => {
    const eventsSnapshot = await getDocs(collection(db, "events"));
    const eventsList = eventsSnapshot.docs.map((doc) => ({
      value: doc.id,
      label: doc.data().eventName,
    }));
    setEvents(eventsList);
  };

  const fetchMembers = async () => {
    const membersSnapshot = await getDocs(collection(db, "members"));
    const membersList = membersSnapshot.docs.map((doc) => ({
      value: doc.id,
      label: doc.data().fullName,
    }));
    setMembers(membersList);
  };

  const loadExistingAssignees = async () => {
    if (task.assignees) {
      const assigneeEmails = task.assignees.map((email) => email.split("/")[1]);
      const assigneePromises = assigneeEmails.map((email) => getDoc(doc(db, "members", email)));
      const assigneeDocs = await Promise.all(assigneePromises);
      const assigneeData = assigneeDocs
        .map((doc) => (doc.exists() ? doc.data() : null))
        .filter((data) => data);
      setAssignTo(
        assigneeData.map((assignee) => ({ value: assignee.email, label: assignee.fullName }))
      );
    }
  };

  const handleSearchMember = async (inputValue) => {
    setSearch(inputValue);
    if (inputValue.length >= 2) {
      const membersRef = collection(db, "members");
      const q = query(
        membersRef,
        where("fullName", ">=", inputValue),
        where("fullName", "<=", inputValue + "\uf8ff")
      );
      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map((doc) => ({
        value: doc.id,
        label: doc.data().fullName,
      }));
      setMembers(results);
    } else {
      setMembers([]);
    }
  };

  const handleSelectMember = (selectedOption) => {
    if (selectedOption) {
      const selectedMember = members.find((member) => member.value === selectedOption.value);
      if (selectedMember && !assignTo.some((member) => member.value === selectedMember.value)) {
        setAssignTo((prevMembers) => [...prevMembers, selectedMember]);
        setTask({ ...task, assignees: [...task.assignees, "members/" + selectedMember.value] });
        setSearch(""); // Clear the search input after selection
        setMembers([]); // Clear the dropdown options
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if(Object.keys(getUpdatedFields(task, originalTask)).length === 0)
    {
      console.log("No changes were made to the task");
      props.onClose();
      return;
    }
    const taskRef = doc(db, "tasks", task.taskDoc);
    try {
      await updateDoc(taskRef, task);

      const docRef = await addDoc(collection(db, "log_tasks"), {
        task: "tasks/" + task.taskDoc,
        timestamp: serverTimestamp(),
        member: "members/" + user.email,
        updatedFields: getUpdatedFields(task, originalTask),
      });

      setEditedSuccessfully(true);
      setTimeout(() => {
        setEditedSuccessfully(false);
        props.onClose();
        props.onTaskUpdated();
      }, 2000);
    } catch (error) {
      console.error("Error updating task: ", error);
    }
  };

  const handleRemoveMember = (emailToRemove) => {
    console.log(assignTo);
    setAssignTo((prevAssignTo) => prevAssignTo.filter((member) => member.value !== emailToRemove));
    setTask({...task, assignees: task.assignees.filter((email) => email !== "members/" + emailToRemove)})
  };

  return (
    <div className="edit-task-style">
      <div className="action-close" onClick={props.onClose}>
        <svg
          width="24px"
          height="24px"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor">
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
      <form className="edit-task-form" onSubmit={handleSubmit}>
        <h2 className="edit-task-title">עריכת משימה: {task.taskName}</h2>
        <div className="edit-task-input-box">
          <input
            type="text"
            placeholder="שם המשימה (חובה*)"
            className="edit-task-input"
            value={task.taskName}
            onChange={(e) => setTask({ ...task, taskName: e.target.value})}
          />
          <textarea
            placeholder="תיאור המשימה (חובה*)"
            className="edit-task-input"
            value={task.taskDescription}
            onChange={(e) => setTask({ ...task, taskDescription: e.target.value })}
          />
          <div className="edit-task-date-inputs">
            <div className="edit-task-start-date">
              <label htmlFor="start">תאריך התחלה</label>
              <input
                type="date"
                value={task.taskStartDate}
                onChange={(e) => setTask({ ...task, taskStartDate: e.target.value })}
                className="edit-task-input"
              />
            </div>
            <div className="edit-task-due-date">
              <label htmlFor="due">תאריך יעד (חובה*)</label>
              <input
                type="date"
                value={task.taskEndDate}
                onChange={(e) => setTask({ ...task, taskEndDate: e.target.value })}
                id="due"
                className="edit-task-input"
              />
            </div>
          </div>
          <div className="time-budget-task">
            <div className="edit-task-input-time">
              <label htmlFor="time">שעת התחלה</label>
              <input
                type="time"
                className="edit-task-input"
                id="time"
                value={task.taskTime}
                onChange={(e) => setTask({ ...task, taskTime: e.target.value })}
              />
            </div>
            <div className="edit-task-input-budget">
              <label htmlFor="budget">תקציב משימה</label>
              <input
                type="number"
                name="taskBudget"
                placeholder="תקציב משימה"
                className="edit-task-input"
                id="budget"
                value={task.taskBudget}
                onChange={(e) => setTask({ ...task, taskBudget: e.target.value })}
              />
            </div>
          </div>
          <select
            value={task.taskStatus}
            onChange={(e) => setTask({ ...task, taskStatus: e.target.value })}
            className="edit-task-input extra-edit-task-input">
            <option value="טרם החלה">טרם החלה</option>
            <option value="בתהליך">בתהליך</option>
            <option value="הושלמה">הושלמה</option>
          </select>
          <Select
            options={events}
            value={events.find((event) => event.value === task.relatedEvent)}
            onChange={(selectedOption) =>
              setTask({ ...task, relatedEvent: selectedOption ? selectedOption.value : "" })
            }
            placeholder="בחר אירוע קשור (לא חובה)"
            className="edit-task-input extra-edit-task-input"
            isClearable // Allows clearing the selection
          />
          <Select
            placeholder="הוסף חבר וועדה"
            className="create-event-input extra-create-event-input"
            onInputChange={(inputValue) => handleSearchMember(inputValue)}
            onChange={(selectedOption) => handleSelectMember(selectedOption)}
            inputValue={search}
            options={members.map((member) => ({
              value: member.value,
              label: member.label,
            }))}
            noOptionsMessage={() => "לא נמצאו אפשרויות"}
            isClearable
          />
          <div className="edit-task-selected-members">
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {assignTo.map((member) => (
                <Chip
                  key={member.value}
                  avatar={<Avatar alt={member.label} src={require("../assets/profile.jpg")} />}
                  label={member.label}
                  onDelete={() => handleRemoveMember(member.value)}
                  variant="outlined"
                  style={{ margin: "5px" }}
                />
              ))}
            </Stack>
          </div>
          <button type="submit" className="primary-button">
            עדכן פרטים
          </button>
          {editedSuccessfully && (
            <Alert severity="success" className="feedback-alert feedback-edit-task">
              פרטי המשימה עודכנו בהצלחה
            </Alert>
          )}
        </div>
      </form>
    </div>
  );
}

export default EditTask;
