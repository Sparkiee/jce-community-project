import React from "react";

function Feedback({ taskExists, warningText, formWarning }) {
  return (
    <div className="feedback">
      {taskExists && <p style={{ color: "green" }}>אירוע נוצר בהצלחה</p>}
      {formWarning && <p style={{ color: "red" }}>{warningText}</p>}
    </div>
  );
}

export default Feedback;
