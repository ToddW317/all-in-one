import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import TaskManager from '../components/TaskManager';
import MealPlanner from '../components/MealPlanner';
import EventPlanner from '../components/EventPlanner';
import VacationPlanner from '../components/VacationPlanner';
import BucketList from '../components/BucketList';
import AIAssistant from '../components/AIAssistant';
import WeeklyMealPlan from '../components/WeeklyMealPlan';
import { firestore } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

function Activities() {
  const [refreshMealPlanTrigger, setRefreshMealPlanTrigger] = useState(0);
  const [pantryItems, setPantryItems] = useState([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser?.familyId) {
      fetchPantryItems();
    }
  }, [currentUser]);

  const fetchPantryItems = async () => {
    try {
      const pantryRef = collection(firestore, 'families', currentUser.familyId, 'pantry');
      const snapshot = await getDocs(pantryRef);
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPantryItems(items);
    } catch (error) {
      console.error('Error fetching pantry items:', error);
    }
  };

  const refreshMealPlan = () => {
    console.log('Refreshing meal plan...');
    setRefreshMealPlanTrigger(prev => prev + 1);
  };

  const handleAddMealToPlan = (meal) => {
    console.log('Meal added to plan:', meal);
    // You can add any additional logic here if needed
    refreshMealPlan();
  };

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

      <AIAssistant 
        pantryItems={pantryItems} 
        onAddMealToPlan={handleAddMealToPlan} 
        refreshMealPlan={refreshMealPlan}
      />
      <WeeklyMealPlan refreshTrigger={refreshMealPlanTrigger} />
    </div>
  );
}

export default Activities;
