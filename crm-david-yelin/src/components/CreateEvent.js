import React, { useEffect, useState, useRef } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  getDocs,
  where,
  addDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
  arrayUnion
} from "firebase/firestore";
import "../styles/CreateEvent.css";
import Select from "react-select";

function CreateEvent() {
  const [search, setSearch] = useState("");
  const [members, setMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [eventDetails, setEventDetails] = useState({
    eventName: "",
    eventDate: "",
    eventTime: "",
    eventLocation: "",
    assignees: selectedMembers
  });

  // async function handleSubmit(event) {
  //   event.preventDefault();
  //   const assigneeRefs = selectedMembers.map((member) =>
  //     doc(db, "members", member.id)
  //   );
  //   const updatedEventDetails = {
  //     eventName: eventDetails.eventName,
  //     eventDate: eventDetails.eventDate,
  //     eventLocation: eventDetails.eventLocation,
  //     eventCreated: serverTimestamp(),
  //     assignees: assigneeRefs,
  //     eventStatus: "בתהליך"
  //   };
  //   try {
  //     const docRef = await addDoc(
  //       collection(db, "events"),
  //       updatedEventDetails
  //     );
  //     console.log("Event recorded with ID: ", docRef.id);
  //     await Promise.all(selectedMembers.map(async (member) => {
  //       const memberRef = doc(db, "members", member.id);
  //       const notification = {
  //         eventID: docRef.id,
  //         notificationTime: serverTimestamp(),
  //         notificationMessage: "הינך משובץ לאירוע חדש!"
  //       };
  
  //       // Assuming Notifications is an array, use arrayUnion to add a new notification
  //       await updateDoc(memberRef, {
  //         Notifications: arrayUnion(notification)
  //       });
  //     }));
  //   } catch (e) {
  //     console.error("Error adding document: ", e);
  //   }
  // }
  async function handleSubmit(event) {
    event.preventDefault();
    const assigneeRefs = selectedMembers.map((member) =>
      doc(db, "members", member.id)
    );
    const updatedEventDetails = {
      eventName: eventDetails.eventName,
      eventDate: eventDetails.eventDate,
      eventTime: eventDetails.eventTime,
      eventLocation: eventDetails.eventLocation,
      eventCreated: serverTimestamp(),
      assignees: assigneeRefs,
      eventStatus: "בתהליך"
    };
  
    try {
      const docRef = await addDoc(collection(db, "events"), updatedEventDetails);
      console.log("Event recorded with ID: ", docRef.id);
  
      // Use forEach for side effects
      await Promise.all(selectedMembers.map(async (member) => {
        const memberRef = doc(db, "members", member.id);
  
        // Set the timestamp separately
        await updateDoc(memberRef, {
          Notifications: arrayUnion({
            eventID: docRef,
            notificationMessage: `הינך משובץ לאירוע חדש ${eventDetails.eventName}!`,
          })
        });
      }));
  
      console.log("Notifications updated for all members.");
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }

  async function handleSearch(event) {
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
            !selectedMembers.some(
              (selectedMember) => selectedMember.fullName === member.fullName
            )
        );
      setMembers(results);
    } else {
      setMembers([]);
    }
  }

  function handleSelectMember(value) {
    const selectedMember = members.find((member) => member.fullName === value);
    if (
      selectedMember &&
      !selectedMembers.some((member) => member.id === selectedMember.id)
    ) {
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
              onChange={(e) =>
                setEventDetails({ ...eventDetails, eventName: e.target.value })
              }
            />
            <input
              type="date"
              name="eventDate"
              className="create-event-input"
              onChange={(e) =>
                setEventDetails({ ...eventDetails, eventDate: e.target.value })
              }
            />
            <input
            type="time"
            name="eventTime"
            className="create-event-input"
            onChange={(e) => setEventDetails({ ...eventDetails, eventTime: e.target.value})} />
            <input
              type="text"
              placeholder="מיקום האירוע"
              name="eventLocation"
              className="create-event-input"
              onChange={(e) =>
                setEventDetails({
                  ...eventDetails,
                  eventLocation: e.target.value
                })
              }
            />
            {/* <select className="create-event-input" onChange={(e) => {
              console.log("testtttttttttt");
            }}>
              {members.map((member, index) => (
                <option key={index} value={member.fullName}>
                  {member.fullName}
                </option>
              ))}
            </select> */}
            <Select
              placeholder="הוסף חבר וועדה"
              className="create-event-input"
              onInputChange={(inputValue) => {
                handleSearch({ target: { value: inputValue } });
              }}
              onChange={(e) => {
                handleSelectMember(e.value);
              }}
              options={members.map((member) => ({
                value: member.fullName,
                label: member.fullName
              }))}
            />
            <div className="create-event-selected-members">
              {selectedMembers.map((member, index) => (
                <div
                  key={index}
                  className="selected-member"
                  onClick={() => handleRemoveMember(member.id)}
                >
                  {/* <i className="icon-class-name">👤</i> */}
                  <svg
                    className="w-6 h-6 text-gray-800 dark:text-white"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
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
          <input
            type="submit"
            value="שלח"
            className="primary-button extra-create-event"
          />
        </form>
      </div>
    </div>
  );
}

export default CreateEvent;