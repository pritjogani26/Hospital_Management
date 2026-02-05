// Hospital_Management\frontend\src\components\ConfirmPopup.tsx
import React, { useEffect, useRef, useState } from "react";
import "./ConfirmPopup.css";

type ConfirmPopupProps = {
  msg: "update" | "delete" | string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  submitting?: boolean;
};

// msg = delete | update
const ConfirmPopup: React.FC<ConfirmPopupProps> = ({
  msg,
  onConfirm,
  onCancel,
  submitting = false,
}) => {
  const [reason, setReason] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="popup-overlay" role="dialog" aria-modal="true">
      <div className="popup-box">
        <h2>Confirm {msg}</h2>
        <p>
          Are you sure you want to <strong>{msg}</strong> this record?
        </p>
        <textarea 
          ref={textareaRef}
          aria-label="Reason"
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={`Enter Reason for ${msg}...`}
          className="popup-reason"
          disabled={submitting}
        />

        <div className="popup-buttons">
          <button 
            className="btn btn-update" 
            onClick={() => onConfirm(reason.trim())}
            disabled={reason.trim().length === 0 || submitting}
            aria-disabled={reason.trim().length === 0 || submitting}
            title={
              reason.trim().length === 0 ? "Please provide a reason" : "Yes"
            }
            >
            {submitting ? "Please wait..." : "Yes"}
          </button>

          <button className="btn btn-back" onClick={onCancel} disabled={submitting}>
            No
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmPopup;
