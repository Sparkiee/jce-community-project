import React, { useState } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  getDocs,
  where,
  addDoc,
  doc,
  serverTimestamp,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import "../styles/CreateEvent.css";
import Select from "react-select";
import "../styles/Styles.css";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";

function CreateEvent() {
  const [search, setSearch] = useState("");
  const [eventExists, setEventExists] = useState(false);
  const [formWarning, setFormWarning] = useState(false);
  const [warningText, setWarningText] = useState("");
  const [members, setMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [eventDetails, setEventDetails] = useState({
    eventName: "",
    eventStartDate: "",
    eventEndDate: "",
    eventTime: "",
    eventLocation: "",
    assignees: selectedMembers,
  });

  async function handleSubmit(event) {
    event.preventDefault();
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

    if (await eventExistsAndOpen(eventDetails.eventName)) {
      setFormWarning(true);
      setWarningText("משימה פתוחה עם שם זהה כבר קיימת");
      return;
    }

    if (!eventDetails.eventStartDate) {
      const date = new Date().toDateString();
      const formattedDate = date.toLocaleDateString("he-IL").replaceAll("/", "-");
      eventDetails.eventStartDate = formattedDate;
    }
    const assigneeRefs = selectedMembers.map(
      (member) =>
        // doc(db, "members", member.id)
        `members/${member.id}`
    );
    const updatedEventDetails = {
      eventName: eventDetails.eventName,
      eventStartDate: eventDetails.eventStartDate,
      eventEndDate: eventDetails.eventEndDate,
      eventTime: eventDetails.eventTime,
      eventLocation: eventDetails.eventLocation,
      eventCreated: serverTimestamp(),
      assignees: assigneeRefs,
      eventStatus: "בתהליך",
    };

    try {
      const docRef = await addDoc(collection(db, "events"), updatedEventDetails);
      console.log("Event recorded with ID: ", docRef.id);
      setEventExists(true);

      // Use forEach for side effects
      await Promise.all(
        selectedMembers.map(async (member) => {
          const memberRef = doc(db, "members", member.id);

          // Set the timestamp separately
          await updateDoc(memberRef, {
            Notifications: arrayUnion({
              eventID: docRef,
              message: `הינך משובץ לאירוע חדש ${eventDetails.eventName}`,
            }),
          });
        })
      );

      console.log("Notifications updated for all members.");
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }

  async function eventExistsAndOpen(eventName) {
    const eventQuery = query(
      collection(db, "events"),
      where("eventName", "==", eventName),
      where("eventStatus", "!=", "הסתיים")
    );
    const querySnapshot = await getDocs(eventQuery);
    return !querySnapshot.empty;
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
    <div className="create-event">
      <form className="create-event-form" onSubmit={handleSubmit}>
        <h2 className="title extra-create-event-title">צור אירוע</h2>
        <div className="create-event-input-box">
          <input
            type="text"
            placeholder="שם האירוע (חובה*)"
            name="eventName"
            className="create-event-input"
            onChange={(e) => setEventDetails({ ...eventDetails, eventName: e.target.value })}
          />
          <div className="start-due-date-event">
            <div className="start-date-event">
              <label htmlFor="start">תאריך התחלה</label>
              <input
                type="date"
                name="eventStartDate"
                id="start"
                className="create-event-input"
                onChange={(e) => {
                  const date = new Date(e.target.value);
                  const formattedDate = date.toLocaleDateString("he-IL").replaceAll("/", "-");
                  //change the start date
                  setEventDetails({
                    ...eventDetails,
                    eventStartDate: formattedDate,
                  });
                }}
              />
            </div>
            <div className="due-date-event">
              <label htmlFor="due">תאריך סיום (חובה*)</label>
              <input
                type="date"
                name="eventEndDate"
                id="due"
                className="create-event-input"
                onChange={(e) => {
                  const date = new Date(e.target.value);
                  const formattedDate = date.toLocaleDateString("he-IL").replaceAll("/", "-");
                  //change the due date
                  setEventDetails({
                    ...eventDetails,
                    eventEndDate: formattedDate,
                  });
                }}
              />
            </div>
          </div>
          <label htmlFor="time" className="event-time-label">
            שעת האירוע (חובה*)
          </label>
          <input
            type="time"
            name="eventTime"
            className="create-event-input"
            onChange={(e) => setEventDetails({ ...eventDetails, eventTime: e.target.value })}
          />
          <input
            type="text"
            placeholder="מיקום האירוע"
            name="eventLocation"
            className="create-event-input"
            onChange={(e) =>
              setEventDetails({
                ...eventDetails,
                eventLocation: e.target.value,
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
              label: member.fullName,
            }))}
          />
          <div className="create-task-selected-members">
            {selectedMembers.map((member) => (
              <Stack direction="row" spacing={1}>
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
        <input type="submit" value="צור אירוע" className="primary-button" />
        <div className="feedback-create-event">
          {eventExists && (
            <Alert className="feedback-alert" severity="success">
              אירוע נוצר בהצלחה!
            </Alert>
          )}
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

export default CreateEvent;
