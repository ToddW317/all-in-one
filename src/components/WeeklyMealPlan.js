import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
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

  useEffect(() => {
    if (currentUser?.familyId) {
      console.log('Fetching weekly meal plan...');
      fetchWeeklyMealPlan();
    }
  }, [currentUser, startDate, refreshTrigger]);

  const fetchWeeklyMealPlan = async () => {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    console.log('Fetching meals between:', startDate, 'and', endDate);

    const mealPlanRef = collection(firestore, 'families', currentUser.familyId, 'mealPlan');
    const q = query(
      mealPlanRef,
      where('date', '>=', startDate),
      where('date', '<', endDate)
    );

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
  };

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
          <h2>{meal.title}</h2>
          <img src={meal.image} alt={meal.title} />
          <h3>Ingredients:</h3>
          <ul>
            {meal.extendedIngredients.map((ingredient, index) => (
              <li key={index}>{ingredient.original}</li>
            ))}
          </ul>
          <h3>Instructions:</h3>
          <ol>
            {meal.analyzedInstructions[0].steps.map((step, index) => (
              <li key={index}>{step.step}</li>
            ))}
          </ol>
          <h3>Nutritional Information:</h3>
          <ul>
            <li>Calories: {meal.nutrition.nutrients.find(n => n.name === "Calories").amount} kcal</li>
            <li>Protein: {meal.nutrition.nutrients.find(n => n.name === "Protein").amount}g</li>
            <li>Carbohydrates: {meal.nutrition.nutrients.find(n => n.name === "Carbohydrates").amount}g</li>
            <li>Fat: {meal.nutrition.nutrients.find(n => n.name === "Fat").amount}g</li>
          </ul>
          <button onClick={onClose}>Close</button>
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