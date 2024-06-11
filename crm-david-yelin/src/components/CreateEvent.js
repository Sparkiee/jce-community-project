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
} from "firebase/firestore";
import "../styles/CreateEvent.css";

function CreateEvent() {
  const [search, setSearch] = useState("");
  const [members, setMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [eventDetails, setEventDetails] = useState({
    eventName: "",
    eventDate: "",
    eventLocation: "",
    assignees: selectedMembers,
  });

  async function handleSubmit(event) {
    event.preventDefault();
    const assigneeRefs = selectedMembers.map((member) => doc(db, "members", member.id));
    const updatedEventDetails = {
      eventName: eventDetails.eventName,
      eventDate: eventDetails.eventDate,
      eventCreated: serverTimestamp(),
      assignees: assigneeRefs,
      eventStatus: "בתהליך",
    };
    try {
      const docRef = await addDoc(collection(db, "events"), updatedEventDetails);
      console.log("Event recorded with ID: ", docRef.id);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }

  async function handleSearch(event) {
    setSearch(event.target.value);
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
    <div className="container">
      <div className="create-event">
        <h2 className="title">צור אירוע</h2>
        <form className="create-event-form" onSubmit={handleSubmit}>
          <div className="create-event-input-box">
            <input
              type="text"
              placeholder="שם האירוע"
              name="eventName"
              className="create-event-input"
              onChange={(e) => setEventDetails({ ...eventDetails, eventName: e.target.value })}
            />
            <input
              type="date"
              name="eventDate"
              className="create-event-input"
              onChange={(e) => setEventDetails({ ...eventDetails, eventDate: e.target.value })}
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
            <input
              list="members"
              placeholder="חפש חבר וועדה להוספה"
              value={search}
              className="create-event-input"
              onChange={(e) => {
                handleSearch(e);
                handleSelectMember(e.target.value);
              }}
            />
            <datalist id="members">
              {members.map((member, index) => (
                <option key={index} value={member.fullName} />
              ))}
            </datalist>
          </div>

          <br />
          <input type="submit" value="שלח" className="primary-button extra-create-event" />
        </form>
        <h2>Selected Members:</h2>
        <ul>
          {selectedMembers.map((member) => (
            <li key={member.id} onClick={() => handleRemoveMember(member.id)}>
              {member.fullName}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default CreateEvent;
