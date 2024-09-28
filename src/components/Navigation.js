import React from 'react';
import { Link } from 'react-router-dom';

function Navigation() {
  return (
    <nav>
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/calendar">Calendar</Link></li>
        <li><Link to="/tasks">Tasks</Link></li>
        <li><Link to="/meals">Meals</Link></li>
        <li><Link to="/budget">Budget</Link></li>
        <li><Link to="/health">Health</Link></li>
        <li><Link to="/education">Education</Link></li>
        <li><Link to="/documents">Documents</Link></li>
        <li><Link to="/communication">Communication</Link></li>
        <li><Link to="/activities">Activities</Link></li>
        <li><Link to="/profile">Profile</Link></li>
        <li><Link to="/settings">Settings</Link></li>
      </ul>
    </nav>
  );
}

export default Navigation;