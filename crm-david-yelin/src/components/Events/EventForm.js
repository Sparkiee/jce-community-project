import React, { useState } from "react";
import { db } from "../../firebase";
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
import MemberSelector from "../Selectors/MemberSelector";
import SelectedMembers from "../Selectors/SelectedMembers";
import Feedback from "./Feedback";
import "../../styles/EventForm.css";

function EventForm() {
  const [search, setSearch] = useState("");
  const [eventExists, setEventExists] = useState(false);
  const [formWarning, setFormWarning] = useState(false);
  const [warningText, setWarningText] = useState("");
  const [members, setMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [eventDetails, setEventDetails] = useState({
    eventName: "",
    eventDate: "",
    eventTime: "",
    eventLocation: "",
    assignees: selectedMembers,
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setWarningText("");
    if (
      !eventDetails.eventName ||
      !eventDetails.eventDate ||
      !eventDetails.eventTime ||
      !eventDetails.eventLocation
    ) {
      setFormWarning(true);
      const warning = "אנא מלא את כל השדות";
      setWarningText(warning);
      return;
    }
    setFormWarning(false);
    const assigneeRefs = selectedMembers.map((member) => `members/${member.id}`);
    const updatedEventDetails = {
      ...eventDetails,
      eventCreated: serverTimestamp(),
      assignees: assigneeRefs,
      eventStatus: "בתהליך",
    };

    try {
      const docRef = await addDoc(collection(db, "events"), updatedEventDetails);
      console.log("Event recorded with ID: ", docRef.id);
      setEventExists(true);

      await Promise.all(
        selectedMembers.map(async (member) => {
          const memberRef = doc(db, "members", member.id);
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
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEventDetails((prevDetails) => ({ ...prevDetails, [name]: value }));
  };

  const handleDateChange = (e) => {
    const date = new Date(e.target.value);
    const formattedDate = date.toLocaleDateString("en-GB").replaceAll("/", "-");
    setEventDetails((prevDetails) => ({ ...prevDetails, eventDate: formattedDate }));
  };

  return (
    <div className="create-event">
      <h2 className="title">צור אירוע</h2>
      <form className="create-event-form" onSubmit={handleSubmit}>
        <div className="create-event-input-box">
          <input
            type="text"
            placeholder="שם האירוע"
            name="eventName"
            className="create-event-input"
            onChange={handleInputChange}
          />
          <input
            type="date"
            name="eventDate"
            className="create-event-input"
            onChange={handleDateChange}
          />
          <input
            type="time"
            name="eventTime"
            className="create-event-input"
            onChange={handleInputChange}
          />
          <input
            type="text"
            placeholder="מיקום האירוע"
            name="eventLocation"
            className="create-event-input"
            onChange={handleInputChange}
          />
          <MemberSelector
            members={members}
            setMembers={setMembers}
            search={search}
            setSearch={setSearch}
            selectedMembers={selectedMembers}
            setSelectedMembers={setSelectedMembers}
          />
          <SelectedMembers
            selectedMembers={selectedMembers}
            onRemoveMember={(id) =>
              setSelectedMembers(selectedMembers.filter((member) => member.id !== id))
            }
          />
        </div>
        <input type="submit" value="צור אירוע" className="primary-button extra-create-event" />
        <Feedback taskExists={eventExists} warningText={warningText} formWarning={formWarning} />
      </form>
    </div>
  );
}

export default EventForm;
