import React, { useState, useEffect, useCallback } from "react";
import { db } from "../firebase";
import { doc, updateDoc, getDocs, collection, query, where, getDoc } from "firebase/firestore";
import "../styles/EditEvent.css";
import Select from "react-select";
import "../styles/Styles.css";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";

function EditEvent(props) {
  const [search, setSearch] = useState("");
  const [formWarning, setFormWarning] = useState(false);
  const [warningText, setWarningText] = useState("");
  const [members, setMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [event, setEvent] = useState(props.eventDetails || {});

  const fetchMembers = useCallback(async () => {
    const membersRef = collection(db, "members");
    const membersSnapshot = await getDocs(membersRef);
    const membersList = membersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setMembers(membersList);
  }, []);

  useEffect(() => {
    fetchMembers();

    // Use the passed member data to set the selected members
    setSelectedMembers(props.eventDetails?.assigneesData || []);
  }, [fetchMembers, props.eventDetails]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormWarning(false);
    setWarningText("");

    if (!event.eventName || !event.eventEndDate || !event.eventTime || !event.eventLocation) {
      setFormWarning(true);
      let warning = "אנא מלא את כל השדות";
      setWarningText(warning);
      return;
    }
    if (event.eventBudget < 0) {
      setFormWarning(true);
      let warning = "תקציב לא יכול להיות שלילי";
      setWarningText(warning);
      return;
    }

    const assigneeRefs = selectedMembers.map((member) => `members/${member.email}`);
    const updatedEventDetails = {
      ...event,
      assignees: assigneeRefs,
    };

    try {
      const eventRef = doc(db, "events", event.id);
      await updateDoc(eventRef, updatedEventDetails);
      props.onClose();
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  const handleSearchMember = async (event) => {
    if (event.target.value.length >= 2) {
      const membersRef = collection(db, "members");
      const q = query(
        membersRef,
        where("fullName", ">=", search),
        where("fullName", "<=", search + "\uf8ff")
      );
      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(
          (member) =>
            member.privileges >= 1 &&
            !selectedMembers.some((selectedMember) => selectedMember.fullName === member.fullName)
        );
      setMembers(results);
    } else {
      setMembers([]);
    }
  };

  const handleSelectMember = (value) => {
    const selectedMember = members.find((member) => member.fullName === value);
    if (selectedMember && !selectedMembers.some((member) => member.id === selectedMember.id)) {
      setSelectedMembers((prevMembers) => [...prevMembers, selectedMember]);
      setSearch(""); // Clear the search input after selection
      setMembers([]); // Clear the dropdown options
    }
  };

  const handleRemoveMember = (id) => {
    setSelectedMembers(selectedMembers.filter((member) => member.id !== id));
  };

  return (
    <div className="edit-event-style">
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
      <form className="edit-event-form" onSubmit={handleSubmit}>
        <h2 className="title extra-edit-event-title">ערוך אירוע: {event.eventName}</h2>
        <div className="edit-event-input-box">
          <input
            type="text"
            placeholder="שם האירוע (חובה*)"
            name="eventName"
            className="edit-event-input"
            value={event.eventName || ""}
            onChange={(e) => setEvent({ ...event, eventName: e.target.value })}
          />
          <div className="start-due-date-edit-event">
            <div className="start-date-edit-event">
              <label htmlFor="start">תאריך התחלה</label>
              <input
                type="date"
                name="eventStartDate"
                id="start"
                className="edit-event-input"
                value={event.eventStartDate || ""}
                onChange={(e) => {
                  setEvent({
                    ...event,
                    eventStartDate: e.target.value,
                  });
                }}
              />
            </div>
            <div className="due-date-edit-event">
              <label htmlFor="due">תאריך יעד (חובה*)</label>
              <input
                type="date"
                name="eventEndDate"
                id="due"
                className="edit-event-input"
                value={event.eventEndDate || ""}
                onChange={(e) => {
                  setEvent({
                    ...event,
                    eventEndDate: e.target.value,
                  });
                }}
              />
            </div>
          </div>
          <div className="time-budget-edit-event">
            <div className="edit-event-time">
              <label htmlFor="time" className="edit-event-time-label">
                שעת האירוע (חובה*)
              </label>
              <input
                type="time"
                name="eventTime"
                className="edit-event-input"
                value={event.eventTime || ""}
                onChange={(e) => setEvent({ ...event, eventTime: e.target.value })}
              />
            </div>
            <div className="edit-event-budget">
              <label htmlFor="time" className="edit-event-time-label">
                תקציב אירוע
              </label>
              <input
                type="number"
                name="eventBudget"
                placeholder="תקציב משימה"
                className="edit-event-input"
                value={event.eventBudget || 0}
                onChange={(e) => setEvent({ ...event, eventBudget: Number(e.target.value) })}
              />
            </div>
          </div>
          <input
            type="text"
            placeholder="מיקום האירוע"
            name="eventLocation"
            className="edit-event-input"
            value={event.eventLocation || ""}
            onChange={(e) =>
              setEvent({
                ...event,
                eventLocation: e.target.value,
              })
            }
          />
          <Select
            placeholder="הוסף חבר וועדה"
            className="edit-event-input extra-edit-event-input"
            onInputChange={(inputValue) => {
              handleSearchMember({ target: { value: inputValue } });
            }}
            onChange={(e) => {
              handleSelectMember(e.value);
            }}
            options={members.map((member) => ({
              value: member.fullName,
              label: member.fullName,
            }))}
          />
          <div className="edit-task-selected-members">
            {selectedMembers.map((member) => (
              <Stack direction="row" spacing={1} key={member.id}>
                <Chip
                  avatar={<Avatar alt={member.fullName} src={require("../assets/profile.jpg")} />}
                  label={member.fullName}
                  onDelete={() => handleRemoveMember(member.id)}
                  variant="outlined"
                />
              </Stack>
            ))}
          </div>
        </div>
        <input type="submit" value="שמור שינויים" className="primary-button" />
      </form>
      <div className="feedback-edit-event">
        {formWarning && (
          <Alert className="feedback-alert" severity="error">
            {warningText}
          </Alert>
        )}
      </div>
    </div>
  );
}

export default EditEvent;
