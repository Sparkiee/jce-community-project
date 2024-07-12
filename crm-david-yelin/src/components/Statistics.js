import React, { useEffect, useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
import { db } from "../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import "../styles/Statistics.css";

function Statistics() {
  const [eventsCount, setEventsCount] = useState([]);
  const [tasksCount, setTasksCount] = useState([]);
  const [budgetData, setBudgetData] = useState([]);
  const [years, setYears] = useState([]);
  const [taskStatusData, setTaskStatusData] = useState({
    complete: 0,
    inProgress: 0,
    notStarted: 0,
  });

  useEffect(() => {
    const fetchCountsPerYear = async () => {
      const currentYear = new Date().getFullYear();
      const eventsCountPerYear = [];
      const tasksCountPerYear = [];
      const budgetDataPerYear = [];
      const yearsArray = [];
      let newTaskStatusData = { complete: 0, inProgress: 0, notStarted: 0 };

      for (let year = currentYear - 4; year <= currentYear; year++) {
        yearsArray.push(year.toString());
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year, 11, 31);

        try {
          let totalEventBudget = 0;
          let totalSpentBudget = 0;

          // Fetch events count per year
          const eventRef = collection(db, "events");
          const eventQuery = query(eventRef, orderBy("eventEndDate", "desc"));
          const querySnapshot = await getDocs(eventQuery);
          const eventCount = querySnapshot.docs.filter((doc) => {
            const eventEndDate = doc.data().eventEndDate.toDate
              ? doc.data().eventEndDate.toDate()
              : new Date(doc.data().eventEndDate);
            if (eventEndDate >= startOfYear && eventEndDate <= endOfYear) {
              totalEventBudget += doc.data().eventBudget;
              return true;
            }
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
            if (taskEndDate >= startOfYear && taskEndDate <= endOfYear) {
              if (year === currentYear) {
                if (doc.data().taskStatus === "הושלמה") {
                  newTaskStatusData.complete += 1;
                } else if (doc.data().taskStatus === "בתהליך") {
                  newTaskStatusData.inProgress += 1;
                } else {
                  newTaskStatusData.notStarted += 1;
                }
              }
              totalSpentBudget += doc.data().taskBudget;
              return true;
            }
          }).length;
          tasksCountPerYear.push(taskCount);
          budgetDataPerYear.push({
            year,
            totalEventBudget,
            totalSpentBudget,
          });
        } catch (error) {
          console.error("Error getting documents: ", error);
        }
      }

      setEventsCount(eventsCountPerYear);
      setTasksCount(tasksCountPerYear);
      setBudgetData(budgetDataPerYear);
      setYears(yearsArray);
      setTaskStatusData(newTaskStatusData);
    };

    fetchCountsPerYear();
  }, []);

  const getColor = (index) => {
    const colors = [
      "rgba(255, 99, 132, 0.4)",
      "rgba(255, 159, 64, 0.4)",
      "rgba(75, 192, 192, 0.4)",
      "rgba(54, 162, 235, 0.4)",
      "rgba(153, 102, 255, 0.4)",
    ];
    return colors[index % colors.length];
  };

  const eventData = {
    labels: years,
    datasets: [
      {
        label: "מספר אירועים בשנה",
        data: eventsCount,
        backgroundColor: eventsCount.map((_, index) => getColor(index)),
      },
    ],
  };

  const taskData = {
    labels: years,
    datasets: [
      {
        label: "מספר משימות בשנה",
        data: tasksCount,
        backgroundColor: tasksCount.map((_, index) => getColor(index)),
      },
    ],
  };

  const budgetChartData = {
    labels: years,
    datasets: [
      {
        label: "תקציב כולל בשנה",
        data: budgetData.map((data) => data.totalEventBudget),
        backgroundColor: "rgba(54, 162, 235, 0.4)",
      },
      {
        label: "תקציב שנוצל בשנה",
        data: budgetData.map((data) => data.totalSpentBudget),
        backgroundColor: "rgba(255, 99, 132, 0.4)",
      },
    ],
  };

  const taskStatusChartData = {
    labels: ["הושלמו", "בתהליך", "טרם החלו"],
    datasets: [
      {
        data: [taskStatusData.complete, taskStatusData.inProgress, taskStatusData.notStarted],
        backgroundColor: [
          "rgba(75, 192, 192, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(255, 99, 132, 0.6)",
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
      <div>
        <h2>מספר אירועים בשנה</h2>
        <Bar data={eventData} options={options} />
      </div>
      <div>
        <h2>מספר משימות בשנה</h2>
        <Bar data={taskData} options={options} />
      </div>
      <div>
        <h2>תקציב כולל ותקציב שנוצל בשנה</h2>
        <Bar data={budgetChartData} options={options} />
      </div>
      <div>
        <h3>סטטוס משימות לשנת {new Date().getFullYear()}</h3>
        <Pie data={taskStatusChartData} />
      </div>
    </div>
  );
}

export default Statistics;
