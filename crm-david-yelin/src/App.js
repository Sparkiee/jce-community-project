import "./App.css";
import React, {useEffect} from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useNavigate } from "react-router-dom";
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
import ManageEvents from "./components/ManageEvents";
import Cookies from 'js-cookie';
import { auth } from "./firebase";

import Navbar from "./components/Navbar";

const App = () => {
  return (
    <Router>
      <Navigation />
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
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/users" element={<ManageUsers />} />
        <Route path="/tasks" element={<ManageTasks />} />
        <Route path="/events" element={<ManageEvents />} />
      </Routes>
    </Router>
  );
};

const Navigation = () => {
  const location = useLocation();
  const noNavbarRoutes = ['/', '/register', '/forgot-password']; // Add paths where Navbar should not be rendered
  const shouldDisplayNavbar = !noNavbarRoutes.includes(location.pathname);

  return shouldDisplayNavbar ? <Navbar /> : null;
};

export default App;
