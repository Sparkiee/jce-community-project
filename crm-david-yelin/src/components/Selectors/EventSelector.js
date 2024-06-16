import React from "react";
import Select from "react-select";
import { collection, query, getDocs, where } from "firebase/firestore";
import { db } from "../../firebase";

function EventSelector({ events, setEvents, selectedEvent, setSelectedEvent }) {
  const handleSearchEvent = async (event) => {
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
        ...doc.data(),
      }));
      setEvents(results);
    } else {
      setEvents([]);
    }
  };

  const handleSelectEvent = (value) => {
    const selectedEvent = events.find((event) => event.eventName === value);
    if (selectedEvent) {
      setSelectedEvent(selectedEvent);
      setEvents([]);
    }
  };

  return (
    <Select
      name="relatedEvent"
      placeholder="שייך לאירוע"
      className="create-task-input"
      onInputChange={(inputValue) => handleSearchEvent({ target: { value: inputValue } })}
      onChange={(e) => handleSelectEvent(e.value)}
      options={events.map((event) => ({
        value: event.eventName,
        label: event.eventName,
      }))}
    />
  );
}

export default EventSelector;
