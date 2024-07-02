import "../styles/Styles.css";
import "../styles/ChangeLog.css";
import React from "react";

function ChangeLog(props) {
  function replaceFieldString(field) {
    switch (field) {
      case "eventName":
        return "שם האירוע";
      case "eventLocation":
        return "מיקום האירוע";
      case "eventStartDate":
        return "תאריך התחלה";
      case "eventEndDate":
        return "תאריך סיום";
      case "eventTime":
        return "שעה";
      case "eventBudget":
        return "תקציב";
      case "eventStatus":
        return "סטטוס";
      case "assignees":
        return "משוייכים";

      case "taskName":
        return "שם המשימה";
      case "taskDescription":
        return "תיאור";
      case "taskStatus":
        return "סטטוס";
      case "taskStartDate":
        return "תאריך התחלה";
      case "taskEndDate":
        return "תאריך סיום";
      case "taskTime":
        return "שעה";
      case "taskBudget":
        return "תקציב";
      case "relatedEvent":
        return "אירוע קשור";
    }
  }
  function generateHtmlListForFieldChanges(fields) {
    if (fields == null) return null;
    const array = Object.entries(fields);
    const list = array.map(([key, { oldValue, newValue }], index) => {
      // Use `key` and `index` to form a unique key for each item
      return (
        <div key={`${key}-${index}`}>
          השדה שהשתנה: {replaceFieldString(key)}
          <ul>
            <li>ערך ישן: - {oldValue}</li>
            <li>ערך חדש: - {newValue}</li>
          </ul>
        </div>
      );
    });
    return list; // Wrap the list items in a <ul> element
  }
  return (
    <div className="changelog">
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
      <h1 className="centered-title-changelog">פירוט שינויים</h1>
      <div>{generateHtmlListForFieldChanges(props.fields)}</div>
    </div>
  );
}

export default ChangeLog;
