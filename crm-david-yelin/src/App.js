import './App.css';
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './components/HomePage';
import LoginForm from './components/LoginForm';
import UserCreationForm from './components/UserCreationForm';
import RegistrationForm from './components/RegistrationForm';
import CreateEvent from './components/CreateEvent';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route exact path="/" element={<LoginForm/>} />
        <Route path="/profile" element={<HomePage/>} />
        <Route path="/create" element={<UserCreationForm/>} />
        <Route path="/register" element={<RegistrationForm/>} />
        <Route path="/create-event" element={<CreateEvent/>} />
      </Routes>
    </Router>
  );
}

export default App;