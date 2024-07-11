import React, { useState, useEffect } from "react";
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
  arrayUnion
} from "firebase/firestore";
import "../styles/CreateEvent.css";
import Select from "react-select";
import "../styles/Styles.css";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Checkbox from "@mui/material/Checkbox";
import { v4 as uuidv4 } from "uuid";

function CreateEvent(props) {
  const [search, setSearch] = useState("");
  const [eventExists, setEventExists] = useState(false);
  const [formWarning, setFormWarning] = useState(false);
  const [warningText, setWarningText] = useState("");
  const [members, setMembers] = useState([]);
  const [user, setUser] = useState(null);

  const [selectedMembers, setSelectedMembers] = useState([]);
  const [eventDetails, setEventDetails] = useState({
    eventName: "",
    eventStartDate: "",
    eventEndDate: "",
    eventTime: "",
    eventBudget: 0,
    eventLocation: "",
    eventStatus: "טרם החל",
    assignees: selectedMembers
  });

  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem("user"));
    if (userData) setUser(userData);
    else {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (userData) setUser(userData);
    }

    async function fetchMembers() {
      const membersRef = collection(db, "members");
      const querySnapshot = await getDocs(membersRef);
      const allMembers = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setMembers(allMembers.filter(member => member.privileges > 0));
    }
    fetchMembers();
  }, []);

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
      return;
    }
    if (eventDetails.eventBudget < 0) {
      setFormWarning(true);
      let warning = "אנא הכנס תקציב חוקי";
      setWarningText(warning);
      return;
    }
    if (await eventExistsAndOpen(eventDetails.eventName)) {
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
    const startDate = new Date(eventDetails.eventStartDate);
    const endDate = new Date(eventDetails.eventEndDate);
    if (startDate > endDate) {
      setFormWarning(true);
      setWarningText("תאריך ההתחלה לא יכול להיות לאחר תאריך הסיום");
      return;
    }

    const assigneeRefs = selectedMembers.map((member) => `members/${member.id}`);
    const updatedEventDetails = {
      eventName: eventDetails.eventName,
      eventStartDate: eventDetails.eventStartDate,
      eventEndDate: eventDetails.eventEndDate,
      eventTime: eventDetails.eventTime,
      eventLocation: eventDetails.eventLocation,
      eventBudget: Number(eventDetails.eventBudget),
      eventCreated: serverTimestamp(),
      assignees: assigneeRefs,
      eventCreator: "members/" + user.email,
      eventStatus: eventDetails.eventStatus
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
              eventID: docRef.id,
              message: `הינך משובץ לאירוע חדש: ${eventDetails.eventName}`,
              link: `/event/${docRef.id}`,
              id: uuidv4()
            })
          });
        })
      );
      setTimeout(() => {
        props.onClose();
      }, 1000);
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
    setSearch(event.target.value);
    if (event.target.value.length >= 2) {
      const membersRef = collection(db, "members");
      const q = query(membersRef, where("fullName", ">=", event.target.value), where("fullName", "<=", event.target.value + "\uf8ff"));
      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(
          (member) =>
            member.privileges >= 1 &&
            !selectedMembers.some((selectedMember) => selectedMember.id === member.id)
        );
      setMembers(results);
    } else {
      const membersRef = collection(db, "members");
      const querySnapshot = await getDocs(membersRef);
      const allMembers = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setMembers(allMembers.filter(member => member.privileges > 0));
    }
  }

  function resetAlerts() {
    setEventExists(false);
    setFormWarning(false);
    setWarningText("");
  }

  const handleRemoveMember = (id) => {
    setSelectedMembers(selectedMembers.filter((member) => member.id !== id));
  };

  const handleSelectChange = (selectedOptions) => {
    setSelectedMembers(selectedOptions ? selectedOptions.map(option => option.value) : []);
  };

  const customOption = ({ innerRef, innerProps, data }) => (
    <div ref={innerRef} {...innerProps} style={{ display: 'flex', alignItems: 'center' }}>
      <Checkbox
        checked={selectedMembers.some((selectedMember) => selectedMember.id === data.value.id)}
        style={{ marginRight: 8 }}
      />
      {data.label}
    </div>
  );

  return (
    <div className="create-event">
      <div className="action-close" onClick={props.onClose}>
        <svg width="24px" height="24px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
          <line x1="17" y1="7" x2="7" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="7" y1="7" x2="17" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <form className="create-event-form" onSubmit={handleSubmit}>
        <h2 className="title extra-create-event-title">צור אירוע</h2>
        <div className="create-event-input-box">
          <input
            type="text"
            placeholder="שם האירוע (חובה*)"
            name="eventName"
            className="create-event-input"
            onChange={(e) => {
              setEventDetails({ ...eventDetails, eventName: e.target.value });
              resetAlerts();
            }}
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
                  //change the start date
                  setEventDetails({
                    ...eventDetails,
                    eventStartDate: e.target.value
                  });
                  resetAlerts();
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
                onChange={(e) => {
                  //change the due date
                  setEventDetails({
                    ...eventDetails,
                    eventEndDate: e.target.value
                  });
                  resetAlerts();
                }}
              />
            </div>
          </div>
          <div className="time-budget-create-event">
            <div className="create-event-time">
              <label htmlFor="time" className="create-event-time-label">
                שעת האירוע (חובה*)
              </label>
              <input
                type="time"
                name="eventTime"
                className="create-event-input"
                onChange={(e) => {
                  setEventDetails({ ...eventDetails, eventTime: e.target.value });
                  resetAlerts();
                }}
              />
            </div>
            <div className="create-event-budget">
              <label htmlFor="time" className="create-event-budget-label">
                תקציב אירוע
              </label>
              <input
                type="number"
                name="eventBudget"
                placeholder="תקציב משימה"
                className="create-event-input"
                onChange={(e) => {
                  setEventDetails({ ...eventDetails, eventBudget: Number(e.target.value) });
                  resetAlerts();
                }}
              />
            </div>
          </div>
          <input
            type="text"
            placeholder="מיקום האירוע (חובה*)"
            name="eventLocation"
            className="create-event-input"
            onChange={(e) => {
              setEventDetails({
                ...eventDetails,
                eventLocation: e.target.value
              });
              resetAlerts();
            }}
          />
          <select
            onChange={(e) => {
              setEventDetails({ ...eventDetails, eventStatus: e.target.value });
              resetAlerts();
            }}
            className="create-event-input extra-create-event-status-input">
            <option value="טרם החל">טרם החל</option>
            <option value="בתהליך">בתהליך</option>
            <option value="הסתיים">הסתיים</option>
          </select>
          <div className="create-event-select-container">
            <Select
              placeholder="הוסף חבר וועדה"
              className="create-event-input extra-create-event-input"
              onInputChange={(inputValue) => {
                handleSearchMember({ target: { value: inputValue } });
              }}
              onChange={handleSelectChange}
              options={members.map((member) => ({
                value: member,
                label: member.fullName
              }))}
              isMulti
              closeMenuOnSelect={false}
              components={{ Option: customOption }}
              value={selectedMembers.map(member => ({
                value: member,
                label: member.fullName
              }))}
            />
          </div>
          <div className="create-task-selected-members">
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
