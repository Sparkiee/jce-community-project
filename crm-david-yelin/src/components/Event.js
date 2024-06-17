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
        <span>{props.event.id}</span>
        {isTitle && <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none">
          <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
          <g
            id="SVGRepo_tracerCarrier"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></g>
          <g id="SVGRepo_iconCarrier">
            <path
              d="M11.1924 5.65685C11.5829 5.26633 11.5829 4.63316 11.1924 4.24264L8.36397 1.41421C8.30576 1.356 8.24485 1.30212 8.18165 1.25259C7.50286 0.720577 6.55947 0.689024 5.84929 1.15793C5.73839 1.23115 5.63317 1.31658 5.53554 1.41421L2.70711 4.24264C2.31658 4.63316 2.31658 5.26633 2.70711 5.65685C3.09763 6.04738 3.7308 6.04738 4.12132 5.65685L6.00003 3.77814V18C6.00003 18.5523 6.44775 19 7.00003 19C7.55232 19 8.00003 18.5523 8.00003 18V3.8787L9.77818 5.65685C10.1687 6.04737 10.8019 6.04737 11.1924 5.65685Z"
              fill="#0F0F0F"
            ></path>
            <path
              d="M12.7071 18.3432C12.3166 18.7337 12.3166 19.3668 12.7071 19.7574L15.5355 22.5858C15.6332 22.6834 15.7384 22.7689 15.8493 22.8421C16.6256 23.3546 17.6805 23.2692 18.364 22.5858L21.1924 19.7574C21.5829 19.3668 21.5829 18.7337 21.1924 18.3432C20.8019 17.9526 20.1687 17.9526 19.7782 18.3432L18 20.1213V6C18 5.44771 17.5523 5 17 5C16.4477 5 16 5.44771 16 6V20.2218L14.1213 18.3432C13.7308 17.9526 13.0976 17.9526 12.7071 18.3432Z"
              fill="#0F0F0F"
            ></path>
          </g>
        </svg>}
      </div>
      <div className={`event-field event-title ${isTitle ? "event-bold" : ""}`}>
        {props.event.eventName}
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
        {!isTitle
          ? isNaN(completionPercentage)
            ? "אין משימות לאירוע"
            : `${completionPercentage}%`
          : "אחוז"}
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
