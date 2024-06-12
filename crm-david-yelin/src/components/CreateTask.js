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
  arrayUnion
} from "firebase/firestore";
import Select from "react-select";
import "../styles/CreateTask.css";

function CreateTask() {
  const [searchMember, setSearchMember] = useState("");
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState();
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [taskDetails, setTaskDetails] = useState({
    taskName: "",
    taskDescription: "",
    taskDate: "",
    taskTime: "",
    relatedEvent: selectedEvent,
    assignees: selectedMembers
  });
  async function handleSubmit(event) {}
  async function handleSearchEvent(event) {
    if (event.target.value.length >= 2) {
      const eventRef = collection(db, "events");
      const q = query(
        eventRef,
        where("eventName", ">=", event.target.value),
        where("eventName", "<=", event.target.value + "\uf8ff")
      );
      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setEvents(results);
    } else setEvents([]);
  }
  async function handleSearchMember(event) {
    if (event.target.value.length >= 2) {
      const membersRef = collection(db, "members");
      const q = query(
        membersRef,
        where("fullName", ">=", searchMember),
        where("fullName", "<=", searchMember + "\uf8ff")
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
  function handleSelectEvent(value) {
    const selectedEvent = events.find((event) => event.eventName === value);
    console.log(selectedEvent);

    if (selectedEvent) {
      setSelectedEvent(selectedEvent);
      setEvents([]); // Clear the dropdown options
    }
  }
  function handleSelectMember(value) {
    const selectedMember = members.find((member) => member.fullName === value);
    if (
      selectedMember &&
      !selectedMembers.some((member) => member.id === selectedMember.id)
    ) {
      setSelectedMembers((prevMembers) => [...prevMembers, selectedMember]);
      setSearchMember(""); // Clear the search input after selection
      setMembers([]); // Clear the dropdown options
    }
  }

  const handleRemoveMember = (id) => {
    setSelectedMembers(selectedMembers.filter((member) => member.id !== id));
  };

  const handleRemoveEvent = () => {
    setSelectedEvent("");
  };
  return (
    <div className="container">
      <div className="create-task">
        <h2 className="title">צור משימה</h2>
        <form className="create-task-form" onSubmit={handleSubmit}>
          <div className="create-task-input-box">
            <input
              type="text"
              placeholder="שם המשימה"
              name="taskName "
              className="create-task-input"
              onChange={(e) =>
                setTaskDetails({ ...taskDetails, taskName: e.target.value })
              }
            />
            <textarea
              placeholder="תיאור המשימה"
              name="taskDescription"
              className="create-task-input text-area"
              onChange={(e) =>
                setTaskDetails({
                  ...taskDetails,
                  taskDescription: e.target.value
                })
              }
            />
            <input
              type="date"
              name="taskDate"
              className="create-task-input"
              onChange={(e) =>
                setTaskDetails({ ...taskDetails, taskDate: e.target.value })
              }
            />
            <input
              type="time"
              name="taskTime"
              className="create-task-input"
              onChange={(e) =>
                setTaskDetails({ ...taskDetails, taskTime: e.target.value })
              }
            />
            <Select
              name="relatedEvent"
              placeholder="שייך לאירוע"
              className="create-task-input"
              onInputChange={(inputValue) => {
                handleSearchEvent({ target: { value: inputValue } });
              }}
              onChange={(e) => {
                handleSelectEvent(e.value);
              }}
              options={events.map((event) => ({
                value: event.eventName,
                label: event.eventName
              }))}
            />
            <div className="create-event-selected-event">
              {selectedEvent && (
                <div
                  className="selected-event"
                  onClick={() => handleRemoveEvent()}
                >
                  {/* SVG */}
                  <svg
                    fill="#000000"
                    width="20px"
                    height="20px"
                    viewBox="-6.43 0 122.88 122.88"
                    version="1.1"
                    id="Layer_1"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    style={{ enableBackground: "new 0 0 110.01 122.88" }}
                    xmlSpace="preserve"
                  >
                    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                    <g
                      id="SVGRepo_tracerCarrier"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></g>
                    <g id="SVGRepo_iconCarrier">
                      <style type="text/css">{`.st0{fill-rule:evenodd;clip-rule:evenodd;}`}</style>
                      <g>
                        <path
                          className="st0"
                          d="M1.87,14.69h22.66L24.5,14.3V4.13C24.5,1.86,26.86,0,29.76,0c2.89,0,5.26,1.87,5.26,4.13V14.3l-0.03,0.39 h38.59l-0.03-0.39V4.13C73.55,1.86,75.91,0,78.8,0c2.89,0,5.26,1.87,5.26,4.13V14.3l-0.03,0.39h24.11c1.03,0,1.87,0.84,1.87,1.87 v19.46c0,1.03-0.84,1.87-1.87,1.87H1.87C0.84,37.88,0,37.04,0,36.01V16.55C0,15.52,0.84,14.69,1.87,14.69L1.87,14.69z M31.35,83.53 c-2.27-1.97-2.52-5.41-0.55-7.69c1.97-2.28,5.41-2.53,7.69-0.56l12.45,10.8l20.31-20.04c2.13-2.12,5.59-2.11,7.71,0.02 c2.12,2.13,2.11,5.59-0.02,7.71L55.02,97.37c-2,1.99-5.24,2.14-7.41,0.26L31.35,83.53L31.35,83.53L31.35,83.53z M0.47,42.19h109.08 c0.26,0,0.46,0.21,0.46,0.47l0,0v79.76c0,0.25-0.21,0.46-0.46,0.46l-109.08,0c-0.25,0-0.46-0.21-0.46-0.46V42.66 C0,42.4,0.21,42.19,0.47,42.19L0.47,42.19L0.47,42.19z M8.84,50.58h93.84c0.52,0,0.94,0.45,0.94,0.94v62.85 c0,0.49-0.45,0.94-0.94,0.94H8.39c-0.49,0-0.94-0.42-0.94-0.94v-62.4c0-1.03,0.84-1.86,1.86-1.86L8.84,50.58L8.84,50.58z M78.34,29.87c2.89,0,5.26-1.87,5.26-4.13V15.11l-0.03-0.41l-10.45,0l-0.03,0.41v10.16c0,2.27,2.36,4.13,5.25,4.13L78.34,29.87 L78.34,29.87z M29.29,29.87c2.89,0,5.26-1.87,5.26-4.13V15.11l-0.03-0.41l-10.46,0l-0.03,0.41v10.16c0,2.27,2.36,4.13,5.25,4.13 V29.87L29.29,29.87z"
                        />
                      </g>
                    </g>
                  </svg>

                  <div className="selected-event-text">
                    {selectedEvent.eventName}
                  </div>
                </div>
              )}
            </div>
            <Select
              placeholder="הוסף חבר ועדה"
              className="create-task-input"
              onInputChange={(inputValue) => {
                handleSearchMember({ target: { value: inputValue } });
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
            value="צור משימה"
            className="primary-button extra-create-event"
          />
        </form>
      </div>
    </div>
  );
}

export default CreateTask;
