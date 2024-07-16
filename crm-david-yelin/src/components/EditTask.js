import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  doc,
  updateDoc,
  getDocs,
  collection,
  query,
  where,
  getDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import "../styles/Styles.css";
import "../styles/EditTask.css";
import { Alert } from "@mui/material";
import Select from "react-select";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";

function EditTask(props) {
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

  const [search, setSearch] = useState("");
  const [taskExists, setTaskExists] = useState(false);
  const [searchMember, setSearchMember] = useState("");
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState();
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [formWarning, setFormWarning] = useState(false);
  const [warningText, setWarningText] = useState("");
  const [editedSuccessfully, setEditedSuccessfully] = useState(false);
  const [taskDetails, setTask] = useState(props.task || {});
  const [originalTask, setOriginalTask] = useState(props.task || {});
  const [user, setUser] = useState(null);
  const [allMembers, setAllMembers] = useState([]);

  function getUpdatedFields(taskDetails, originalTask) {
    const updatedFields = {};
    Object.keys(taskDetails).forEach((key) => {
      if (taskDetails[key] !== originalTask[key]) {
        updatedFields[key] = { oldValue: originalTask[key], newValue: taskDetails[key] };
      }
    });
    return updatedFields;
  }

  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem("user"));
    if (userData) setUser(userData);
    else {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (userData) setUser(userData);
    }
  }, []);

  useEffect(() => {
    const fetchAssignees = async () => {
      if (
        selectedMembers.length === 0 &&
        taskDetails.assignees &&
        taskDetails.assignees.length > 0
      ) {
        const newSelectedMembers = [];
        for (const member of taskDetails.assignees) {
          let memberEmail;
          if (typeof member === "string") {
            memberEmail = member.split("/")[1];
          } else if (member && member.email) {
            memberEmail = member.email;
          }

          if (memberEmail) {
            const memberRef = doc(db, "members", memberEmail);
            try {
              const docSnap = await getDoc(memberRef);
              if (docSnap.exists()) {
                newSelectedMembers.push({ id: docSnap.id, ...docSnap.data(), ...member });
              } else {
                console.log("No such document for member email:", memberEmail);
              }
            } catch (error) {
              console.error("Error getting document:", error);
            }
          } else {
            console.error("Member object doesn't have an email:", member);
          }
        }
        setSelectedMembers(newSelectedMembers);
      }
    };

    const fetchRelatedEvent = async () => {
      if (taskDetails.relatedEvent) {
        const eventRef = doc(db, "events", taskDetails.relatedEvent.split("/")[1]);
        try {
          const docSnap = await getDoc(eventRef);
          if (docSnap.exists()) {
            setSelectedEvent({ id: docSnap.id, ...docSnap.data() });
          }
        } catch (error) {
          console.error("Error fetching related event:", error);
        }
      }
    };

    const fetchAllMembers = async () => {
      try {
        const membersRef = collection(db, "members");
        const q = query(membersRef, where("privileges", ">=", 1));
        const querySnapshot = await getDocs(q);
        const allMembersData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const filteredMembers = allMembersData.filter(
          (member) => !selectedMembers.some((selectedMember) => selectedMember.id === member.id)
        );
        setAllMembers(filteredMembers);
        setMembers(filteredMembers);
      } catch (error) {
        console.error("Error fetching all members:", error);
      }
    };

    const initializeData = async () => {
      await fetchAssignees();
      await fetchRelatedEvent();
      await fetchAllMembers();
    };

    initializeData();
  }, []);

  useEffect(() => {
    const updateMembers = () => {
      const filteredMembers = allMembers.filter(
        (member) => !selectedMembers.some((selectedMember) => selectedMember.id === member.id)
      );
      setMembers(filteredMembers);
    };

    updateMembers();
  }, [selectedMembers, allMembers]);

  async function handleSearchMember(event) {
    const searchTerm = event.target.value;
    setSearch(searchTerm);

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    delete taskDetails.assignTo;
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

    delete taskDetails.assignees;

    const assigneeRefs = selectedMembers.map((member) => `members/${member.id}`);
    setTask({ ...taskDetails, assignees: assigneeRefs });
    try {
      const taskRef = doc(db, "tasks", taskDetails.taskDoc);
      await updateDoc(taskRef, {
        taskName: taskDetails.taskName,
        taskDescription: taskDetails.taskDescription,
        taskStartDate: taskDetails.taskStartDate,
        taskEndDate: taskDetails.taskEndDate,
        taskTime: taskDetails.taskTime,
        taskBudget: Number(taskDetails.taskBudget) || 0,
        taskStatus: taskDetails.taskStatus,
        assignees: assigneeRefs,
        relatedEvent: selectedEvent ? `events/${selectedEvent.id}` : "",
        taskCreator: taskDetails.taskCreator || "",
      });
      setEditedSuccessfully(true);
      setTimeout(() => {
        setEditedSuccessfully(false);
        props.onClose();
        props.onTaskUpdated();
      }, 2000);
    } catch (error) {
      console.error("Error updating task: ", error);
    }
    const taskRef = doc(db, "tasks", taskDetails.taskDoc);
    try {
      await updateDoc(taskRef, taskDetails);

      const docRef = await addDoc(collection(db, "log_tasks"), {
        task: "tasks/" + taskDetails.taskDoc,
        timestamp: serverTimestamp(),
        member: "members/" + user.email,
        updatedFields: getUpdatedFields(taskDetails, originalTask),
      });

      setEditedSuccessfully(true);
      setTimeout(() => {
        setEditedSuccessfully(false);
        props.onClose();
        props.onTaskUpdated();
      }, 2000);
    } catch (error) {
      console.error("Error updating task: ", error);
    }
  };

  function resetAlerts() {
    setFormWarning(false);
    setWarningText("");
    setEditedSuccessfully(false);
  }

  const handleRemoveMember = (id) => {
    const memberToRemove = selectedMembers.find((member) => member.id === id);
    if (memberToRemove) {
      setMembers((prevMembers) => [...prevMembers, memberToRemove]);
      setSelectedMembers(selectedMembers.filter((member) => member.id !== id));
    }
  };

  const handleRemoveEvent = () => {
    setSelectedEvent("");
  };

  return (
    <div className="edit-task-style media-style">
      <div className="action-close" onClick={props.onClose}>
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
      <form className="edit-task-form media-form" onSubmit={handleSubmit}>
        <h2 className="edit-task-title">עריכת משימה: {taskDetails.taskName}</h2>
        <div className="edit-task-input-box">
          <input
            type="text"
            placeholder="שם המשימה (חובה*)"
            className="edit-task-input"
            value={taskDetails.taskName}
            onChange={(e) => {
              setTask({ ...taskDetails, taskName: e.target.value });
              resetAlerts();
            }}
          />
          <textarea
            placeholder="תיאור המשימה (חובה*)"
            className="edit-task-input"
            value={taskDetails.taskDescription}
            onChange={(e) => {
              setTask({ ...taskDetails, taskDescription: e.target.value });
              resetAlerts();
            }}
          />
          <div className="edit-task-date-inputs">
            <div className="edit-task-start-date">
              <label htmlFor="start">תאריך התחלה</label>
              <input
                type="date"
                value={taskDetails.taskStartDate}
                onChange={(e) => {
                  setTask({ ...taskDetails, taskStartDate: e.target.value });
                  resetAlerts();
                }}
                className="edit-task-input"
              />
            </div>
            <div className="edit-task-due-date">
              <label htmlFor="due">תאריך יעד (חובה*)</label>
              <input
                type="date"
                value={taskDetails.taskEndDate}
                onChange={(e) => {
                  setTask({ ...taskDetails, taskEndDate: e.target.value });
                  resetAlerts();
                }}
                id="due"
                className="edit-task-input"
              />
            </div>
          </div>
          <div className="time-budget-task">
            <div className="edit-task-input-time">
              <label htmlFor="time">שעת התחלה</label>
              <input
                type="time"
                className="edit-task-input"
                id="time"
                value={taskDetails.taskTime}
                onChange={(e) => {
                  setTask({ ...taskDetails, taskTime: e.target.value });
                  resetAlerts();
                }}
              />
            </div>
            <div className="edit-task-input-budget">
              <label htmlFor="budget">תקציב משימה</label>
              <input
                type="number"
                name="taskBudget"
                placeholder="תקציב משימה"
                className="edit-task-input"
                id="budget"
                value={taskDetails.taskBudget}
                onChange={(e) => {
                  setTask({ ...taskDetails, taskBudget: Number(e.target.value) });
                  resetAlerts();
                }}
              />
            </div>
          </div>
          <select
            value={taskDetails.taskStatus}
            onChange={(e) => {
              setTask({ ...taskDetails, taskStatus: e.target.value });
              resetAlerts();
            }}
            className="edit-task-input extra-edit-task-input">
            <option value="טרם החלה">טרם החלה</option>
            <option value="בתהליך">בתהליך</option>
            <option value="הושלמה">הושלמה</option>
          </select>
          <Select
            name="relatedEvent"
            placeholder="חפש אירוע לשייך למשימה"
            className="edit-task-input extra-edit-task-input"
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
          <div className="edit-task-selected-task">
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
            className="create-event-input extra-create-event-input"
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
          <div className="edit-task-selected-members">
            {selectedMembers.map((member, index) => (
              <Stack key={index} direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  avatar={
                    <Avatar
                      {...(member.profileImage
                        ? { src: member.profileImage }
                        : stringAvatar(member.fullName))}
                    />
                  }
                  label={member.fullName}
                  onDelete={() => handleRemoveMember(member.id)}
                  variant="outlined"
                />
              </Stack>
            ))}
          </div>
          <button type="submit" className="primary-button">
            עדכן פרטים
          </button>
          {editedSuccessfully && (
            <Alert severity="success" className="feedback-alert feedback-edit-task media-alert2">
              פרטי המשימה עודכנו בהצלחה
            </Alert>
          )}
          {formWarning && (
            <Alert severity="error" className="feedback-alert feedback-edit-task media-alert2">
              {warningText}
            </Alert>
          )}
        </div>
      </form>
    </div>
  );
}

export default EditTask;
