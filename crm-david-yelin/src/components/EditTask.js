import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, updateDoc, getDocs, collection, query, where, getDoc } from "firebase/firestore";
import "../styles/Styles.css";
import "../styles/EditTask.css";
import { Alert } from "@mui/material";
import Select from "react-select";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";

function EditTask({ task, onClose, onTaskUpdated }) {
  const [taskName, setTaskName] = useState(task.taskName);
  const [taskDescription, setTaskDescription] = useState(task.taskDescription);
  const [relatedEvent, setRelatedEvent] = useState(task.relatedEvent ? task.relatedEvent.split("/")[1] : ""); // Initialize relatedEvent correctly
  const [taskStartDate, setTaskStartDate] = useState(task.taskStartDate.split("T")[0]);
  const [taskEndDate, setTaskEndDate] = useState(task.taskEndDate.split("T")[0]);
  const [taskTime, setTaskTime] = useState(task.taskTime);
  const [taskStatus, setTaskStatus] = useState(task.taskStatus);
  const [assignTo, setAssignTo] = useState([]);
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [editedSuccessfully, setEditedSuccessfully] = useState(false);
  const [search, setSearch] = useState("");

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
      const assigneeData = assigneeDocs.map((doc) => (doc.exists() ? doc.data() : null)).filter((data) => data);
      setAssignTo(assigneeData.map((assignee) => ({ value: assignee.email, label: assignee.fullName })));
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
        setSearch(""); // Clear the search input after selection
        setMembers([]); // Clear the dropdown options
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const taskRef = doc(db, "tasks", task.taskDoc);
    try {
      await updateDoc(taskRef, {
        taskName,
        taskDescription,
        relatedEvent: relatedEvent ? `events/${relatedEvent}` : "", // Ensure relatedEvent is in the correct format
        taskStartDate,
        taskEndDate,
        taskTime,
        taskStatus,
        assignees: assignTo.map((user) => `members/${user.value}`),
      });

      setEditedSuccessfully(true);
      setTimeout(() => {
        setEditedSuccessfully(false);
        onClose();
        onTaskUpdated();
      }, 2000);
    } catch (error) {
      console.error("Error updating task: ", error);
    }
  };

  const handleRemoveMember = (emailToRemove) => {
    setAssignTo((prevAssignTo) => prevAssignTo.filter((member) => member.value !== emailToRemove));
  };

  return (
    <div className="edit-task-style">
      <form className="edit-task-form" onSubmit={handleSubmit}>
        <h2 className="edit-task-title">עריכת משימה: {task.taskName}</h2>
        <div className="edit-task-input-box">
          <input
            type="text"
            placeholder="שם המשימה (חובה*)"
            className="edit-task-input"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
          />
          <textarea
            placeholder="תיאור המשימה (חובה*)"
            className="edit-task-input"
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
          />
          <Select
            options={events}
            value={events.find((event) => event.value === relatedEvent)}
            onChange={(selectedOption) => setRelatedEvent(selectedOption ? selectedOption.value : "")}
            placeholder="בחר אירוע קשור (לא חובה)"
            className="edit-task-input extra-edit-task-input"
            isClearable // Allows clearing the selection
          />
          <div className="edit-task-date-inputs">
            <div className="edit-task-start-date">
              <label htmlFor="start">תאריך התחלה</label>
              <input
                type="date"
                value={taskStartDate}
                onChange={(e) => setTaskStartDate(e.target.value)}
                className="edit-task-input"
              />
            </div>
            <div className="edit-task-due-date">
              <label htmlFor="due">תאריך יעד (חובה*)</label>
              <input
                type="date"
                value={taskEndDate}
                onChange={(e) => setTaskEndDate(e.target.value)}
                id="due"
                className="edit-task-input"
              />
            </div>
          </div>
          <input
            type="time"
            className="edit-task-input"
            value={taskTime}
            onChange={(e) => setTaskTime(e.target.value)}
          />
          <select
            value={taskStatus}
            onChange={(e) => setTaskStatus(e.target.value)}
            className="edit-task-input extra-edit-task-input"
          >
            <option value="טרם החל">טרם החל</option>
            <option value="בתהליך">בתהליך</option>
            <option value="הושלם">הושלם</option>
          </select>
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
          {editedSuccessfully && (
            <Alert severity="success" className="feedback-alert feedback-edittask">
              פרטי המשימה עודכנו בהצלחה
            </Alert>
          )}
          <button type="submit" className="primary-button extra-reg">
            עדכן פרטים
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditTask;
