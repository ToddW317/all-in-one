import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { firestore } from '../firebase';
import './AIAssistant.css';
import DatePicker from 'react-datepicker'; // You'll need to install this package
import 'react-datepicker/dist/react-datepicker.css';

const GEMINI_API_KEY = 'AIzaSyBsyGT48F-mMOHOHQl-lob3Z6IENclpIZA';
const SPOONACULAR_API_KEY = '335591560d414e1ab8fcda61df384cdd';

function AIAssistant({ pantryItems, onAddMealToPlan }) {
  const { currentUser } = useAuth();
  const [userInput, setUserInput] = useState('');
  const [suggestedRecipes, setSuggestedRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMealType, setSelectedMealType] = useState('lunch');
  const [showAddToPlanModal, setShowAddToPlanModal] = useState(false);
  const [recipeToAdd, setRecipeToAdd] = useState(null);

  const askGemini = async () => {
    setLoading(true);
    setError(null);
    console.log("Asking Gemini with input:", userInput);
    console.log("Pantry items:", pantryItems);
    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
            {
              contents: [{
                parts: [{
                  text: `As a sous chef, given these pantry items: ${pantryItems.map(item => item.name).join(', ')}, 
                         and this user request: "${userInput}", 
                         suggest 3 simple meal ideas that use ingredients from the pantry. Format your response as a numbered list of just the meal names, keeping each name short and general.`
                }]
              }]
            }
          );
      console.log("Gemini API response:", response.data);

      if (response.data && response.data.candidates && response.data.candidates[0] && response.data.candidates[0].content) {
        const suggestions = response.data.candidates[0].content.parts[0].text;
        console.log("Extracted suggestions:", suggestions);
        const mealNames = extractMealNames(suggestions);
        console.log("Extracted meal names:", mealNames);
        if (mealNames.length > 0) {
          await fetchRecipeDetails(mealNames);
        } else {
          setError("Couldn't parse meal suggestions from AI response. Please try again.");
        }
      } else {
        console.error("Unexpected API response structure:", response.data);
        setError("Received an unexpected response from the AI.");
      }
    } catch (error) {
      console.error('Error asking Gemini or fetching recipes:', error);
      setError('Sorry, I encountered an error while processing your request.');
    }
    setLoading(false);
  };

  const extractMealNames = (response) => {
    const mealNames = response.match(/\d+\.\s*([^\n]+)/g);
    return mealNames ? mealNames.map(name => name.replace(/^\d+\.\s*/, '').trim()) : [];
  };

  const fetchRecipeDetails = async (mealNames) => {
    console.log("Fetching recipe details for:", mealNames);
    try {
      const recipePromises = mealNames.map(meal => 
        axios.get('https://api.spoonacular.com/recipes/complexSearch', {
          params: {
            apiKey: SPOONACULAR_API_KEY,
            query: meal,
            number: 3,
            addRecipeInformation: true,
            includeNutrition: true
          }
        })
      );
  
      const recipeResponses = await Promise.all(recipePromises);
    console.log("Spoonacular API responses:", recipeResponses);
    
    let recipes = [];
    for (let i = 0; i < recipeResponses.length; i++) {
      const response = recipeResponses[i];
      console.log("Processing response:", response.data);
      if (response.data.results && response.data.results.length > 0) {
        recipes = recipes.concat(response.data.results.map(recipe => ({
          id: recipe.id,
          title: recipe.title,
          image: recipe.image,
          readyInMinutes: recipe.readyInMinutes,
          servings: recipe.servings,
          pricePerServing: ((recipe.pricePerServing || 0) / 100).toFixed(2),
          calories: Math.round(recipe.nutrition?.nutrients?.find(n => n.name === "Calories")?.amount || 0)
        })));
      } else {
        console.log("No results found for:", mealNames[i]);
        // If no results, try a more general search
        const generalSearch = await axios.get('https://api.spoonacular.com/recipes/complexSearch', {
          params: {
            apiKey: SPOONACULAR_API_KEY,
            query: mealNames[i].split(' ')[0], // Use only the first word of the meal name
            number: 1,
            addRecipeInformation: true,
            includeNutrition: true
          }
        });
        if (generalSearch.data.results && generalSearch.data.results.length > 0) {
          recipes = recipes.concat(generalSearch.data.results.map(recipe => ({
            id: recipe.id,
            title: recipe.title,
            image: recipe.image,
            readyInMinutes: recipe.readyInMinutes,
            servings: recipe.servings,
            pricePerServing: ((recipe.pricePerServing || 0) / 100).toFixed(2),
            calories: Math.round(recipe.nutrition?.nutrients?.find(n => n.name === "Calories")?.amount || 0)
          })));
        }
        }
      }
      
      console.log("Processed recipes:", recipes);
      setSuggestedRecipes(recipes);
      
      if (recipes.length === 0) {
        setError("No recipes found. Please try different meal suggestions.");
      }
    } catch (error) {
      console.error('Error fetching recipe details:', error);
      setError('Failed to fetch recipe details. Please try again.');
    }
  };

  const replaceRecipe = async (index) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{
              text: `As a sous chef, given these pantry items: ${pantryItems.map(item => item.name).join(', ')}, 
                     suggest 1 alternative meal idea that uses ingredients from the pantry. It should be different from: ${suggestedRecipes.map(r => r.title).join(', ')}.`
            }]
          }]
        }
      );

      if (response.data && response.data.candidates && response.data.candidates[0] && response.data.candidates[0].content) {
        const suggestion = response.data.candidates[0].content.parts[0].text;
        const newMealName = suggestion.trim();
        await fetchRecipeDetails([newMealName]);
      } else {
        setError("Received an unexpected response from the AI.");
      }
    } catch (error) {
      console.error('Error replacing recipe:', error);
      setError('Sorry, I encountered an error while replacing the recipe.');
    }
    setLoading(false);
  };

  const viewIngredients = async (recipeId) => {
    try {
      const response = await axios.get(`https://api.spoonacular.com/recipes/${recipeId}/information`, {
        params: {
          apiKey: SPOONACULAR_API_KEY,
          includeNutrition: false
        }
      });
      setSelectedRecipe(response.data);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching recipe details:', error);
      setError('Failed to fetch recipe details. Please try again.');
    }
  };

  const handleAddToMealPlan = (recipe) => {
    setRecipeToAdd(recipe);
    setShowAddToPlanModal(true);
  };

  const confirmAddToMealPlan = () => {
    if (recipeToAdd) {
      onAddMealToPlan({
        ...recipeToAdd,
        date: selectedDate,
        mealType: selectedMealType
      });
      setShowAddToPlanModal(false);
      setRecipeToAdd(null);
    }
  };

  const AddToPlanModal = () => {
    if (!showAddToPlanModal) return null;
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h2>Add to Meal Plan</h2>
          <DatePicker
            selected={selectedDate}
            onChange={date => setSelectedDate(date)}
            dateFormat="MMMM d, yyyy"
          />
          <select
            value={selectedMealType}
            onChange={e => setSelectedMealType(e.target.value)}
          >
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
          </select>
          <button onClick={confirmAddToMealPlan}>Confirm</button>
          <button onClick={() => setShowAddToPlanModal(false)}>Cancel</button>
        </div>
      </div>
    );
  };

  const Modal = ({ recipe, onClose }) => {
    if (!recipe) return null;
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h2>{recipe.title} Ingredients</h2>
          <ul>
            {recipe.extendedIngredients.map((ingredient, index) => (
              <li key={index}>{ingredient.original}</li>
            ))}
          </ul>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    );
  };

  return (
    <div className="ai-assistant">
      <h3>AI Sous Chef</h3>
      <textarea
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        placeholder="Tell me what you're craving or any dietary preferences..."
        className="user-input"
      />
      <button onClick={askGemini} disabled={loading} className="ask-button">
        {loading ? 'Cooking up ideas...' : 'Ask Sous Chef'}
      </button>
      {error && <p className="error">{error}</p>}
      {suggestedRecipes.length > 0 && (
        <div className="suggested-recipes">
          <h4>Ding Ding! Here is the menu! Please select which items you would like to add to your weekly meal plan for this week.</h4>
          <div className="recipe-grid">
            {suggestedRecipes.map((recipe, index) => (
              <div key={recipe.id} className="recipe-card">
                <h5>{recipe.title}</h5>
                <img src={recipe.image} alt={recipe.title} className="recipe-image" />
                <p>Ready in {recipe.readyInMinutes} minutes</p>
                <p>Servings: {recipe.servings}</p>
                <p>Cost per serving: ${recipe.pricePerServing}</p>
                <p>Calories: {recipe.calories}</p>
                <div className="recipe-buttons">
                  <button onClick={() => handleAddToMealPlan(recipe)} className="add-button">Add to Meal Plan</button>
                  <button onClick={() => replaceRecipe(index)} disabled={loading} className="replace-button">
                    {loading ? 'Replacing...' : 'Replace'}
                  </button>
                  <button onClick={() => viewIngredients(recipe.id)} className="view-ingredients-button">
                    View Ingredients
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {showModal && <Modal recipe={selectedRecipe} onClose={() => setShowModal(false)} />}
      <AddToPlanModal />
    </div>
  );
}

export default AIAssistant;