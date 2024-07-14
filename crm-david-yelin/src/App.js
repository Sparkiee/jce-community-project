import "./App.css";
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
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
import ManageDepartments from "./components/ManageDepartments";
import Navbar from "./components/Navbar";
import Chat from "./components/Chat";
import Statistics from "./components/Statistics";

const App = () => {
  return (
    <Router>
      <Navigation />
      <Routes>
        <Route
          path="*"
          element={
            <ProtectedRoute privilegeLevel={1}>
              <HomePage />
            </ProtectedRoute>
          }
        />
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
          path="/chat"
          element={
            <ProtectedRoute privilegeLevel={1}>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/statistics"
          element={
            <ProtectedRoute privilegeLevel={1} extraAccess={["viewStatistics"]}>
              <Statistics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute privilegeLevel={1} extraAccess={["createUser", "manageUser", "manageAdmin"]}>
              <ManageUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/departments"
          element={
            <ProtectedRoute privilegeLevel={1} extraAccess={["editDepartment", "deleteDepartment", "createDepartment"]}>
              <ManageDepartments />
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
        <Route
          path="/task/:taskId"
          element={
            <ProtectedRoute privilegeLevel={1}>
              <TaskPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events"
          element={
            <ProtectedRoute privilegeLevel={1}>
              <ManageEvents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/event/:id"
          element={
            <ProtectedRoute privilegeLevel={1}>
              <EventPage />
            </ProtectedRoute>
          }
        />
        <Route path="/event" element={<ProtectedRoute privilegeLevel={1}></ProtectedRoute>} />
        <Route
          path="/profile/:email"
          element={
            <ProtectedRoute privilegeLevel={1}>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
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
  const navigate = useNavigate();

  // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! DON'T DELETE FOR NOW !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! DON'T DELETE FOR NOW !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! DON'T DELETE FOR NOW !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  // Check if user is already logged in / session is stored with remember me, forwards him into the site
  // useEffect(() => {
  //   const session = JSON.parse(sessionStorage.getItem("user"));
  //   if (session !== null && session.privileges > 0) {
  //     // navigate("/home");
  //   }
  //   console.log(session);
  //   const user = JSON.parse(localStorage.getItem("user"));
  //   console.log(user);
  //   if (user !== null && user.privileges > 0) {
  //     navigate("/home");
  //   }
  // }, []);

  // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! DON'T DELETE FOR NOW !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! DON'T DELETE FOR NOW !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! DON'T DELETE FOR NOW !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const user = JSON.parse(localStorage.getItem("user"));
        const session = JSON.parse(sessionStorage.getItem("user"));
        if (
          currentUser &&
          (user !== null || session !== null) &&
          ((user && user.privileges > 0) || (session && session.privileges > 0))
        ) {
          navigate("/home");
        } else {
          navigate("/");
        }
      } else {
        navigate("/");
      }
    });

    return () => unsubscribe();
  }, []);

  const location = useLocation();
  const noNavbarRoutes = ["/", "/register", "/forgot-password"]; // Add paths where Navbar should not be rendered
  const shouldDisplayNavbar = !noNavbarRoutes.includes(location.pathname);

  return shouldDisplayNavbar ? <Navbar /> : null;
};

export default App;
