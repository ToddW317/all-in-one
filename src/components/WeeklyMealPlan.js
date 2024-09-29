import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { firestore } from '../firebase';
import './WeeklyMealPlan.css';
import axios from 'axios';

const SPOONACULAR_API_KEY = '335591560d414e1ab8fcda61df384cdd';

function WeeklyMealPlan({ refreshTrigger }) {
  const { currentUser } = useAuth();

  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const [weeklyPlan, setWeeklyPlan] = useState({});
  const [startDate, setStartDate] = useState(getStartOfWeek(new Date()));
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);

  const fetchWeeklyMealPlan = useCallback(async () => {
    if (!currentUser?.familyId) return;

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    console.log('Fetching meals between:', startDate, 'and', endDate);

    const mealPlanRef = collection(firestore, 'families', currentUser.familyId, 'mealPlan');
    const q = query(
      mealPlanRef,
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<', Timestamp.fromDate(endDate))
    );

    try {
      const snapshot = await getDocs(q);
      const meals = {};
      snapshot.forEach(doc => {
        const meal = doc.data();
        const date = meal.date.toDate().toDateString();
        if (!meals[date]) {
          meals[date] = [];
        }
        meals[date].push(meal);
      });
      console.log('Fetched weekly meal plan:', meals);
      setWeeklyPlan(meals);
    } catch (error) {
      console.error('Error fetching weekly meal plan:', error);
      setError('Failed to fetch weekly meal plan.');
    }
  }, [currentUser, startDate]);

  useEffect(() => {
    if (currentUser?.familyId) {
      console.log('Fetching weekly meal plan...');
      fetchWeeklyMealPlan();
    }
  }, [currentUser, startDate, refreshTrigger, fetchWeeklyMealPlan]);

  const getDayName = (date) => {
    return new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
  };

  const changeWeek = (direction) => {
    const newDate = new Date(startDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setStartDate(newDate);
  };

  const fetchRecipeDetails = async (recipeId) => {
    try {
      const response = await axios.get(`https://api.spoonacular.com/recipes/${recipeId}/information`, {
        params: {
          apiKey: SPOONACULAR_API_KEY,
          includeNutrition: true
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching recipe details:', error);
      return null;
    }
  };

  const handleMealClick = async (meal) => {
    const recipeDetails = await fetchRecipeDetails(meal.recipeId);
    setSelectedMeal({ ...meal, ...recipeDetails });
    setShowModal(true);
  };

  const RecipeModal = ({ meal, onClose }) => {
    if (!meal) return null;
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h2>{meal.title} Ingredients</h2>
          <img src={meal.image} alt={meal.title} />
          <ul>
            {meal.extendedIngredients.map((ingredient, index) => (
              <li key={index}>{ingredient.original}</li>
            ))}
          </ul>
          <button onClick={onClose} className="close-button">Close</button>
        </div>
      </div>
    );
  };

  return (
    <div className="weekly-meal-plan">
      <h2>Weekly Meal Plan</h2>
      <div className="week-navigation">
        <button onClick={() => changeWeek(-1)}>Previous Week</button>
        <span>{startDate.toDateString()} - {new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000).toDateString()}</span>
        <button onClick={() => changeWeek(1)}>Next Week</button>
      </div>
      <div className="meal-grid">
        {[...Array(7)].map((_, index) => {
          const currentDate = new Date(startDate);
          currentDate.setDate(currentDate.getDate() + index);
          const dateString = currentDate.toDateString();
          console.log('Rendering date:', dateString, 'Meals:', weeklyPlan[dateString]);
          return (
            <div key={dateString} className="day-column">
              <h3>{getDayName(currentDate)}</h3>
              <p>{dateString}</p>
              {weeklyPlan[dateString]?.map((meal, mealIndex) => (
                <div key={mealIndex} className="meal-item" onClick={() => handleMealClick(meal)}>
                  <h4>{meal.mealType}</h4>
                  <p>{meal.title}</p>
                </div>
              )) || <p>No meals planned</p>}
            </div>
          );
        })}
      </div>
      {showModal && <RecipeModal meal={selectedMeal} onClose={() => setShowModal(false)} />}
    </div>
  );
}

export default WeeklyMealPlan;