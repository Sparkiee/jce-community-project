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
import EventSelector from "../Selectors/EventSelector";
import MemberSelector from "../Selectors/MemberSelector";
import SelectedEvent from "../Selectors/SelectedEvent";
import SelectedMembers from "../Selectors/SelectedMembers";
import Feedback from "./Feedback";
import "../../styles/TaskForm.css";

function TaskForm() {
  const [taskExists, setTaskExists] = useState(false);
  const [searchMember, setSearchMember] = useState("");
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [taskDetails, setTaskDetails] = useState({
    taskName: "",
    taskDescription: "",
    taskDate: "",
    taskTime: "",
    relatedEvent: selectedEvent,
    assignees: selectedMembers,
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    const assigneeRefs = selectedMembers.map((member) => doc(db, "members", member.id));

    let updatedTaskDetails = {
      ...taskDetails,
      taskCreated: serverTimestamp(),
      taskStatus: "בתהליך",
    };

    if (selectedEvent && selectedEvent.id) {
      updatedTaskDetails.relatedEvent = "events/" + selectedEvent.id;
    }

    if (assigneeRefs.length > 0) {
      updatedTaskDetails.assignees = selectedMembers.map((member) => `members/${member.id}`);
    }

    try {
      const docRef = await addDoc(collection(db, "tasks"), updatedTaskDetails);
      console.log("Task recorded with ID: ", docRef.id);
      setTaskExists(true);

      await Promise.all(
        selectedMembers.map(async (member) => {
          const memberRef = doc(db, "members", member.id);
          await updateDoc(memberRef, {
            Notifications: arrayUnion({
              taskID: docRef.id,
              message: `נוספה לך משימה חדשה: ${taskDetails.taskName}`,
            }),
          });
        })
      );
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTaskDetails((prevDetails) => ({ ...prevDetails, [name]: value }));
  };

  const handleDateChange = (e) => {
    const date = new Date(e.target.value);
    const formattedDate = date.toLocaleDateString("en-GB").replaceAll("/", "-");
    setTaskDetails((prevDetails) => ({ ...prevDetails, taskDate: formattedDate }));
  };

  return (
    <div className="create-task">
      <h2 className="title">צור משימה</h2>
      <form className="create-task-form" onSubmit={handleSubmit}>
        <div className="create-task-input-box">
          <input
            type="text"
            placeholder="שם המשימה"
            name="taskName"
            className="create-task-input"
            onChange={handleInputChange}
          />
          <textarea
            placeholder="תיאור המשימה"
            name="taskDescription"
            className="create-task-input text-area"
            onChange={handleInputChange}
          />
          <input
            type="date"
            name="taskDate"
            className="create-task-input"
            onChange={handleDateChange}
          />
          <input
            type="time"
            name="taskTime"
            className="create-task-input"
            onChange={handleInputChange}
          />
          <EventSelector
            events={events}
            setEvents={setEvents}
            selectedEvent={selectedEvent}
            setSelectedEvent={setSelectedEvent}
          />
          <SelectedEvent
            selectedEvent={selectedEvent}
            onRemoveEvent={() => setSelectedEvent(null)}
          />
          <MemberSelector
            members={members}
            setMembers={setMembers}
            searchMember={searchMember}
            setSearchMember={setSearchMember}
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
        <input type="submit" value="צור משימה" className="primary-button extra-create-event" />
        <Feedback taskExists={taskExists} />
      </form>
    </div>
  );
}

export default TaskForm;
