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
import Select from "react-select";
import "../styles/CreateTask.css";
import "../styles/Styles.css";
import Alert from "@mui/material/Alert";

function CreateTask() {
  const [taskExists, setTaskExists] = useState(false);
  const [searchMember, setSearchMember] = useState("");
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState();
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [taskDetails, setTaskDetails] = useState({
    taskName: "",
    taskDescription: "",
    taskStartDate: "",
    taskEndDate: "",
    taskTime: "",
    relatedEvent: selectedEvent,
    assignees: selectedMembers,
  });
  const [formWarning, setFormWarning] = useState(false);
  const [warningText, setWarningText] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setFormWarning(false);
    setTaskExists(false);
    setWarningText("");
    if (
      !taskDetails.taskName ||
      !taskDetails.taskDescription ||
      !taskDetails.taskEndDate ||
      !taskDetails.taskTime
    ) {
      setFormWarning(true);
      let warning = "אנא מלא את כל השדות";
      setWarningText(warning);
      return;
    }
    if (!taskDetails.taskStartDate) {
      const date = new Date().toDateString();
      const formattedDate = date.toLocaleDateString("he-IL").replaceAll("/", "-");
      taskDetails.taskStartDate = formattedDate;
    }
    const assigneeRefs = selectedMembers.map((member) => doc(db, "members", member.id));

    let updatedTaskDetails = {
      taskName: taskDetails.taskName,
      taskDescription: taskDetails.taskDescription,
      taskStartDate: taskDetails.taskStartDate,
      taskEndDate: taskDetails.taskEndDate,
      taskTime: taskDetails.taskTime,
      taskCreated: serverTimestamp(),
      taskStatus: "בתהליך",
    };

    // Conditionally add targetEvent if it exists and is not null
    if (selectedEvent && selectedEvent.id) {
      updatedTaskDetails.relatedEvent = "events/" + selectedEvent.id;
    }

    if (await taskExistsAndOpen(updatedTaskDetails.taskName, updatedTaskDetails.relatedEvent)) {
      setFormWarning(true);
      if (updatedTaskDetails.relatedEvent)
        setWarningText("משימה פתוחה עם שם זהה תחת אירוע זה כבר קיימת");
      else setWarningText("קיימת משימה כללית פתוחה עם שם זהה (ללא אירוע)");
      return;
    }

    // Conditionally add assignees if the array is not empty
    if (assigneeRefs.length > 0) {
      updatedTaskDetails.assignees = selectedMembers.map((member) => `members/${member.id}`);
    }

    if (!updatedTaskDetails.taskStartDate) {
      const date = new Date().toDateString();
      const formattedDate = date.toLocaleDateString("he-IL").replaceAll("/", "-");
      updatedTaskDetails.taskStartDate = formattedDate;
    }

    try {
      const docRef = await addDoc(collection(db, "tasks"), updatedTaskDetails);
      console.log("Task recorded with ID: ", docRef.id);
      setTaskExists(true);

      // Use forEach for side effects
      await Promise.all(
        selectedMembers.map(async (member) => {
          const memberRef = doc(db, "members", member.id);

          // Set the timestamp separately
          await updateDoc(memberRef, {
            Notifications: arrayUnion({
              taskID: docRef,
              message: `נוספה לך משימה חדשה: ${taskDetails.taskName}`,
            }),
          });
        })
      );
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  }

  async function taskExistsAndOpen(taskName, relatedEvent) {
    let taskQuery;

    if (!relatedEvent) {
      taskQuery = query(
        collection(db, "tasks"),
        where("taskName", "==", taskName),
        where("taskStatus", "!=", "הושלמה")
      );
    } else {
      taskQuery = query(
        collection(db, "tasks"),
        where("relatedEvent", "==", relatedEvent),
        where("taskName", "==", taskName),
        where("taskStatus", "!=", "הושלמה")
      );
    }
    const querySnapshot = await getDocs(taskQuery);
    console.log(!querySnapshot.empty);
    return !querySnapshot.empty;
  }

  async function handleSearchEvent(event) {
    if (event.target.value.length >= 2) {
      const eventRef = collection(db, "events");
      const q = query(
        eventRef,
        where("eventStatus", "!=", "הסתיים"),
        where("eventName", ">=", event.target.value),
        where("eventName", "<=", event.target.value + "\uf8ff")
      );
      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
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
    if (selectedMember && !selectedMembers.some((member) => member.id === selectedMember.id)) {
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
    <div className="create-task">
      <form className="create-task-form" onSubmit={handleSubmit}>
        <h2 className="title extra-create-task-title">משימה חדשה</h2>
        <div className="create-task-input-box">
          <input
            type="text"
            placeholder="שם המשימה"
            name="taskName "
            className="create-task-input"
            onChange={(e) => setTaskDetails({ ...taskDetails, taskName: e.target.value })}
          />
          <textarea
            placeholder="תיאור המשימה"
            name="taskDescription"
            className="create-task-input text-area"
            onChange={(e) =>
              setTaskDetails({
                ...taskDetails,
                taskDescription: e.target.value,
              })
            }
          />
          <div className="start-due-date-task">
            <div className="start-date-task">
              <label htmlFor="start">תאריך התחלה</label>
              <input
                type="date"
                name="taskStartDate"
                id="start"
                className="create-task-input"
                onChange={(e) => {
                  const date = new Date(e.target.value);
                  const formattedDate = date.toLocaleDateString("he-IL").replaceAll("/", "-");
                  //change the start date
                  setTaskDetails({
                    ...taskDetails,
                    taskStartDate: formattedDate,
                  });
                }}
              />
            </div>
            <div className="due-date-task">
              <label htmlFor="due">תאריך סיום</label>
              <input
                type="date"
                name="taskEndDate"
                id="due"
                className="create-task-input"
                onChange={(e) => {
                  const date = new Date(e.target.value);
                  const formattedDate = date.toLocaleDateString("he-IL").replaceAll("/", "-");
                  //change the due date
                  setTaskDetails({
                    ...taskDetails,
                    taskEndDate: formattedDate,
                  });
                }}
              />
            </div>
          </div>
          <input
            type="time"
            name="taskTime"
            className="create-task-input"
            onChange={(e) => setTaskDetails({ ...taskDetails, taskTime: e.target.value })}
          />
          <Select
            name="relatedEvent"
            placeholder="שייך לאירוע"
            className="create-task-input extra-create-task-input"
            onInputChange={(inputValue) => {
              handleSearchEvent({ target: { value: inputValue } });
            }}
            onChange={(e) => {
              handleSelectEvent(e.value);
            }}
            options={events.map((event) => ({
              value: event.eventName,
              label: event.eventName,
            }))}
          />
          <div className="create-task-selected-task">
            {selectedEvent && (
              <div className="selected-task" onClick={() => handleRemoveEvent()}>
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
                  xmlSpace="preserve">
                  <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                  <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
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
                <p className="selected-task-text">{selectedEvent.eventName}</p>
              </div>
            )}
          </div>
          <Select
            placeholder="הוסף חבר ועדה"
            className="create-task-input extra-create-task-input"
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
          <div className="create-task-selected-members">
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
        <input type="submit" value="צור משימה" className="primary-button" />
        <div className="feedback-create-task">
          {taskExists && (
            <Alert className="feedback-alert" severity="success">
              משימה חדשה התווספה בהצלחה!
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

export default CreateTask;