import './App.css';
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import LoginForm from './components/LoginForm';
import HomePage from './components/HomePage';
import UserCreationForm from './components/UserCreationForm';
import RegistrationForm from './components/RegistrationForm';
import CreateEvent from './components/CreateEvent';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route exact path="/" element={<LoginForm/>} />
        <Route path="/home" element={<ProtectedRoute privilegeLevel={1} ><HomePage/></ProtectedRoute>} />
        <Route path="/create" element={<ProtectedRoute privilegeLevel={3} ><UserCreationForm/></ProtectedRoute>} />
        <Route path="/register" element={<RegistrationForm/>} />
        <Route path="/create-event" element={<CreateEvent/>} />
      </Routes>
    </Router>
  );
}

export default App;