import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import TaskManager from '../components/TaskManager';
import MealPlanner from '../components/MealPlanner';
import EventPlanner from '../components/EventPlanner';
import VacationPlanner from '../components/VacationPlanner';
import BucketList from '../components/BucketList';

function Activities() {
  return (
    <div className="activities-page">
      <h1>Family Activities</h1>
      <nav>
        <ul>
          <li><Link to="/activities/tasks">Tasks</Link></li>
          <li><Link to="/activities/meals">Meal Planner</Link></li>
          <li><Link to="/activities/events">Events</Link></li>
          <li><Link to="/activities/vacations">Vacations</Link></li>
          <li><Link to="/activities/bucket-list">Bucket List</Link></li>
        </ul>
      </nav>

      <Routes>
        <Route path="tasks" element={<TaskManager />} />
        <Route path="meals" element={<MealPlanner />} />
        <Route path="events" element={<EventPlanner />} />
        <Route path="vacations" element={<VacationPlanner />} />
        <Route path="bucket-list" element={<BucketList />} />
        <Route index element={<div>Select an activity from the menu above</div>} />
      </Routes>
    </div>
  );
}

export default Activities;
