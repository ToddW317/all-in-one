import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { firestore } from '../firebase';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import MealPlanCalendar from './MealPlanCalendar';
import GroceryListManager from './GroceryListManager';
import PantryInventory from './PantryInventory';
import RecipeBrowser from './RecipeBrowser';
import WasteLogger from './WasteLogger';
import MealPlanGenerator from './MealPlanGenerator';

const SPOONACULAR_API_KEY = 'YOUR_SPOONACULAR_API_KEY';

function MealPlanner({ currentUser }) {
  const [mealPlan, setMealPlan] = useState([]);
  const [groceryList, setGroceryList] = useState([]);
  const [pantryItems, setPantryItems] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dietaryPreferences, setDietaryPreferences] = useState([]);
  const [budgetLimit, setBudgetLimit] = useState(0);
  const [wasteLog, setWasteLog] = useState([]);

  useEffect(() => {
    fetchMealPlan();
    fetchGroceryList();
    fetchPantryItems();
    fetchDietaryPreferences();
    fetchBudgetLimit();
    fetchWasteLog();
  }, [currentUser.familyId]);

  const fetchMealPlan = async () => {
    const mealPlanRef = firestore.collection('families').doc(currentUser.familyId).collection('mealPlan');
    const snapshot = await mealPlanRef.get();
    setMealPlan(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchGroceryList = async () => {
    const groceryListRef = firestore.collection('families').doc(currentUser.familyId).collection('groceryList');
    const snapshot = await groceryListRef.get();
    setGroceryList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchPantryItems = async () => {
    const pantryRef = firestore.collection('families').doc(currentUser.familyId).collection('pantry');
    const snapshot = await pantryRef.get();
    setPantryItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchDietaryPreferences = async () => {
    const preferencesRef = firestore.collection('families').doc(currentUser.familyId).collection('preferences').doc('dietary');
    const doc = await preferencesRef.get();
    if (doc.exists) {
      setDietaryPreferences(doc.data().preferences);
    }
  };

  const fetchBudgetLimit = async () => {
    const budgetRef = firestore.collection('families').doc(currentUser.familyId).collection('preferences').doc('budget');
    const doc = await budgetRef.get();
    if (doc.exists) {
      setBudgetLimit(doc.data().limit);
    }
  };

  const fetchWasteLog = async () => {
    const wasteLogRef = firestore.collection('families').doc(currentUser.familyId).collection('wasteLog');
    const snapshot = await wasteLogRef.get();
    setWasteLog(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const addMealToPlan = async (meal) => {
    const mealPlanRef = firestore.collection('families').doc(currentUser.familyId).collection('mealPlan').doc();
    await mealPlanRef.set({
      ...meal,
      date: selectedDate,
      createdAt: firestore.FieldValue.serverTimestamp()
    });
    fetchMealPlan();
  };

  const generateGroceryList = async () => {
    const newGroceryList = [];
    mealPlan.forEach(meal => {
      meal.ingredients.forEach(ingredient => {
        const existingItem = newGroceryList.find(item => item.name === ingredient.name);
        if (existingItem) {
          existingItem.quantity += ingredient.quantity;
        } else {
          newGroceryList.push({ ...ingredient, id: uuidv4() });
        }
      });
    });

    // Remove items that are already in the pantry
    const finalGroceryList = newGroceryList.filter(item => {
      const pantryItem = pantryItems.find(pItem => pItem.name === item.name);
      return !pantryItem || pantryItem.quantity < item.quantity;
    });

    // Update Firestore
    const groceryListRef = firestore.collection('families').doc(currentUser.familyId).collection('groceryList');
    await groceryListRef.get().then((snapshot) => {
      snapshot.docs.forEach((doc) => doc.ref.delete());
    });
    await Promise.all(finalGroceryList.map(item => groceryListRef.doc(item.id).set(item)));

    setGroceryList(finalGroceryList);
  };

  const updatePantryItem = async (item, quantity) => {
    const pantryRef = firestore.collection('families').doc(currentUser.familyId).collection('pantry').doc(item.id);
    await pantryRef.update({ quantity });
    fetchPantryItems();
  };

  const fetchRecipes = async (query) => {
    try {
      const response = await axios.get(`https://api.spoonacular.com/recipes/complexSearch`, {
        params: {
          apiKey: SPOONACULAR_API_KEY,
          query: query,
          number: 10,
          diet: dietaryPreferences.join(','),
          maxReadyTime: 60,
          sort: 'popularity',
          addRecipeInformation: true,
          fillIngredients: true
        }
      });
      setRecipes(response.data.results);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    }
  };

  const logWaste = async (item, quantity, reason) => {
    const wasteLogRef = firestore.collection('families').doc(currentUser.familyId).collection('wasteLog').doc();
    await wasteLogRef.set({
      item,
      quantity,
      reason,
      date: new Date(),
      createdAt: firestore.FieldValue.serverTimestamp()
    });
    fetchWasteLog();
  };

  const generateMealPlan = async (days) => {
    try {
      const response = await axios.get(`https://api.spoonacular.com/mealplanner/generate`, {
        params: {
          apiKey: SPOONACULAR_API_KEY,
          timeFrame: `${days}day`,
          targetCalories: 2000, // This should be customizable per family member
          diet: dietaryPreferences.join(','),
        }
      });
      const generatedMealPlan = response.data.week;
      // Process and save the generated meal plan
      Object.keys(generatedMealPlan).forEach(async (day, index) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + index);
        const meals = generatedMealPlan[day].meals;
        for (let meal of meals) {
          await addMealToPlan({
            recipeId: meal.id,
            title: meal.title,
            date: date,
            mealType: getMealType(meal.slot)
          });
        }
      });
      fetchMealPlan();
    } catch (error) {
      console.error('Error generating meal plan:', error);
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
    <div className="meal-planner">
      <h2>Meal Planner</h2>
      <MealPlanCalendar
        mealPlan={mealPlan}
        onSelectDate={setSelectedDate}
        onAddMeal={addMealToPlan}
      />
      <MealPlanGenerator
        dietaryPreferences={dietaryPreferences}
        budgetLimit={budgetLimit}
        pantryItems={pantryItems}
        onAddMealToPlan={addMealToPlan}
      />
      <RecipeBrowser
        pantryItems={pantryItems}
        dietaryPreferences={dietaryPreferences}
        onAddMealToPlan={addMealToPlan}
      />
      <GroceryListManager
        groceryList={groceryList}
        pantryItems={pantryItems}
        onUpdateGroceryList={fetchGroceryList}
      />
      <PantryInventory
        pantryItems={pantryItems}
        onUpdatePantry={fetchPantryItems}
      />
      <WasteLogger />
    </div>
  );
}

export default MealPlanner;