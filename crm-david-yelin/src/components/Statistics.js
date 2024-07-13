import React, { useEffect, useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
import { db } from "../firebase";
import { collection, getDocs, query, orderBy, getDoc, doc } from "firebase/firestore";
import "../styles/Statistics.css";

function Statistics() {
  const [eventsCount, setEventsCount] = useState([]);
  const [tasksCount, setTasksCount] = useState([]);
  const [budgetData, setBudgetData] = useState([]);
  const [years, setYears] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [taskStatusData, setTaskStatusData] = useState({
    complete: 0,
    inProgress: 0,
    notStarted: 0,
  });
  const [averages, setAverages] = useState({
    eventsPerYear: 0,
    tasksPerYear: 0,
    tasksPerEventPerYear: 0,
    totalBudgetPerYear: 0,
    spentBudgetPerYear: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      const currentYear = new Date().getFullYear();
      const eventsCountPerYear = [];
      const tasksCountPerYear = [];
      const budgetDataPerYear = [];
      const yearsArray = [];
      let newTaskStatusData = { complete: 0, inProgress: 0, notStarted: 0 };
      let departmentStats = {};

      // Fetch departments at the beginning
      const departmentsRef = collection(db, "departments");
      const departmentsSnapshot = await getDocs(departmentsRef);
      departmentsSnapshot.docs.forEach((doc) => {
        departmentStats[doc.data().name] = { events: 0, tasks: 0 };
      });

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
          const eventCount = querySnapshot.docs.filter((document) => {
            const docData = document.data();
            const eventEndDate = docData.eventEndDate.toDate
              ? docData.eventEndDate.toDate()
              : new Date(docData.eventEndDate);
            if (eventEndDate >= startOfYear && eventEndDate <= endOfYear) {
              totalEventBudget += docData.eventBudget;
              if (year === currentYear && docData.assignees) {
                // Check if assignees is defined
                docData.assignees.forEach(async (assignee) => {
                  const memberRef = doc(db, assignee);
                  const memberSnapshot = await getDoc(memberRef);
                  if (memberSnapshot.exists()) {
                    const department = memberSnapshot.data().department;
                    if (departmentStats[department]) {
                      departmentStats[department].events++;
                    }
                  }
                });
              }
              return true;
            }
            return false;
          }).length;

          eventsCountPerYear.push(eventCount);

          // Fetch tasks count per year
          const taskRef = collection(db, "tasks");
          const taskQuery = query(taskRef, orderBy("taskEndDate", "desc"));
          const taskSnapshot = await getDocs(taskQuery);
          const taskCount = taskSnapshot.docs.filter((document) => {
            const docData = document.data();
            const taskEndDate = docData.taskEndDate.toDate
              ? docData.taskEndDate.toDate()
              : new Date(docData.taskEndDate);
            if (taskEndDate >= startOfYear && taskEndDate <= endOfYear) {
              if (year === currentYear) {
                if (docData.taskStatus === "הושלמה") {
                  newTaskStatusData.complete += 1;
                } else if (docData.taskStatus === "בתהליך") {
                  newTaskStatusData.inProgress += 1;
                } else {
                  newTaskStatusData.notStarted += 1;
                }
                if (docData.assignees) {
                  // Check if assignees is defined
                  docData.assignees.forEach(async (assignee) => {
                    const memberRef = doc(db, assignee);
                    const memberDoc = await getDoc(memberRef);
                    if (memberDoc.exists()) {
                      const department = memberDoc.data().department;
                      if (departmentStats[department]) {
                        departmentStats[department].tasks++;
                      }
                    }
                  });
                }
              }
              totalSpentBudget += docData.taskBudget;
              return true;
            }
            return false;
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

      // Calculate averages
      const totalYears = yearsArray.length;
      const avgEventsPerYear = eventsCountPerYear.reduce((a, b) => a + b, 0) / totalYears;
      const avgTasksPerYear = tasksCountPerYear.reduce((a, b) => a + b, 0) / totalYears;
      const avgTasksPerEventPerYear = avgTasksPerYear / avgEventsPerYear;
      const avgTotalBudgetPerYear =
        budgetDataPerYear.reduce((a, b) => a + b.totalEventBudget, 0) / totalYears;
      const avgSpentBudgetPerYear =
        budgetDataPerYear.reduce((a, b) => a + b.totalSpentBudget, 0) / totalYears;

      setAverages({
        eventsPerYear: avgEventsPerYear,
        tasksPerYear: avgTasksPerYear,
        tasksPerEventPerYear: avgTasksPerEventPerYear,
        totalBudgetPerYear: avgTotalBudgetPerYear,
        spentBudgetPerYear: avgSpentBudgetPerYear,
      });

      setEventsCount(eventsCountPerYear);
      setTasksCount(tasksCountPerYear);
      setBudgetData(budgetDataPerYear);
      setYears(yearsArray);
      setTaskStatusData(newTaskStatusData);
      setTimeout(() => {
        const departmentDataArray = Object.entries(departmentStats).map(([name, data]) => ({
          name,
          events: data.events,
          tasks: data.tasks,
        }));

        setDepartmentData(departmentDataArray);
      }, 5000);
    };

    fetchData();
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
        data: eventsCount,
        backgroundColor: eventsCount.map((_, index) => getColor(index)),
      },
    ],
  };

  const taskData = {
    labels: years,
    datasets: [
      {
        data: tasksCount,
        backgroundColor: tasksCount.map((_, index) => getColor(index)),
      },
    ],
  };

  const budgetChartData = {
    labels: years,
    datasets: [
      {
        label: "תקציב אירועים בשנה",
        data: budgetData.map((data) => data.totalEventBudget),
        backgroundColor: "rgba(54, 162, 235, 0.4)",
      },
      {
        label: "תקציב משימות בשנה",
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

  const departmentChartData = {
    labels: departmentData.map((dept) => dept.name),
    datasets: [
      {
        label: "אירועים",
        data: departmentData.map((dept) => dept.events),
        backgroundColor: "rgba(54, 162, 235, 0.4)",
      },
      {
        label: "משימות",
        data: departmentData.map((dept) => dept.tasks),
        backgroundColor: "rgba(255, 99, 132, 0.4)",
      },
    ],
  };

  const yearEventsTasksOptions = {
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        titleFont: {
          size: 18,
        },
        bodyFont: {
          size: 18,
        },
        footerFont: {
          size: 18,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: 20,
          },
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 20,
          },
        },
      },
    },
  };

  const options = {
    plugins: {
      legend: {
        labels: {
          font: {
            size: 18,
          },
        },
      },
      tooltip: {
        titleFont: {
          size: 18,
        },
        bodyFont: {
          size: 18,
        },
        footerFont: {
          size: 18,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: 20,
          },
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 20,
          },
        },
      },
    },
  };

  const pieChartOptions = {
    plugins: {
      legend: {
        labels: {
          font: {
            size: 23,
          },
        },
      },
      tooltip: {
        titleFont: {
          size: 18,
        },
        bodyFont: {
          size: 18,
        },
        footerFont: {
          size: 18,
        },
      },
    },
  };

  return (
    <div>
      <div className="statistics-container">
        <div className="statistics-top">
          <div className="year-events-statistics">
            <h2>מספר אירועים בשנה</h2>
            <Bar data={eventData} options={yearEventsTasksOptions} />
            <p>ממוצע אירועים בשנה: {averages.eventsPerYear.toFixed(2)}</p>
            <p>ממוצע משימות לאירוע בשנה: {averages.tasksPerEventPerYear.toFixed(2)}</p>
          </div>
          <div className="year-tasks-statistics">
            <h2>מספר משימות בשנה</h2>
            <Bar data={taskData} options={yearEventsTasksOptions} />
            <p>ממוצע משימות בשנה: {averages.tasksPerYear.toFixed(2)}</p>
          </div>
        </div>
        <div className="statistics-middle">
          <div className="year-budget-statistics">
            <h2>תקציב אירועים ומשימות שנוצלו בשנה</h2>
            <Bar data={budgetChartData} options={options} />
            <p>ממוצע תקציב אירועים בשנה: {averages.totalBudgetPerYear.toFixed(2)}</p>
            <p>ממוצע תקציב משימות בשנה: {averages.spentBudgetPerYear.toFixed(2)}</p>
          </div>
          <div className="current-year-tasks-status-statistics">
            <h2>סטטוס משימות לשנת {new Date().getFullYear()}</h2>
            <Pie
              className="current-year-tasks-status-statistics-pie"
              data={taskStatusChartData}
              options={pieChartOptions}
            />
          </div>
        </div>
        <div className="statistics-bottom">
          <h2>אירועים ומשימות לפי מחלקה בשנה הנוכחית</h2>
          <Bar
            className="current-year-department-based-events-tasks-statistics"
            data={departmentChartData}
            options={options}
          />
        </div>
      </div>
      <div className="footer"></div>
    </div>
  );
}

export default Statistics;
