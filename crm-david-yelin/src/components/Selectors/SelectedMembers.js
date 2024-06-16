import React from "react";

function SelectedMembers({ selectedMembers, onRemoveMember }) {
  return (
    <div className="create-event-selected-members">
      {selectedMembers.map((member, index) => (
        <div key={index} className="selected-member" onClick={() => onRemoveMember(member.id)}>
          <svg
            className="w-6 h-6 text-gray-800 dark:text-white"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24">
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M16 12h4m-2 2v-4M4 18v-1a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Zm8-10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
          </svg>
          <div className="selected-member-text">{member.fullName}</div>
        </div>
      ))}
    </div>
  );
}

export default SelectedMembers;
