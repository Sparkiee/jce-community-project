import "./App.css";
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginForm from "./components/LoginForm";
import HomePage from "./components/HomePage";
import CreateUser from "./components/CreateUser";
import RegisterUser from "./components/RegisterUser";
import CreateEvent from "./components/CreateEvent";
import CreateTask from "./components/CreateTask";
import ManageUsers from "./components/ManageUsers";
import ManageTasks from "./components/ManageTasks";
import ForgotPassword from "./components/ForgotPassword";

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
              <CreateUser />
            </ProtectedRoute>
          }
        />
        <Route path="/register" element={<RegisterUser />} />
        <Route path="/create-event" element={<CreateEvent />} />
        <Route path="/create-task" element={<CreateTask />} />
        <Route path="/users" element={<ManageUsers />} />
        <Route path="/Manage-tasks" element={<ManageTasks />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
    </Router>
  );
};

export default App;
