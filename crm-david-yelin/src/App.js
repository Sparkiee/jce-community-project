import './App.css';
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './components/HomePage';
import LoginForm from './components/LoginForm';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route exact path="/" element={<LoginForm/>} />
        <Route path="/profile" element={<HomePage/>} />
      </Routes>
    </Router>
  );
}

export default App;