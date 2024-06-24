import "../styles/Styles.css";
import "../styles/ConfirmAction.css";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import React, { forwardRef, useImperativeHandle } from "react";

const ConfirmAction = forwardRef(({ onConfirm, onCancel }, ref) => {
  // Use useImperativeHandle to expose specific functions to the parent component
  useImperativeHandle(ref, () => ({
    triggerConfirmClick() {
      onConfirm();
    },
    triggerCancelClick() {
      onCancel();
    },
  }));

  return (
    <div className="confirm-action-form">
      <div className="alert-name">
        <WarningAmberIcon className="Warning-Amber-Icon" />
        <h2 className="confirm-actions-title">האם אתה בטוח שברצונך לבצע פעולה זו?</h2>
      </div>
      <div className="confirm-action-buttons">
        <input type="submit" value="אשר" className="confirm-button" onClick={() => onConfirm()} />
        <input type="submit" value="בטל" className="deny-button" onClick={() => onCancel()} />
      </div>
    </div>
  );
});

export default ConfirmAction;
