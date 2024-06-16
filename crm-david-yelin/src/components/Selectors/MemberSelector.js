import React from "react";
import Select from "react-select";
import { collection, query, getDocs, where } from "firebase/firestore";
import { db } from "../../firebase";

function MemberSelector({
  members,
  setMembers,
  searchMember,
  setSearchMember,
  selectedMembers,
  setSelectedMembers,
}) {
  const handleSearchMember = async (event) => {
    if (event.target.value.length >= 2) {
      const membersRef = collection(db, "members");
      const q = query(
        membersRef,
        where("fullName", ">=", event.target.value),
        where("fullName", "<=", event.target.value + "\uf8ff")
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
  };

  const handleSelectMember = (value) => {
    const selectedMember = members.find((member) => member.fullName === value);
    if (selectedMember && !selectedMembers.some((member) => member.id === selectedMember.id)) {
      setSelectedMembers((prevMembers) => [...prevMembers, selectedMember]);
      setSearchMember("");
      setMembers([]);
    }
  };

  return (
    <Select
      placeholder="הוסף חבר וועדה"
      className="create-task-input"
      onInputChange={(inputValue) => handleSearchMember({ target: { value: inputValue } })}
      onChange={(e) => handleSelectMember(e.value)}
      options={members.map((member) => ({
        value: member.fullName,
        label: member.fullName,
      }))}
    />
  );
}

export default MemberSelector;
