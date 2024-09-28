import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { firestore } from '../firebase';

const SPOONACULAR_API_KEY = '335591560d414e1ab8fcda61df384cdd';

function RecipeBrowser({ pantryItems, dietaryPreferences, onAddMealToPlan }) {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchRecipes = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const pantryIngredients = pantryItems.map(item => item.name).join(',');
      const response = await axios.get('https://api.spoonacular.com/recipes/complexSearch', {
        params: {
          apiKey: SPOONACULAR_API_KEY,
          query: searchQuery,
          includeIngredients: pantryIngredients,
          diet: dietaryPreferences.join(','),
          addRecipeInformation: true,
          fillIngredients: true,
          number: 10
        }
      });
      setRecipes(response.data.results);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      setError('Failed to fetch recipes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addToMealPlan = async (recipe) => {
    const meal = {
      recipeId: recipe.id,
      title: recipe.title,
      image: recipe.image,
      servings: recipe.servings,
      readyInMinutes: recipe.readyInMinutes,
      sourceUrl: recipe.sourceUrl,
      ingredients: recipe.extendedIngredients.map(ingredient => ({
        name: ingredient.name,
        amount: ingredient.amount,
        unit: ingredient.unit
      }))
    };
    await onAddMealToPlan(meal);
  };

  return (
    <div className="recipe-browser">
      <h3>Recipe Browser</h3>
      <form onSubmit={searchRecipes}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search recipes"
          required
        />
        <button type="submit">Search</button>
      </form>
      {loading && <p>Loading recipes...</p>}
      {error && <p className="error">{error}</p>}
      <div className="recipe-list">
        {recipes.map(recipe => (
          <div key={recipe.id} className="recipe-card">
            <img src={recipe.image} alt={recipe.title} />
            <h4>{recipe.title}</h4>
            <p>Ready in {recipe.readyInMinutes} minutes</p>
            <p>Servings: {recipe.servings}</p>
            <button onClick={() => addToMealPlan(recipe)}>Add to Meal Plan</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecipeBrowser;