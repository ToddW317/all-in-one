import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { firestore } from '../firebase';
import { BrowserRouter as Router, Route, Link, Switch } from 'react-router-dom';
import ActivitySuggestions from '../components/ActivitySuggestions';
import EventPlanner from '../components/EventPlanner';
import VacationPlanner from '../components/VacationPlanner';
import BucketList from '../components/BucketList';
import FamilyCalendar from '../components/FamilyCalendar';
import TaskManager from '../components/TaskManager';
import MealPlanner from '../components/MealPlanner';

function Activities() {
  const { currentUser } = useAuth();
  const [familyActivities, setFamilyActivities] = useState([]);

  useEffect(() => {
    const fetchFamilyActivities = async () => {
      const activitiesRef = firestore.collection('families').doc(currentUser.familyId).collection('activities');
      const unsubscribe = activitiesRef.onSnapshot(snapshot => {
        setFamilyActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      return () => unsubscribe();
    };

    fetchFamilyActivities();
  }, [currentUser.familyId]);

  return (
    <Router>
      <div className="activities-page">
        <h1>Family Activities</h1>
        <nav>
          <ul>
            <li><Link to="/activities/calendar">Calendar</Link></li>
            <li><Link to="/activities/tasks">Tasks</Link></li>
            <li><Link to="/activities/meals">Meal Planner</Link></li>
            <li><Link to="/activities/events">Events</Link></li>
            <li><Link to="/activities/vacations">Vacations</Link></li>
            <li><Link to="/activities/bucket-list">Bucket List</Link></li>
          </ul>
        </nav>

        <Switch>
          <Route path="/activities/calendar">
            <FamilyCalendar />
          </Route>
          <Route path="/activities/tasks">
            <TaskManager />
          </Route>
          <Route path="/activities/meals">
            <MealPlanner currentUser={currentUser} />
          </Route>
          <Route path="/activities/events">
            <EventPlanner familyActivities={familyActivities} />
          </Route>
          <Route path="/activities/vacations">
            <VacationPlanner familyActivities={familyActivities} />
          </Route>
          <Route path="/activities/bucket-list">
            <BucketList familyActivities={familyActivities} />
          </Route>
          <Route path="/activities">
            <ActivitySuggestions />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

export default Activities;
