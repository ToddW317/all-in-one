import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { firestore } from '../firebase';
import axios from 'axios';

const SPOONACULAR_API_KEY = 'YOUR_SPOONACULAR_API_KEY';

function MealPlanGenerator({ dietaryPreferences, budgetLimit, pantryItems, onAddMealToPlan }) {
  const { currentUser } = useAuth();
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(7);
  const [targetCalories, setTargetCalories] = useState(2000);

  const generateMealPlan = async () => {
    setGeneratingPlan(true);
    setError(null);

    try {
      const response = await axios.get(`https://api.spoonacular.com/mealplanner/generate`, {
        params: {
          apiKey: SPOONACULAR_API_KEY,
          timeFrame: `${days}day`,
          targetCalories: targetCalories,
          diet: dietaryPreferences.join(','),
          exclude: pantryItems.map(item => item.name).join(',')
        }
      });

      const plan = response.data;
      setGeneratedPlan(plan);

      // Save the generated meal plan to Firestore
      const mealPlanRef = firestore.collection('families').doc(currentUser.familyId).collection('mealPlans').doc();
      await mealPlanRef.set({
        plan: plan,
        createdAt: firestore.FieldValue.serverTimestamp(),
        days: days,
        targetCalories: targetCalories
      });

      // Add meals to the meal planner
      const startDate = new Date();
      Object.entries(plan.week).forEach(([day, meals], index) => {
        const date = new Date(startDate);
        date.setDate(date.getDate() + index);
        meals.meals.forEach(meal => {
          onAddMealToPlan({
            recipeId: meal.id,
            title: meal.title,
            date: date,
            mealType: getMealType(meal.slot)
          });
        });
      });

    } catch (error) {
      console.error('Error generating meal plan:', error);
      setError('Failed to generate meal plan. Please try again.');
    } finally {
      setGeneratingPlan(false);
    }
  };

  const getMealType = (slot) => {
    switch (slot) {
      case 1: return 'breakfast';
      case 2: return 'lunch';
      case 3: return 'dinner';
      default: return 'snack';
    }
  };

  return (
    <div className="meal-plan-generator">
      <h3>AI Meal Plan Generator</h3>
      <div>
        <label>
          Number of days:
          <input
            type="number"
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            min="1"
            max="7"
          />
        </label>
      </div>
      <div>
        <label>
          Target calories per day:
          <input
            type="number"
            value={targetCalories}
            onChange={(e) => setTargetCalories(parseInt(e.target.value))}
            min="1000"
            max="4000"
            step="100"
          />
        </label>
      </div>
      <button onClick={generateMealPlan} disabled={generatingPlan}>
        {generatingPlan ? 'Generating...' : 'Generate Meal Plan'}
      </button>
      {error && <p className="error">{error}</p>}
      {generatedPlan && (
        <div className="generated-plan">
          <h4>Generated Meal Plan</h4>
          {Object.entries(generatedPlan.week).map(([day, meals]) => (
            <div key={day}>
              <h5>{day}</h5>
              <ul>
                {meals.meals.map(meal => (
                  <li key={meal.id}>
                    {getMealType(meal.slot)}: {meal.title}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p>Total Calories: {generatedPlan.nutrients.calories.toFixed(2)}</p>
          <p>Total Cost: ${generatedPlan.nutrients.cost.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
}

export default MealPlanGenerator;