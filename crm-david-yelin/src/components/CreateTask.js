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
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";

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
            placeholder="שם המשימה (חובה*)"
            name="taskName "
            className="create-task-input"
            onChange={(e) => setTaskDetails({ ...taskDetails, taskName: e.target.value })}
          />
          <textarea
            placeholder="תיאור המשימה (חובה*)"
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
              <label htmlFor="due">תאריך סיום (חובה*)</label>
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
              <Stack direction="row" spacing={1}>
                <Chip
                  label={selectedEvent.eventName}
                  onDelete={() => handleRemoveEvent()}
                  variant="outlined"
                />
              </Stack>
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
            {selectedMembers.map((member) => (
              <Stack direction="row" spacing={1}>
                <Chip
                  key={member.id}
                  avatar={<Avatar alt={member.fullName} src={require("../assets/profile.jpg")} />}
                  label={member.fullName}
                  onDelete={() => handleRemoveMember(member.id)}
                  variant="outlined"
                />
              </Stack>
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
