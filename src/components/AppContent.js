import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navigation from './Navigation';
import Home from '../pages/Home';
import Activities from '../pages/Activities';
import Login from '../pages/Login';
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

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      <Navigation />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/tasks" element={<TaskManager />} />
        <Route path="/meals" element={<MealPlanner />} />
        <Route path="/budget" element={<Budget />} />
        <Route path="/health" element={<Health />} />
        <Route path="/education" element={<Education />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/communication" element={<Communication />} />
        <Route path="/activities/*" element={<Activities />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </div>
  );
}

export default AppContent;