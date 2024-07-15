import React, { useState, useEffect } from "react";
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
  serverTimestamp,
} from "firebase/firestore";
import "../styles/EditEvent.css";
import Select from "react-select";
import "../styles/Styles.css";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";

function EditEvent(props) {
  function stringToColor(string) {
    let hash = 0;
    for (let i = 0; i < string.length; i += 1) {
      hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = "#";
    for (let i = 0; i < 3; i += 1) {
      const value = (hash >> (i * 8)) & 0xff;
      color += `00${value.toString(16)}`.slice(-2);
    }
    return color;
  }

  function stringAvatar(name) {
    return {
      sx: {
        bgcolor: stringToColor(name),
      },
      children: `${name.split(" ")[0][0]}${name.split(" ")[1][0]}`,
    };
  }

  const [search, setSearch] = useState("");
  const [formWarning, setFormWarning] = useState(false);
  const [warningText, setWarningText] = useState("");
  const [members, setMembers] = useState([]);
  const [eventExists, setEventExists] = useState(false);
  const [editedSuccessfully, setEditedSuccessfully] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [eventDetails, setEvent] = useState(props.eventDetails || {});
  const [originalEvent, setOriginalEvent] = useState(props.eventDetails || {});
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem("user"));
    if (userData) setUser(userData);
    else {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (userData) setUser(userData);
    }
  }, []);

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
    const fetchAllMembers = async () => {
      const membersRef = collection(db, "members");
      const q = query(membersRef, where("privileges", ">=", 1));
      const querySnapshot = await getDocs(q);
      const allMembersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const filteredMembers = allMembersData.filter(
        (member) => !selectedMembers.some((selectedMember) => selectedMember.id === member.id)
      );
      setAllMembers(filteredMembers);
      setMembers(filteredMembers);
    };

    fetchAllMembers();
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
    const startDate = new Date(eventDetails.eventStartDate);
    const endDate = new Date(eventDetails.eventEndDate);
    if (startDate > endDate) {
      setFormWarning(true);
      setWarningText("תאריך ההתחלה לא יכול להיות לאחר תאריך הסיום");
      return;
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
        eventBudget: Number(eventDetails.eventBudget),
        eventCreator: eventDetails.eventCreator,
        eventCreated: eventDetails.eventCreated,
        eventStatus: eventDetails.eventStatus,
        assignees: assigneeRefs,
      });

      const docRef = await addDoc(collection(db, "log_events"), {
        event: "events/" + eventDetails.id,
        timestamp: serverTimestamp(),
        member: "members/" + user.email,
        updatedFields: getUpdatedFields(eventDetails, originalEvent),
      });

      setEditedSuccessfully(true);
      setTimeout(() => {
        setEditedSuccessfully(false);
        props.onClose();
      }, 2000);
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  }

  async function handleSearchMember(event) {
    const searchTerm = event.target.value;
    setSearch(searchTerm);

    if (searchTerm.length >= 2) {
      const filteredMembers = allMembers.filter(
        (member) =>
          member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !selectedMembers.some((selectedMember) => selectedMember.id === member.id)
      );
      setMembers(filteredMembers);
    } else {
      // When the search input is empty, show all unassigned members
      const unassignedMembers = allMembers.filter(
        (member) => !selectedMembers.some((selectedMember) => selectedMember.id === member.id)
      );
      setMembers(unassignedMembers);
    }
  }

  function handleSelectMember(value) {
    const selectedMember = members.find((member) => member.fullName === value);
    if (selectedMember && !selectedMembers.some((member) => member.id === selectedMember.id)) {
      setSelectedMembers((prevMembers) => [...prevMembers, selectedMember]);
      setMembers((prevMembers) => prevMembers.filter((member) => member.id !== selectedMember.id));
      setSearch("");
    }
  }

  function resetAlerts() {
    setFormWarning(false);
    setWarningText("");
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
            onChange={(e) => {
              setEvent({ ...eventDetails, eventName: e.target.value });
              resetAlerts();
            }}
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
                    eventStartDate: e.target.value,
                  });
                  resetAlerts();
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
                    eventEndDate: e.target.value,
                  });
                  resetAlerts();
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
                onChange={(e) => {
                  setEvent({ ...eventDetails, eventTime: e.target.value });
                  resetAlerts();
                }}
              />
            </div>
            <div className="edit-event-budget">
              <label htmlFor="time" className="edit-event-budget-label">
                תקציב אירוע
              </label>
              <input
                type="number"
                name="eventBudget"
                placeholder="תקציב משימה"
                className="edit-event-input"
                value={eventDetails.eventBudget || 0}
                onChange={(e) => {
                  setEvent({ ...eventDetails, eventBudget: Number(e.target.value) });
                  resetAlerts();
                }}
              />
            </div>
          </div>
          <input
            type="text"
            placeholder="מיקום האירוע (חובה*)"
            name="eventLocation"
            className="edit-event-input"
            value={eventDetails.eventLocation || ""}
            onChange={(e) => {
              setEvent({
                ...eventDetails,
                eventLocation: e.target.value,
              });
              resetAlerts();
            }}
          />
          <select
            value={eventDetails.eventStatus || "טרם החל"}
            onChange={(e) => {
              setEvent({ ...eventDetails, eventStatus: e.target.value });
              resetAlerts();
            }}
            className="edit-event-input extra-edit-event-status-input">
            <option value="טרם החל">טרם החל</option>
            <option value="בתהליך">בתהליך</option>
            <option value="הסתיים">הסתיים</option>
          </select>
          <Select
            placeholder="חפש או בחר חבר לשיוך לאירוע"
            className="edit-event-input extra-edit-event-input"
            onInputChange={(inputValue) => {
              handleSearchMember({ target: { value: inputValue } });
            }}
            onChange={(e) => {
              handleSelectMember(e.value);
              resetAlerts();
            }}
            options={members.map((member) => ({
              value: member.fullName,
              label: member.fullName,
            }))}
          />
          <div className="edit-event-selected-members">
            {selectedMembers.map((member, index) => (
              <Stack direction="row" spacing={1} key={index}>
                <Chip
                  key={member.id}
                  avatar={<Avatar {...stringAvatar(member.fullName)} />}
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
        {editedSuccessfully && (
          <Alert className="feedback-alert" severity="success">
            השינויים נשמרו בהצלחה
          </Alert>
        )}
      </div>
    </div>
  );
}

export default EditEvent;
