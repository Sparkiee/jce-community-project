// import React, { useEffect, useState } from "react";
// import { collection, query, where, getDocs } from "firebase/firestore";
// import { db, updateUserData } from "../firebase";
// import Navbar from "./Navbar";
// import "../styles/AllEvents.css";
// import CreateEvent from "./CreateEvent";

// const AllEvents = () => {
//     const [events, setEvents] = useState([]);
//     const [sortOption, setSortOption] = useState("date");
//     const [showCreateEvent, setShowCreateEvent] = useState(false);

//     const user = JSON.parse(sessionStorage.getItem("user"));

//     useEffect(() => {
//         const fetchEvents = async () => {
//             try {
//                 const q = query(collection(db, "events"), where("eventStatus", "==", "בתהליך"));
//                 const querySnapshot = await getDocs(q);
//                 const eventsList = querySnapshot.docs.map(doc => ({
//                     id: doc.id,
//                     ...doc.data()
//                 }));
//                 setEvents(eventsList);
//             } catch (error) {
//                 console.error("Error fetching events: ", error);
//             }
//         };

//         fetchEvents();
//     }, []);

//     const handleShowCreateEvent = () => {
//         setShowCreateEvent(true);
//     };

//     const sortEvents = (events, option) => {
//         if (option === "alpha") {
//             return events.sort((a, b) => a.eventName.localeCompare(b.eventName));
//         } else if (option === "date") {
//             return events.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
//         }
//         return events;
//     };

//     const handleSortChange = (event) => {
//         setSortOption(event.target.value);
//     };

//     const sortedEvents = sortEvents([...events], sortOption);

//     return (
//         <>
//             <Navbar />
//             <div className="events-list">
//                 <div className="task-button" onClick={handleShowCreateEvent}>
//                     <svg
//                         width="24px"
//                         height="24px"
//                         viewBox="0 0 24 24"
//                         fill="none"
//                         xmlns="http://www.w3.org/2000/svg"
//                     >
//                         <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
//                         <g
//                             id="SVGRepo_tracerCarrier"
//                             strokeLinecap="round"
//                             strokeLinejoin="round"
//                         ></g>
//                         <g id="SVGRepo_iconCarrier">
//                             <path
//                                 d="M7 12L12 12M12 12L17 12M12 12V7M12 12L12 17"
//                                 stroke="white"
//                                 strokeWidth="2"
//                                 strokeLinecap="round"
//                                 strokeLinejoin="round"
//                             ></path>
//                         </g>
//                     </svg>
//                     הוסף אירוע
//                 </div>
//                 {showCreateEvent && (
//                     <div className="create-event-popup">
//                         <div
//                             className="action-close"
//                             onClick={() => {
//                                 setShowCreateEvent(false);
//                                 updateUserData(user.email);
//                             }}
//                         >
//                             <svg
//                                 width="24px"
//                                 height="24px"
//                                 viewBox="0 0 24 24"
//                                 xmlns="http://www.w3.org/2000/svg"
//                                 fill="currentColor"
//                             >
//                                 <line
//                                     x1="17"
//                                     y1="7"
//                                     x2="7"
//                                     y2="17"
//                                     stroke="currentColor"
//                                     strokeWidth="2"
//                                     strokeLinecap="round"
//                                 />
//                                 <line
//                                     x1="7"
//                                     y1="7"
//                                     x2="17"
//                                     y2="17"
//                                     stroke="currentColor"
//                                     strokeWidth="2"
//                                     strokeLinecap="round"
//                                 />
//                             </svg>
//                         </div>
//                         <CreateEvent />
//                     </div>
//                 )}
//                 <h2>אירועים פעילים</h2>
//                 <div className="sort-options">
//                     <label>
//                         מיין לפי:
//                         <select value={sortOption} onChange={handleSortChange}>
//                             <option value="date">תאריך</option>
//                             <option value="alpha">א"ב</option>
//                         </select>
//                     </label>
//                 </div>
//                 {sortedEvents.length > 0 ? (
//                     <ul>
//                         {sortedEvents.map(event => (
//                             <li key={event.id}>
//                                 <h3>{event.eventName}</h3>
//                                 <p>מיקום: {event.eventLocation}</p>
//                                 <p>תאריך: {new Date(event.eventDate).toLocaleDateString()}</p>
//                                 <p>שעה: {event.eventTime}</p>
//                             </li>
//                         ))}
//                     </ul>
//                 ) : (
//                     <p className="pera">אין אירועים פעילים כרגע.</p>
//                 )}
//             </div>
//         </>
//     );
// };

// export default AllEvents;



import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, updateUserData } from "../firebase";
import Navbar from "./Navbar";
import "../styles/AllEvents.css";
import CreateEvent from "./CreateEvent";

const AllEvents = () => {
    const [events, setEvents] = useState([]);
    const [sortOption, setSortOption] = useState("date");
    const [showCreateEvent, setShowCreateEvent] = useState(false);

    const user = JSON.parse(sessionStorage.getItem("user"));

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const q = query(collection(db, "events"), where("eventStatus", "==", "בתהליך"));
                const querySnapshot = await getDocs(q);
                const eventsList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setEvents(eventsList);
            } catch (error) {
                console.error("Error fetching events: ", error);
            }
        };

        fetchEvents();
    }, []);

    const handleShowCreateEvent = () => {
        setShowCreateEvent(true);
    };

    const sortEvents = (events, option) => {
        if (option === "alpha") {
            return events.sort((a, b) => a.eventName.localeCompare(b.eventName));
        } else if (option === "date") {
            return events.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
        }
        return events;
    };

    const handleSortChange = (event) => {
        setSortOption(event.target.value);
    };

    const sortedEvents = sortEvents([...events], sortOption);

    return (
        <>
            <Navbar />
            <div className="events-list">
                <div className="task-button" onClick={handleShowCreateEvent}>
                    <svg
                        width="24px"
                        height="24px"
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
                                d="M7 12L12 12M12 12L17 12M12 12V7M12 12L12 17"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            ></path>
                        </g>
                    </svg>
                    הוסף אירוע
                </div>
                {showCreateEvent && (
                    <div className="create-event-overlay">
                        <div className="create-event-popup">
                            <div
                                className="action-close"
                                onClick={() => {
                                    setShowCreateEvent(false);
                                    updateUserData(user.email);
                                }}
                            >
                                <svg
                                    width="24px"
                                    height="24px"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="currentColor"
                                >
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
                            <CreateEvent />
                        </div>
                    </div>
                )}
                <h2>אירועים פעילים</h2>
                <div className="sort-options">
                    <label>
                        מיין לפי:
                        <select value={sortOption} onChange={handleSortChange}>
                            <option value="date">תאריך</option>
                            <option value="alpha">א"ב</option>
                        </select>
                    </label>
                </div>
                {sortedEvents.length > 0 ? (
                    <ul>
                        {sortedEvents.map(event => (
                            <li key={event.id}>
                                <h3>{event.eventName}</h3>
                                <p>מיקום: {event.eventLocation}</p>
                                <p>תאריך: {new Date(event.eventDate).toLocaleDateString()}</p>
                                <p>שעה: {event.eventTime}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="pera">אין אירועים פעילים כרגע.</p>
                )}
            </div>
        </>
    );
};

export default AllEvents;
