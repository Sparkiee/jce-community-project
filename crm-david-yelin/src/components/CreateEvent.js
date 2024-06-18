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
    //add start date and due date
    eventTime: "",
    eventLocation: "",
    assignees: selectedMembers,
  });

  async function handleSubmit(event) {
    event.preventDefault();
    setWarningText("");
    if (
      !eventDetails.eventName ||
      !eventDetails.eventEndDate ||
      !eventDetails.eventTime ||
      !eventDetails.eventLocation
    ) {
      setFormWarning(true);
      // Alert the user or set an error state here
      const target = document.querySelector(".warning");
      let warning = "אנא מלא את כל השדות";
      // console.log({warningText} + "\nשם האירוע")
      // if (!eventDetails.eventName) warning += "\nשם האירוע חסר";
      // if (!eventDetails.eventDate) warning += "\nתאריך האירוע חסר";
      // if (!eventDetails.eventTime) warning += "\nשעת האירוע חסר";
      // if (!eventDetails.eventLocation) warning += "\nמיקום האירוע חסר";
      setWarningText(warning);
      return; // Exit the function to prevent further execution
    }
    if (!eventDetails.eventStartDate) {
      const date = new Date().toDateString();
      const formattedDate = date.toLocaleDateString("he-IL").replaceAll("/", "-");
      eventDetails.eventStartDate = formattedDate;
    }
    setFormWarning(false);
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
              notificationMessage: `הינך משובץ לאירוע חדש ${eventDetails.eventName}`,
            }),
          });
        })
      );

      console.log("Notifications updated for all members.");
    } catch (e) {
      console.error("Error adding document: ", e);
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
            placeholder="שם האירוע"
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
                  setEventDetails({ ...eventDetails, eventStartDate: formattedDate });
                }}
              />
            </div>
            <div className="due-date-event">
              <label htmlFor="due">תאריך סיום</label>
              <input
                type="date"
                name="eventEndDate"
                id="due"
                className="create-event-input"
                onChange={(e) => {
                  const date = new Date(e.target.value);
                  const formattedDate = date.toLocaleDateString("he-IL").replaceAll("/", "-");
                  //change the due date
                  setEventDetails({ ...eventDetails, eventEndDate: formattedDate });
                }}
              />
            </div>
          </div>
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
          <div className="create-event-selected-members">
            {selectedMembers.map((member, index) => (
              <div
                key={index}
                className="selected-member"
                onClick={() => handleRemoveMember(member.id)}>
                <svg
                  className="w-6 h-6 text-gray-800 dark:text-white"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24">
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 12h4m-2 2v-4M4 18v-1a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Zm8-10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  />
                </svg>
                <div className="selected-member-text">{member.fullName}</div>
              </div>
            ))}
          </div>
        </div>
        <input type="submit" value="צור אירוע" className="primary-button" />
        <div className="feedback">
          {eventExists && <p style={{ color: "green" }}>אירוע נוצר בהצלחה</p>}
        </div>
        <div className="feedback warning">{formWarning && <p>{warningText}</p>}</div>
      </form>
    </div>
  );
}

export default CreateEvent;
