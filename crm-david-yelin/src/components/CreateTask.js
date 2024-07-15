import React, { useState, useEffect } from "react";
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
  getDoc,
} from "firebase/firestore";
import Select from "react-select";
import "../styles/CreateTask.css";
import "../styles/Styles.css";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import { v4 as uuidv4 } from "uuid";

function CreateTask({ onClose, eventId, eventAssignees }) {
  function stringToColor(string) {
    let hash = 0;
    for (let i = 0; i < string.length; i += 1) {
      hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = "#";
    for (let i = 0; i < 3; i += 1) {
      const value = (hash >> (i * 8)) & 0xff;
      color += `00${value.toString(16)}`.slice(-2);
    }
    return color;
  }

  function stringAvatar(name) {
    return {
      sx: {
        bgcolor: stringToColor(name),
      },
      children: `${name.split(" ")[0][0]}${name.split(" ")[1][0]}`,
    };
  }

  const [taskExists, setTaskExists] = useState(false);
  const [searchMember, setSearchMember] = useState("");
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState();
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [user, setUser] = useState(null);
  const [taskDetails, setTaskDetails] = useState({
    taskName: "",
    taskDescription: "",
    taskStartDate: "",
    taskEndDate: "",
    taskTime: "",
    taskBudget: 0,
    taskStatus: "טרם החלה",
    relatedEvent: selectedEvent,
    assignees: selectedMembers,
  });
  const [formWarning, setFormWarning] = useState(false);
  const [warningText, setWarningText] = useState("");
  const [allMembers, setAllMembers] = useState([]);

  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem("user"));
    if (userData) {
      setUser(userData);
      setSelectedMembers((prevMembers) => {
        if (!prevMembers.some((member) => member.email === userData.email)) {
          return [
            ...prevMembers,
            { id: userData.email, fullName: userData.fullName, email: userData.email },
          ];
        }
        return prevMembers;
      });
    } else {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (userData) setUser(userData);
    }

    const fetchAllMembers = async () => {
      const membersRef = collection(db, "members");
      const q = query(membersRef, where("privileges", ">=", 1));
      const querySnapshot = await getDocs(q);
      const allMembersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const filteredMembers = allMembersData.filter((member) => member.email !== userData.email);
      setAllMembers(filteredMembers);
      setMembers(filteredMembers);
    };

    fetchAllMembers();
  }, []);

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
    if (taskDetails.taskBudget < 0) {
      setFormWarning(true);
      let warning = "אנא הכנס תקציב חוקי";
      setWarningText(warning);
      return;
    }
    if (!taskDetails.taskStartDate) {
      const date = new Date();
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Months are 0-indexed
      const day = date.getDate().toString().padStart(2, "0");

      const formattedDate = `${year}-${month}-${day}`;
      taskDetails.taskStartDate = formattedDate;
    }
    const startDate = new Date(taskDetails.taskStartDate);
    const endDate = new Date(taskDetails.taskEndDate);
    if (startDate > endDate) {
      setFormWarning(true);
      setWarningText("תאריך ההתחלה לא יכול להיות לאחר תאריך הסיום");
      return;
    }
    const assigneeRefs = selectedMembers.map((member) => doc(db, "members", member.id));

    let updatedTaskDetails = {
      taskName: taskDetails.taskName,
      taskDescription: taskDetails.taskDescription,
      taskStartDate: taskDetails.taskStartDate,
      taskEndDate: taskDetails.taskEndDate,
      taskTime: taskDetails.taskTime,
      taskBudget: Number(taskDetails.taskBudget),
      taskCreated: serverTimestamp(),
      taskCreator: "members/" + user.email,
      taskStatus: taskDetails.taskStatus,
      relatedEvent: selectedEvent ? `events/${selectedEvent.id}` : null,
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
      const date = new Date();
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");

      const formattedDate = `${year}-${month}-${day}`;
      updatedTaskDetails.taskStartDate = formattedDate;
    }

    try {
      const docRef = await addDoc(collection(db, "tasks"), updatedTaskDetails);
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
              link: `/task/${docRef.id}`,
              id: uuidv4(),
            }),
          });
        })
      );
      setTimeout(() => {
        onClose();
      }, 1000);
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
  async function handleSelectEvent(value) {
    const selectedEvent = events.find((event) => event.eventName === value);

    if (selectedEvent) {
      setSelectedEvent(selectedEvent);
      setEvents([]);
      // Fetch event details to get assignees
      const eventDoc = await getDoc(doc(db, "events", selectedEvent.id));
      if (eventDoc.exists()) {
        const eventData = eventDoc.data();
        const eventAssignees = eventData.assignees || [];

        // Fetch details for each assignee
        const assigneePromises = eventAssignees.map(async (assigneePath) => {
          const memberId = assigneePath.split("/")[1];
          const memberDoc = await getDoc(doc(db, "members", memberId));
          if (memberDoc.exists()) {
            return { id: memberId, ...memberDoc.data() };
          }
          return null;
        });

        const assigneeDetails = await Promise.all(assigneePromises);
        const validAssignees = assigneeDetails.filter((assignee) => assignee !== null);

        // Add event assignees to selectedMembers if they're not already there
        setSelectedMembers((prevMembers) => {
          const newMembers = validAssignees.filter(
            (assignee) => !prevMembers.some((member) => member.id === assignee.id)
          );
          return [...prevMembers, ...newMembers];
        });
      }
    }
  }

  async function handleSearchMember(event) {
    const searchTerm = event.target.value;
    setSearchMember(searchTerm);

    if (searchTerm.length >= 2) {
      const filteredMembers = allMembers.filter(
        (member) =>
          member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !selectedMembers.some((selectedMember) => selectedMember.id === member.id)
      );
      setMembers(filteredMembers);
    } else {
      // When the search input is empty, show all unassigned members
      const unassignedMembers = allMembers.filter(
        (member) => !selectedMembers.some((selectedMember) => selectedMember.id === member.id)
      );
      setMembers(unassignedMembers);
    }
  }

  function handleSelectMember(value) {
    const selectedMember = members.find((member) => member.fullName === value);
    if (selectedMember && !selectedMembers.some((member) => member.id === selectedMember.id)) {
      setSelectedMembers((prevMembers) => [...prevMembers, selectedMember]);
      setMembers((prevMembers) => prevMembers.filter((member) => member.id !== selectedMember.id));
      setSearchMember("");
    }
  }

  function resetAlerts() {
    setTaskExists(false);
    setFormWarning(false);
    setWarningText("");
  }

  const handleRemoveMember = (id) => {
    setSelectedMembers(selectedMembers.filter((member) => member.id !== id));
  };

  const handleRemoveEvent = () => {
    setSelectedEvent("");
  };

  useEffect(() => {
    const fetchEventAndAssignees = async () => {
      if (eventId) {
        // Fetch and set the event
        const eventDoc = await getDoc(doc(db, "events", eventId));
        if (eventDoc.exists()) {
          const eventData = eventDoc.data();
          setSelectedEvent({ id: eventId, eventName: eventData.eventName });
        }

        // Fetch and set the assignees
        if (eventAssignees && eventAssignees.length > 0) {
          const assigneePromises = eventAssignees.map(async (assigneePath) => {
            const email = assigneePath.split("/")[1];
            const memberDoc = await getDocs(
              query(collection(db, "members"), where("email", "==", email))
            );
            if (!memberDoc.empty) {
              const memberData = memberDoc.docs[0].data();
              return {
                id: memberDoc.docs[0].id,
                fullName: memberData.fullName,
                email: memberData.email,
              };
            }
            return null;
          });

          const assigneeDetails = await Promise.all(assigneePromises);
          const validAssignees = assigneeDetails.filter((assignee) => assignee !== null);
          setSelectedMembers(validAssignees);
        }
      }
    };

    fetchEventAndAssignees();
  }, [eventId, eventAssignees]);

  return (
    <div className="create-task media-style">
      <div className="action-close" onClick={onClose}>
        <svg
          width="24px"
          height="24px"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor">
          <line
            x1="17"
            y1="7"
            x2="7"
            y2="17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="7"
            y1="7"
            x2="17"
            y2="17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <form className="create-task-form media-form" onSubmit={handleSubmit}>
        <h2 className="title extra-create-task-title">משימה חדשה</h2>
        <div className="create-task-input-box">
          <input
            type="text"
            placeholder="שם המשימה (חובה*)"
            name="taskName "
            className="create-task-input"
            onChange={(e) => {
              setTaskDetails({ ...taskDetails, taskName: e.target.value });
              resetAlerts();
            }}
          />
          <textarea
            placeholder="תיאור המשימה (חובה*)"
            name="taskDescription"
            className="create-task-input text-area"
            onChange={(e) => {
              setTaskDetails({
                ...taskDetails,
                taskDescription: e.target.value,
              });
              resetAlerts();
            }}
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
                  //change the start date
                  {
                    setTaskDetails({
                      ...taskDetails,
                      taskStartDate: e.target.value,
                    });
                    resetAlerts();
                  }
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
                  {
                    setTaskDetails({
                      ...taskDetails,
                      taskEndDate: e.target.value,
                    });
                    resetAlerts();
                  }
                }}
              />
            </div>
          </div>
          <div className="time-budget-task">
            <div className="create-task-time-input">
              <label htmlFor="time">שעת סיום (חובה*)</label>
              <input
                type="time"
                name="taskTime"
                id="time"
                className="create-task-input"
                min="0"
                onChange={(e) => {
                  setTaskDetails({ ...taskDetails, taskTime: e.target.value });
                  resetAlerts();
                }}
              />
            </div>
            <div className="create-task-budget-input">
              <label htmlFor="budget">תקציב משימה</label>
              <input
                type="number"
                name="taskBudget"
                placeholder="תקציב משימה"
                id="budget"
                className="create-task-input"
                onChange={(e) => {
                  setTaskDetails({ ...taskDetails, taskBudget: e.target.value });
                  resetAlerts();
                }}
              />
            </div>
          </div>
          <select
            onChange={(e) => {
              setTaskDetails({ ...taskDetails, taskStatus: e.target.value });
              resetAlerts();
            }}
            className="create-task-input extra-create-task-status-input">
            <option value="טרם החלה">טרם החלה</option>
            <option value="בתהליך">בתהליך</option>
            <option value="הושלמה">הושלמה</option>
          </select>
          <Select
            name="relatedEvent"
            placeholder="חפש אירוע לשייך למשימה"
            className="create-task-input extra-create-task-input"
            onInputChange={(inputValue) => {
              handleSearchEvent({ target: { value: inputValue } });
            }}
            onChange={(e) => {
              handleSelectEvent(e.value);
              resetAlerts();
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
            placeholder="חפש או בחר חבר לשייך למשימה"
            className="create-task-input extra-create-task-input"
            onInputChange={(inputValue) => {
              handleSearchMember({ target: { value: inputValue } });
            }}
            onChange={(e) => {
              handleSelectMember(e.value);
              resetAlerts();
            }}
            options={members.map((member) => ({
              value: member.fullName,
              label: member.fullName,
            }))}
          />
          <div className="create-task-selected-members">
            {selectedMembers.map((member, index) => (
              <Stack key={index} direction="row" spacing={1}>
                <Chip
                  key={member.id}
                  avatar={<Avatar {...stringAvatar(member.fullName)} />}
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
