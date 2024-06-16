import "./App.css";
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/DoNotChange(maybe)/ProtectedRoute";
import LoginForm from "./components/DoNotChange(maybe)/LoginForm";
import HomePage from "./components/DoNotChange(maybe)/HomePage";
import UserCreationForm from "./components/User/CreateUser";
import RegistrationForm from "./components/DoNotChange(maybe)/RegistrationForm";
import CreateEvent from "./components/Events/CreateEvent";
import CreateTask from "./components/Tasks/CreateTask";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route exact path="/" element={<LoginForm />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute privilegeLevel={1}>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create"
          element={
            <ProtectedRoute privilegeLevel={3}>
              <UserCreationForm />
            </ProtectedRoute>
          }
        />
        <Route path="/register" element={<RegistrationForm />} />
        <Route path="/create-event" element={<CreateEvent />} />
        <Route path="/create-task" element={<CreateTask />} />
      </Routes>
    </Router>
  );
};

export default App;
