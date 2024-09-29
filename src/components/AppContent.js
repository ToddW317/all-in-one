import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navigation from './Navigation';
import Home from '../pages/Home';
import Activities from '../pages/Activities';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import TaskManager from './TaskManager';
import Calendar from '../pages/Calendar';
import MealPlanner from './MealPlanner';

// Placeholder components for pages that haven't been implemented yet
const Budget = () => <div>Budget Page</div>;
const Health = () => <div>Health Page</div>;
const Education = () => <div>Education Page</div>;
const Documents = () => <div>Documents Page</div>;
const Communication = () => <div>Communication Page</div>;
const Profile = () => <div>Profile Page</div>;
const Settings = () => <div>Settings Page</div>;

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
}

export function AppContent() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      {currentUser && <Navigation />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/calendar" element={<PrivateRoute><Calendar /></PrivateRoute>} />
        <Route path="/tasks" element={<PrivateRoute><TaskManager /></PrivateRoute>} />
        <Route path="/meals" element={<PrivateRoute><MealPlanner /></PrivateRoute>} />
        <Route path="/budget" element={<PrivateRoute><Budget /></PrivateRoute>} />
        <Route path="/health" element={<PrivateRoute><Health /></PrivateRoute>} />
        <Route path="/education" element={<PrivateRoute><Education /></PrivateRoute>} />
        <Route path="/documents" element={<PrivateRoute><Documents /></PrivateRoute>} />
        <Route path="/communication" element={<PrivateRoute><Communication /></PrivateRoute>} />
        <Route path="/activities/*" element={<PrivateRoute><Activities /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
      </Routes>
    </div>
  );
}