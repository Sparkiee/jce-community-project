import React, { useEffect, useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
import { db } from "../firebase";
import { collection, getDocs, query, orderBy, getDoc, doc } from "firebase/firestore";
import "../styles/Statistics.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

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
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() - 4);

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

      for (let year = selectedYear; year <= currentYear; year++) {
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
              totalEventBudget += Number(docData.eventBudget);
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
              totalSpentBudget += Number(docData.taskBudget);
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
  }, [selectedYear]);

  const getColor = (index) => {
    const colors = [
      "rgba(255, 99, 132, 0.4)",
      "rgba(255, 159, 64, 0.4)",
      "rgba(255, 205, 86, 0.4)",
      "rgba(75, 192, 192, 0.4)",
      "rgba(54, 162, 235, 0.4)",
      "rgba(153, 102, 255, 0.4)",
      "rgba(26, 54, 54, 0.4)",
      "rgba(255, 178, 0, 0.4)",
      "rgba(200, 0, 54, 0.4)",
      "rgba(155, 236, 0, 0.4)",
      "rgba(232, 141, 103, 0.4)",
      "rgba(0, 33, 94, 0.4)",
      "rgba(216, 149, 218, 0.4)",
      "rgba(255, 152, 0, 0.4)",
      "rgba(98, 114, 84, 0.4)",
      "rgba(0, 141, 218, 0.4)",
      "rgba(255, 32, 78, 0.4)",
      "rgba(67, 10, 93, 0.4)",
      "rgba(0, 127, 115, 0.4)",
      "rgba(86, 28, 36, 0.4)",
      "rgba(153, 188, 133, 0.4)",
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

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Events per Year
    const eventsSheet = XLSX.utils.json_to_sheet(
      years.map((year, index) => ({
        Year: year,
        "מספר אירועים": eventsCount[index],
      }))
    );
    XLSX.utils.book_append_sheet(wb, eventsSheet, "מספר אירועים בשנה");

    // Tasks per Year
    const tasksSheet = XLSX.utils.json_to_sheet(
      years.map((year, index) => ({
        Year: year,
        "מספר מסימות": tasksCount[index],
      }))
    );
    XLSX.utils.book_append_sheet(wb, tasksSheet, "מספר משימות בשנה");

    // Budget Data
    const budgetSheet = XLSX.utils.json_to_sheet(
      budgetData.map((data) => ({
        Year: data.year,
        "תקיצוב אירועים בשנה": data.totalEventBudget,
        "תקציב משימות בשנה": data.totalSpentBudget,
      }))
    );
    XLSX.utils.book_append_sheet(wb, budgetSheet, "נתוני תקציב");

    // Task Status Data
    const taskStatusSheet = XLSX.utils.json_to_sheet([
      { Status: "הושלמו", Count: taskStatusData.complete },
      { Status: "בתהליך", Count: taskStatusData.inProgress },
      { Status: "טרם החלו", Count: taskStatusData.notStarted },
    ]);
    XLSX.utils.book_append_sheet(wb, taskStatusSheet, "סטטוס משימות");

    // Department Data
    const departmentSheet = XLSX.utils.json_to_sheet(departmentData);
    XLSX.utils.book_append_sheet(wb, departmentSheet, "נתוני מחלקות");

    // Averages
    const averagesSheet = XLSX.utils.json_to_sheet([
      { Metric: "ממוצע אירועים לשנה", Value: averages.eventsPerYear },
      { Metric: "ממצוע משימות לשנה", Value: averages.tasksPerYear },
      { Metric: "ממצוע משימות לאירוע לשנה", Value: averages.tasksPerEventPerYear },
      { Metric: "ממוצע תקציב אירועים בשנה", Value: averages.totalBudgetPerYear },
      { Metric: "ממוצע תקציב משימות בשנה", Value: averages.spentBudgetPerYear },
    ]);
    XLSX.utils.book_append_sheet(wb, averagesSheet, "ממוצעים");

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    // Save the file
    saveAs(data, "נתוני_סטטיסטיקה.xlsx");
  };

  function generateYearJumps() {
    const currentYear = new Date().getFullYear(); // 1. Get the current year
    const years = []; // 2. Initialize an empty array

    for (let year = currentYear; year >= currentYear - 20; year -= 1) {
      // 3. Loop from current year - 20
      years.push(year); // 4. Add the year to the array
    }

    return years; // 6. Return the array
  }

  return (
    <div>
      <div className="statistics-container">
        <div className="year-select-container">
          <label className="years-select-label" htmlFor="years-select">
            בחר שנת התחלה:
          </label>
          <select
            className="years-select"
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            value={selectedYear}>
            {generateYearJumps().map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div className="excel-icon" onClick={exportToExcel}>
          <p className="excel-p">ייצוא לאקסל</p>
          <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="#000000">
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
            <g id="SVGRepo_iconCarrier">
              <title>file_type_excel2</title>
              <path
                d="M28.781,4.405H18.651V2.018L2,4.588V27.115l16.651,2.868V26.445H28.781A1.162,1.162,0,0,0,30,25.349V5.5A1.162,1.162,0,0,0,28.781,4.405Zm.16,21.126H18.617L18.6,23.642h2.487v-2.2H18.581l-.012-1.3h2.518v-2.2H18.55l-.012-1.3h2.549v-2.2H18.53v-1.3h2.557v-2.2H18.53v-1.3h2.557v-2.2H18.53v-2H28.941Z"
                style={{ fill: "#20744a", fillRule: "evenodd" }}></path>
              <rect
                x="22.487"
                y="7.439"
                width="4.323"
                height="2.2"
                style={{ fill: "#20744a" }}></rect>
              <rect
                x="22.487"
                y="10.94"
                width="4.323"
                height="2.2"
                style={{ fill: "#20744a" }}></rect>
              <rect
                x="22.487"
                y="14.441"
                width="4.323"
                height="2.2"
                style={{ fill: "#20744a" }}></rect>
              <rect
                x="22.487"
                y="17.942"
                width="4.323"
                height="2.2"
                style={{ fill: "#20744a" }}></rect>
              <rect
                x="22.487"
                y="21.443"
                width="4.323"
                height="2.2"
                style={{ fill: "#20744a" }}></rect>
              <polygon
                points="6.347 10.673 8.493 10.55 9.842 14.259 11.436 10.397 13.582 10.274 10.976 15.54 13.582 20.819 11.313 20.666 9.781 16.642 8.248 20.513 6.163 20.329 8.585 15.666 6.347 10.673"
                style={{ fill: "#ffffff", fillRule: "evenodd" }}></polygon>
            </g>
          </svg>{" "}
        </div>
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
