import React, { useState, useEffect, useCallback } from "react";
import { db } from "../firebase";
import { doc, updateDoc, getDocs, collection, query, where, getDoc } from "firebase/firestore";
import "../styles/CreateEvent.css";
import Select from "react-select";
import "../styles/Styles.css";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";

function EditEvent(props) {
  const [search, setSearch] = useState("");
  const [formWarning, setFormWarning] = useState(false);
  const [warningText, setWarningText] = useState("");
  const [members, setMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [event, setEvent] = useState(props.eventDetails);
  const eventDetails = props.eventDetails;

  const fetchMembers = useCallback(async () => {
    const membersRef = collection(db, "members");
    const membersSnapshot = await getDocs(membersRef);
    const membersList = membersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
    setMembers(membersList);

    // Fetch full names of the assigned members
    const assignedMembers = await Promise.all(
      eventDetails.assignees.map(async (assigneePath) => {
        const email = assigneePath.split("/")[1];
        const memberDoc = await getDoc(doc(membersRef, email));
        if (memberDoc.exists()) {
          return { id: email, ...memberDoc.data() };
        }
        return null;
      })
    );

    setSelectedMembers(assignedMembers.filter((member) => member !== null));
  }, [eventDetails.assignees]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

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

    const assigneeRefs = selectedMembers.map((member) => `members/${member.id}`);
    const updatedEventDetails = {
      ...event,
      assignees: assigneeRefs
    };

    console.log("Updated Event Details:", updatedEventDetails); // Print the event object to the console

    try {
      const eventRef = doc(db, "events", eventDetails.id);
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
    <div className="create-event">
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
      <form className="create-event-form" onSubmit={handleSubmit}>
        <h2 className="title extra-create-event-title">ערוך אירוע</h2>
        <div className="create-event-input-box">
          <input
            type="text"
            placeholder="שם האירוע (חובה*)"
            name="eventName"
            className="create-event-input"
            value={event.eventName}
            onChange={(e) => setEvent({ ...event, eventName: e.target.value })}
          />
          <div className="start-due-date-event">
            <div className="start-date-event">
              <label htmlFor="start">תאריך התחלה</label>
              <input
                type="date"
                name="eventStartDate"
                id="start"
                className="create-event-input"
                value={event.eventStartDate}
                onChange={(e) => {
                  setEvent({
                    ...event,
                    eventStartDate: e.target.value
                  });
                }}
              />
            </div>
            <div className="due-date-event">
              <label htmlFor="due">תאריך יעד (חובה*)</label>
              <input
                type="date"
                name="eventEndDate"
                id="due"
                className="create-event-input"
                value={event.eventEndDate}
                onChange={(e) => {
                  setEvent({
                    ...event,
                    eventEndDate: e.target.value
                  });
                }}
              />
            </div>
          </div>
          <div className="time-budget-event">
            <div className="event-time">
              <label htmlFor="time" className="event-time-label">
                שעת האירוע (חובה*)
              </label>
              <input
                type="time"
                name="eventTime"
                className="create-event-input"
                value={event.eventTime}
                onChange={(e) => setEvent({ ...event, eventTime: e.target.value })}
              />
            </div>
            <div className="event-budget">
              <label htmlFor="time" className="event-time-label">
                תקציב אירוע
              </label>
              <input
                type="number"
                name="eventBudget"
                placeholder="תקציב משימה"
                className="create-event-input"
                value={event.eventBudget}
                onChange={(e) => setEvent({ ...event, eventBudget: Number(e.target.value) })}
              />
            </div>
          </div>
          <input
            type="text"
            placeholder="מיקום האירוע"
            name="eventLocation"
            className="create-event-input"
            value={event.eventLocation}
            onChange={(e) =>
              setEvent({
                ...event,
                eventLocation: e.target.value
              })
            }
          />
          <Select
            placeholder="הוסף חבר וועדה"
            className="create-event-input extra-create-event-input"
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
          <div className="create-task-selected-members">
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
        <div className="feedback-create-event">
          {formWarning && (
            <Alert className="feedback-alert" severity="error">
              {warningText}
            </Alert>
          )}
        </div>
      </form>
    </div>
  );
}

export default EditEvent;
