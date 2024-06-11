import React from "react";

function CreateUser() {
  return (
    <div className="CreateUser">
      <form>
        <label htmlFor="email">Email:</label>
        <input type="email" id="email" name="email" />
        <button type="submit">Register</button>
      </form>
    </div>
  );
}

export default CreateUser;
