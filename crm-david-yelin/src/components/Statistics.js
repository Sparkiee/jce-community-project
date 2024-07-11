import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { db } from "../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import "../styles/Statistics.css";

function Statistics() {
  const [eventsCount, setEventsCount] = useState([]);
  const [tasksCount, setTasksCount] = useState([]);
  const [years, setYears] = useState([]);

  useEffect(() => {
    const fetchCountsPerYear = async () => {
      const currentYear = new Date().getFullYear();
      const eventsCountPerYear = [];
      const tasksCountPerYear = [];
      const yearsArray = [];

      for (let year = currentYear - 4; year <= currentYear; year++) {
        yearsArray.push(year.toString());
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year, 11, 31);

        try {
          // Fetch events count per year
          const eventRef = collection(db, "events");
          const eventQuery = query(eventRef, orderBy("eventEndDate", "desc"));
          const querySnapshot = await getDocs(eventQuery);
          const eventCount = querySnapshot.docs.filter((doc) => {
            const eventEndDate = doc.data().eventEndDate.toDate
              ? doc.data().eventEndDate.toDate()
              : new Date(doc.data().eventEndDate);
            return eventEndDate >= startOfYear && eventEndDate <= endOfYear;
          }).length;
          eventsCountPerYear.push(eventCount);

          // Fetch tasks count per year
          const taskRef = collection(db, "tasks");
          const taskQuery = query(taskRef, orderBy("taskEndDate", "desc"));
          const taskSnapshot = await getDocs(taskQuery);
          const taskCount = taskSnapshot.docs.filter((doc) => {
            const taskEndDate = doc.data().taskEndDate.toDate
              ? doc.data().taskEndDate.toDate()
              : new Date(doc.data().taskEndDate);
            return taskEndDate >= startOfYear && taskEndDate <= endOfYear;
          }).length;
          tasksCountPerYear.push(taskCount);
        } catch (error) {
          console.error("Error getting documents: ", error);
        }
      }

      setEventsCount(eventsCountPerYear);
      setTasksCount(tasksCountPerYear);
      setYears(yearsArray);
    };

    fetchCountsPerYear();
  }, []);

  const eventData = {
    labels: years,
    datasets: [
      {
        label: "מספר אירועים בשנה",
        data: eventsCount,
        backgroundColor: [
          "rgba(255, 99, 132, 0.4)",
          "rgba(255, 159, 64, 0.4)",
          "rgba(75, 192, 192, 0.4)",
          "rgba(54, 162, 235, 0.4)",
          "rgba(153, 102, 255, 0.4)",
        ],
      },
    ],
  };

  const taskData = {
    labels: years,
    datasets: [
      {
        label: "מספר משימות בשנה",
        data: tasksCount,
        backgroundColor: [
          "rgba(255, 99, 132, 0.4)",
          "rgba(255, 159, 64, 0.4)",
          "rgba(75, 192, 192, 0.4)",
          "rgba(54, 162, 235, 0.4)",
          "rgba(153, 102, 255, 0.4)",
        ],
      },
    ],
  };

  const options = {
    type: "bar",
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div>
      <h2>Statistics</h2>
      <div>
        <Bar data={eventData} options={options} />
      </div>
      <div>
        <Bar data={taskData} options={options} />
      </div>
    </div>
  );
}

export default Statistics;
