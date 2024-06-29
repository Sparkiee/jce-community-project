import React, { useState, useEffect, useCallback } from "react";
import { db } from "../firebase";
import {
  doc,
  updateDoc,
  getDocs,
  collection,
  query,
  where,
  getDoc,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
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
  const [eventExists, setEventExists] = useState(false);

  const [selectedMembers, setSelectedMembers] = useState([]);

  const [eventDetails, setEvent] = useState(props.eventDetails || {});
  const [originalEvent, setOriginalEvent] = useState(props.eventDetails || {});

  useEffect(() => {
    if (selectedMembers.length == 0 && eventDetails.assignees) {
      const selected = eventDetails.assignees.map((member) => {
        return member.split("/")[1];
      });
      selected.forEach((member) => {
        const memberRef = doc(db, "members", member);
        getDoc(memberRef).then((doc) => {
          if (doc.exists()) {
            setSelectedMembers((prevMembers) => [...prevMembers, { id: doc.id, ...doc.data() }]);
          }
        });
      });
    }
  }, []);

  function getUpdatedFields(eventDetails, originalEvent) {
    const updatedFields = {};
    Object.keys(eventDetails).forEach((key) => {
      if (eventDetails[key] !== originalEvent[key]) {
        updatedFields[key] = { oldValue: originalEvent[key], newValue: eventDetails[key] };
      }
    });
    return updatedFields;
  }

  const user = JSON.parse(sessionStorage.getItem("user"));

  async function eventExistsAndOpen(eventName) {
    const eventQuery = query(
      collection(db, "events"),
      where("eventName", "==", eventName),
      where("eventStatus", "!=", "הסתיים")
    );
    const querySnapshot = await getDocs(eventQuery);
    return !querySnapshot.empty;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormWarning(false);
    setEventExists(false);
    setWarningText("");
    if (
      !eventDetails.eventName ||
      !eventDetails.eventEndDate ||
      !eventDetails.eventTime ||
      !eventDetails.eventLocation
    ) {
      setFormWarning(true);
      let warning = "אנא מלא את כל השדות";
      setWarningText(warning);
      return; // Exit the function to prevent further execution
    }
    if (eventDetails.eventBudget < 0) {
      setFormWarning(true);
      let warning = "אנא הכנס תקציב חוקי";
      setWarningText(warning);
      return;
    }

    if (
      eventDetails.eventName !== originalEvent.eventName &&
      (await eventExistsAndOpen(eventDetails.eventName))
    ) {
      setFormWarning(true);
      setWarningText("משימה פתוחה עם שם זהה כבר קיימת");
      return;
    }

    if (!eventDetails.eventStartDate) {
      const date = new Date();
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");

      const formattedDate = `${year}-${month}-${day}`;
      eventDetails.eventStartDate = formattedDate;
    }

    delete eventDetails.assignees;
    delete eventDetails.assigneesData;

    const assigneeRefs = selectedMembers.map((member) => `members/${member.id}`);
    setEvent({ ...eventDetails, assignees: assigneeRefs });

    try {
      const eventRef = doc(db, "events", eventDetails.id);
      await updateDoc(eventRef, {
        eventName: eventDetails.eventName,
        eventStartDate: eventDetails.eventStartDate,
        eventEndDate: eventDetails.eventEndDate,
        eventTime: eventDetails.eventTime,
        eventLocation: eventDetails.eventLocation,
        eventBudget: eventDetails.eventBudget,
        eventCreator: eventDetails.eventCreator,
        eventCreated: eventDetails.eventCreated,
        eventStatus: eventDetails.eventStatus, 
        assignees: assigneeRefs,
        
      });

      const docRef = await addDoc(collection(db, "log_events"), {
        event: "events/" + eventDetails.id,
        timestamp: serverTimestamp(),
        member: "members/" + user.email,
        updatedFields: getUpdatedFields(eventDetails, originalEvent)
      });

      props.onClose();
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  }

  async function handleSearchMember(event) {
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
          ...doc.data()
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
  }

  function handleSelectMember(value) {
    const selectedMember = members.find((member) => member.fullName === value);
    if (selectedMember && !selectedMembers.some((member) => member.id === selectedMember.id)) {
      setSelectedMembers((prevMembers) => [...prevMembers, selectedMember]);
      setSearch(""); // Clear the search input after selection
      setMembers([]); // Clear the dropdown options
    }
  }

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
        <h2 className="title extra-edit-event-title">ערוך אירוע: {eventDetails.eventName}</h2>
        <div className="edit-event-input-box">
          <input
            type="text"
            placeholder="שם האירוע (חובה*)"
            name="eventName"
            className="edit-event-input"
            value={eventDetails.eventName || ""}
            onChange={(e) => setEvent({ ...eventDetails, eventName: e.target.value })}
          />
          <div className="start-due-date-edit-event">
            <div className="start-date-edit-event">
              <label htmlFor="start">תאריך התחלה</label>
              <input
                type="date"
                name="eventStartDate"
                id="start"
                className="edit-event-input"
                value={eventDetails.eventStartDate || ""}
                onChange={(e) => {
                  setEvent({
                    ...eventDetails,
                    eventStartDate: e.target.value
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
                value={eventDetails.eventEndDate || ""}
                onChange={(e) => {
                  setEvent({
                    ...eventDetails,
                    eventEndDate: e.target.value
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
                value={eventDetails.eventTime || ""}
                onChange={(e) => setEvent({ ...eventDetails, eventTime: e.target.value })}
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
                value={eventDetails.eventBudget || 0}
                onChange={(e) => setEvent({ ...eventDetails, eventBudget: Number(e.target.value) })}
              />
            </div>
          </div>
          <input
            type="text"
            placeholder="מיקום האירוע"
            name="eventLocation"
            className="edit-event-input"
            value={eventDetails.eventLocation || ""}
            onChange={(e) =>
              setEvent({
                ...eventDetails,
                eventLocation: e.target.value
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
              label: member.fullName
            }))}
          />
          <div className="edit-event-selected-members">
            {selectedMembers.map((member, index) => (
              <Stack direction="row" spacing={1} key={index}>
                <Chip
                  key={member.id}
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
