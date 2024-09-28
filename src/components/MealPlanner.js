import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../firebase';
import { addEventToCalendar, updateEventInCalendar, deleteEventFromCalendar } from '../services/eventIntegration';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import MealPlanCalendar from './MealPlanCalendar';
import WeeklyMealPlan from './WeeklyMealPlan';
import GroceryListManager from './GroceryListManager';
import PantryInventory from './PantryInventory';
import RecipeBrowser from './RecipeBrowser';
import WasteLogger from './WasteLogger';
import MealPlanGenerator from './MealPlanGenerator';
import AIAssistant from './AIAssistant';

const SPOONACULAR_API_KEY = '335591560d414e1ab8fcda61df384cdd';

function MealPlanner() {
  const { currentUser } = useAuth();
  const [mealPlan, setMealPlan] = useState([]);
  const [groceryList, setGroceryList] = useState([]);
  const [pantryItems, setPantryItems] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dietaryPreferences, setDietaryPreferences] = useState([]);
  const [budgetLimit, setBudgetLimit] = useState(0);
  const [wasteLog, setWasteLog] = useState([]);
  const [refreshWeeklyPlan, setRefreshWeeklyPlan] = useState(0);

  useEffect(() => {
    // For testing, we'll fetch data regardless of authentication state
    fetchMealPlan();
    fetchGroceryList();
    fetchPantryItems();
    fetchDietaryPreferences();
    fetchBudgetLimit();
    fetchWasteLog();
  }, []);

  const fetchMealPlan = async () => {
    if (!currentUser?.familyId) return;
    const mealPlanRef = collection(firestore, 'families', currentUser.familyId, 'mealPlan');
    const snapshot = await getDocs(mealPlanRef);
    setMealPlan(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchGroceryList = async () => {
    if (!currentUser?.familyId) return;
    const groceryListRef = collection(firestore, 'families', currentUser.familyId, 'groceryList');
    const snapshot = await getDocs(groceryListRef);
    setGroceryList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchPantryItems = async () => {
    if (!currentUser?.familyId) return;
    const pantryRef = collection(firestore, 'families', currentUser.familyId, 'pantry');
    const snapshot = await getDocs(pantryRef);
    setPantryItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchDietaryPreferences = async () => {
    if (!currentUser?.familyId) return;
    const preferencesRef = doc(firestore, 'families', currentUser.familyId, 'preferences', 'dietary');
    const doc = await getDoc(preferencesRef);
    if (doc.exists) {
      setDietaryPreferences(doc.data().preferences);
    }
  };

  const fetchBudgetLimit = async () => {
    if (!currentUser?.familyId) return;
    const budgetRef = doc(firestore, 'families', currentUser.familyId, 'preferences', 'budget');
    const doc = await getDoc(budgetRef);
    if (doc.exists) {
      setBudgetLimit(doc.data().limit);
    }
  };

  const fetchWasteLog = async () => {
    if (!currentUser?.familyId) return;
    const wasteLogRef = collection(firestore, 'families', currentUser.familyId, 'wasteLog');
    const snapshot = await getDocs(wasteLogRef);
    setWasteLog(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const addMealToPlan = useCallback(async (meal) => {
    if (!currentUser?.familyId) return;
    const mealPlanRef = doc(collection(firestore, 'families', currentUser.familyId, 'mealPlan'));
    await setDoc(mealPlanRef, {
      ...meal,
      date: new Date(meal.date), // Ensure date is a Firestore timestamp
      createdAt: new Date()
    });

    console.log('Meal added to plan:', meal);
    console.log('Expected output after adding meal:', {
      [meal.date.toDateString()]: [meal]
    });

    await addEventToCalendar(currentUser.familyId, {
      title: `${meal.mealType}: ${meal.title}`,
      start: new Date(meal.date),
      end: new Date(meal.date),
      allDay: false,
      type: 'meal',
      mealId: mealPlanRef.id
    });

    fetchMealPlan();
    setRefreshWeeklyPlan(prev => prev + 1);
  }, [currentUser, fetchMealPlan]);

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
    const groceryListRef = collection(firestore, 'families', currentUser.familyId, 'groceryList');
    await getDocs(groceryListRef).then((snapshot) => {
      snapshot.docs.forEach((doc) => doc.ref.delete());
    });
    await Promise.all(finalGroceryList.map(item => setDoc(groceryListRef.doc(item.id), item)));

    setGroceryList(finalGroceryList);
  };

  const updatePantryItem = async (item, quantity) => {
    if (!currentUser?.familyId) return;
    const pantryRef = doc(collection(firestore, 'families', currentUser.familyId, 'pantry'), item.id);
    await updateDoc(pantryRef, { quantity });
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
    if (!currentUser?.familyId) return;
    const wasteLogRef = doc(collection(firestore, 'families', currentUser.familyId, 'wasteLog'));
    await setDoc(wasteLogRef, {
      item,
      quantity,
      reason,
      date: new Date(),
      createdAt: new Date()
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
      <WeeklyMealPlan refreshTrigger={refreshWeeklyPlan} />
      <AIAssistant
        pantryItems={pantryItems}
        onAddMealToPlan={addMealToPlan}
      />
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