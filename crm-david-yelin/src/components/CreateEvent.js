import React, { useState } from "react";
import { db } from "../firebase";
import { collection, query, getDocs, where, addDoc, doc, serverTimestamp } from "firebase/firestore";

function CreateEvent() {
  const [search, setSearch] = useState("");
  const [members, setMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [eventDetails, setEventDetails] = useState({
    eventName: "",
    eventDate: "",
    eventLocation: "",
    assignees: selectedMembers
  });

  async function handleSubmit(event) {
    event.preventDefault();
    const assigneeRefs = selectedMembers.map(member => doc(db, 'members', member.id));
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
    <div>
      <h1>צור אירוע</h1>
      <form onSubmit={handleSubmit}>
        <div>
          שם האירוע:
          <input
            type="text"
            name="eventName"
            onChange={(e) =>
              setEventDetails({ ...eventDetails, eventName: e.target.value })
            }
          />
        </div>
        <br />
        <div>
          תאריך האירוע:
          <input
            type="date"
            name="eventDate"
            onChange={(e) =>
              setEventDetails({ ...eventDetails, eventDate: e.target.value })
            }
          />
        </div>
        <br />
        <div>
          מיקום האירוע:
          <input
            type="text"
            name="eventLocation"
            onChange={(e) =>
              setEventDetails({
                ...eventDetails,
                eventLocation: e.target.value
              })
            }
          />
        </div>
        <br />
        <div>
          <input
            list="members"
            value={search}
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
        <input type="submit" value="שלח" />
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
  );
}

export default CreateEvent;
