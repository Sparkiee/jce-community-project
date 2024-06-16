import "../styles/Event.css";
import { db } from "../firebase";
import { collection, query, getDocs, where } from "firebase/firestore";
import { useState, useEffect } from "react";

function Event(props) {
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [tasks, setTasks] = useState([]);

  // async function fetchTasks() {
  //   try {
  //     const tasksRef = collection(db, "tasks");

  //     // console.log(props.event.docRef);
  //     // Create the query
  //     const q = query(tasksRef, where("relatedEvent", "!=", null));

  //     // Execute the query
  //     const querySnapshot = await getDocs(q);

  //     if (querySnapshot.empty) {
  //       console.log("No tasks found for this event");
  //       return;
  //     }
  //     const tasksArray = querySnapshot.docs
  //       .map((doc) => doc.data())
  //       .filter(
  //         (doc) =>
  //           doc.relatedEvent && props.event.docRef.path && 
  //           doc.relatedEvent.path === props.event.docRef.path
  //       );
  //     const completedTasks = tasksArray.filter(
  //       (task) => task.taskStatus === "הושלמה"
  //     ).length;
  //     const percentage = (completedTasks / tasksArray.length) * 100;

  //     // // Update state
  //     // setTasks(tasksArray);
  //     setCompletionPercentage(percentage);
  //   } catch (error) {
  //     console.error("Error fetching tasks:", error);
  //   }
  // }

  // useEffect(() => {
  //   fetchTasks();
  // }, []);

  // console.log(props.event);
  const isTitle = props.event.eventType === "title";
  return (
    <div className={`event-box ${isTitle ? "event-bold" : ""}`}>
      <div className={`event-field event-id ${isTitle ? "event-bold" : ""}`}>
        {props.event.id}
      </div>
      <div className={`event-field event-title ${isTitle ? "event-bold" : ""}`}>
        {props.event.eventName}
      </div>
      <div
        className={`event-field event-description ${
          isTitle ? "event-bold" : ""
        }`}
      >
        {props.event.eventDescription}
      </div>
      <div className={`event-field event-date ${isTitle ? "event-bold" : ""}`}>
        {props.event.eventDate}
      </div>
      <div className={`event-field event-time ${isTitle ? "event-bold" : ""}`}>
        {props.event.eventTime}
      </div>
      <div
        className={`event-field event-status ${isTitle ? "event-bold" : ""}`}
      >
        {props.event.eventStatus}
      </div>

      <div
        className={`event-field event-precentage ${
          isTitle ? "event-bold" : ""
        }`}
      >
        {!isTitle ? (isNaN(completionPercentage) ? 'אין משימות לאירוע' : `${completionPercentage}%`) : "אחוז"}
      </div>
      <div className={`event-field event-view ${isTitle ? "event-bold" : ""}`}>
        {!isTitle && (
          <svg
            width="18px"
            height="18px"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g
              id="SVGRepo_tracerCarrier"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></g>
            <g id="SVGRepo_iconCarrier">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9ZM11 12C11 11.4477 11.4477 11 12 11C12.5523 11 13 11.4477 13 12C13 12.5523 12.5523 13 12 13C11.4477 13 11 12.5523 11 12Z"
                fill="#000000"
              ></path>
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M21.83 11.2807C19.542 7.15186 15.8122 5 12 5C8.18777 5 4.45796 7.15186 2.17003 11.2807C1.94637 11.6844 1.94361 12.1821 2.16029 12.5876C4.41183 16.8013 8.1628 19 12 19C15.8372 19 19.5882 16.8013 21.8397 12.5876C22.0564 12.1821 22.0536 11.6844 21.83 11.2807ZM12 17C9.06097 17 6.04052 15.3724 4.09173 11.9487C6.06862 8.59614 9.07319 7 12 7C14.9268 7 17.9314 8.59614 19.9083 11.9487C17.9595 15.3724 14.939 17 12 17Z"
                fill="#000000"
              ></path>
            </g>
          </svg>
        )}
      </div>
    </div>
  );
}
export default Event;
