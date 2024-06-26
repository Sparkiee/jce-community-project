import "./App.css";
import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginForm from "./components/LoginForm";
import HomePage from "./components/HomePage";
import RegisterUser from "./components/RegisterUser";
import ManageUsers from "./components/ManageUsers";
import ManageTasks from "./components/ManageTasks";
import ForgotPassword from "./components/ForgotPassword";
import ManageEvents from "./components/ManageEvents";
import Profile from "./components/Profile";
import TaskPage from "./components/TaskPage";
import EventPage from "./components/EventPage";

import Navbar from "./components/Navbar";

const App = () => {
  return (
    <Router>
      <Navigation />
      <Routes>
        {/* OPEN ACCESS PAGES */}
        <Route exact path="/" element={<LoginForm />} />
        <Route path="/register" element={<RegisterUser />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute privilegeLevel={1}>
              <HomePage />
            </ProtectedRoute>
          }
        />
        {/* PRIVATE PAGES */}
        <Route
          path="/users"
          element={
            <ProtectedRoute privilegeLevel={1}>
              <ManageUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute privilegeLevel={1}>
              <ManageTasks />
            </ProtectedRoute>
          }
        />
        <Route path="/task/:taskId" element={<TaskPage />} />
        <Route
          path="/events"
          element={
            <ProtectedRoute privilegeLevel={1}>
              <ManageEvents />
            </ProtectedRoute>
          }
        />
        <Route path="/event/:id" element={<EventPage />} />
        <Route
          path="/profile/:email"
          element={
            <ProtectedRoute privilegeLevel={1}>
              <Profile />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

const Navigation = () => {
  const location = useLocation();
  const noNavbarRoutes = ["/", "/register", "/forgot-password"]; // Add paths where Navbar should not be rendered
  const shouldDisplayNavbar = !noNavbarRoutes.includes(location.pathname);

  return shouldDisplayNavbar ? <Navbar /> : null;
};

export default App;
