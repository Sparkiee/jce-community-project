import React, { useState } from "react";
import { db } from "../firebase";
import { collection, query, getDocs, where, orderBy } from "firebase/firestore";

function CreateEvent() {
  const [search, setSearch] = useState("");
  const [members, setMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);

  async function handleSubmit(event) {
    event.preventDefault();
    console.log("Event submitted");
  }

  async function handleSearch(event) {
    setSearch(event.target.value);
    if (event.target.value.length >= 2) {
      const membersRef = collection(db, "members");
      const q = query(
        membersRef,
        where("fullName", ">=", search),
        where("fullName", "<=", search + "\uf8ff"),
        orderBy("fullName")
      );
      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(member => member.privileges >= 1);
      setMembers(results);
    } else {
      setMembers([]);
    }
  }

  function handleSelectMember(member) {
    setSelectedMembers([...selectedMembers, member]);
  }

  return (
    <div>
      <h1>צור אירוע</h1>
      <form onSubmit={handleSubmit}>
        <div>
          שם האירוע:
          <input type="text" name="eventName" />
        </div>
        <br />
        <div>
          תאריך האירוע:
          <input type="date" name="eventDate" />
        </div>
        <br />
        <div>
          מיקום האירוע:
          <input type="text" name="eventLocation" />
        </div>
        <br />
        <div>
          Search Assignees:
          <input type="text" value={search} onChange={handleSearch} />
          <br />
          <select onChange={(e) => handleSelectMember(e.target.value)}>
            {members.map((member, index) => (
              <option key={index} value={member.id}>
                {member.firstName} {member.lastName}
              </option>
            ))}
          </select>
          <ul>
            {selectedMembers.map((member, index) => (
              <li key={index}>
                {member.firstName} {member.lastName}
              </li>
            ))}
          </ul>
        </div>
        <br />
        <input type="submit" value="שלח" />
      </form>
      <h2>Selected Members:</h2>
      <ul>
        {selectedMembers.map((member) => (
          <li key={member.id}>{member.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default CreateEvent;
