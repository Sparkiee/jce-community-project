import React from "react";

function Feedback({ taskExists }) {
  return (
    <div className="feedback">
      {taskExists && <p style={{ color: "green" }}>משימה חדשה התווספה בהצלחה</p>}
    </div>
  );
}

export default Feedback;
