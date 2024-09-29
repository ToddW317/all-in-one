import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { firestore } from '../firebase';
import { addEventToCalendar } from '../services/eventIntegration';
import MealPlanCalendar from './MealPlanCalendar';
import WeeklyMealPlan from './WeeklyMealPlan';
import GroceryListManager from './GroceryListManager';
import PantryInventory from './PantryInventory';
import RecipeBrowser from './RecipeBrowser';
import WasteLogger from './WasteLogger';
import MealPlanGenerator from './MealPlanGenerator';
import AIAssistant from './AIAssistant';

function MealPlanner() {
  const { currentUser } = useAuth();
  const [mealPlan, setMealPlan] = useState([]);
  const [groceryList, setGroceryList] = useState([]);
  const [pantryItems, setPantryItems] = useState([]);
  const [dietaryPreferences, setDietaryPreferences] = useState([]);
  const [budgetLimit, setBudgetLimit] = useState(0);
  const [refreshWeeklyPlan, setRefreshWeeklyPlan] = useState(0);

  const fetchMealPlan = useCallback(async () => {
    if (!currentUser?.familyId) return;
    const mealPlanRef = collection(firestore, 'families', currentUser.familyId, 'mealPlan');
    const snapshot = await getDocs(mealPlanRef);
    setMealPlan(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, [currentUser]);

  const fetchGroceryList = useCallback(async () => {
    if (!currentUser?.familyId) return;
    const groceryListRef = collection(firestore, 'families', currentUser.familyId, 'groceryList');
    const snapshot = await getDocs(groceryListRef);
    setGroceryList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, [currentUser]);

  const fetchPantryItems = useCallback(async () => {
    if (!currentUser?.familyId) return;
    const pantryRef = collection(firestore, 'families', currentUser.familyId, 'pantry');
    const snapshot = await getDocs(pantryRef);
    setPantryItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, [currentUser]);

  const fetchDietaryPreferences = useCallback(async () => {
    if (!currentUser?.familyId) return;
    const preferencesRef = doc(firestore, 'families', currentUser.familyId, 'preferences', 'dietary');
    const docSnap = await getDoc(preferencesRef);
    if (docSnap.exists()) {
      setDietaryPreferences(docSnap.data().preferences);
    }
  }, [currentUser]);

  const fetchBudgetLimit = useCallback(async () => {
    if (!currentUser?.familyId) return;
    const budgetRef = doc(firestore, 'families', currentUser.familyId, 'preferences', 'budget');
    const docSnap = await getDoc(budgetRef);
    if (docSnap.exists()) {
      setBudgetLimit(docSnap.data().limit);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchMealPlan();
    fetchGroceryList();
    fetchPantryItems();
    fetchDietaryPreferences();
    fetchBudgetLimit();
  }, [fetchMealPlan, fetchGroceryList, fetchPantryItems, fetchDietaryPreferences, fetchBudgetLimit]);

  const addMealToPlan = useCallback(async (meal) => {
    if (!currentUser?.familyId) return;
    const mealPlanRef = doc(collection(firestore, 'families', currentUser.familyId, 'mealPlan'));
    await setDoc(mealPlanRef, {
      ...meal,
      date: new Date(meal.date),
      createdAt: new Date()
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

  return (
    <div className="meal-planner">
      <h2>Meal Planner</h2>
      <WeeklyMealPlan refreshTrigger={refreshWeeklyPlan} />
      <AIAssistant
        pantryItems={pantryItems}
        onAddMealToPlan={addMealToPlan}
        refreshMealPlan={fetchMealPlan}
      />
      <MealPlanCalendar
        mealPlan={mealPlan}
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