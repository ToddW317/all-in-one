import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { firestore } from '../firebase';

function ActivitySuggestions() {
  const { currentUser } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [familyPreferences, setFamilyPreferences] = useState({});

  useEffect(() => {
    const fetchFamilyPreferences = async () => {
      const preferencesRef = firestore.collection('families').doc(currentUser.familyId).collection('preferences').doc('activities');
      const doc = await preferencesRef.get();
      if (doc.exists) {
        setFamilyPreferences(doc.data());
      }
    };

    fetchFamilyPreferences();
  }, [currentUser.familyId]);

  useEffect(() => {
    const generateSuggestions = async () => {
      // Here you would typically call an API or use an algorithm to generate suggestions
      // based on familyPreferences, weather, time of year, etc.
      // For this example, we'll use a simple mock-up
      const mockSuggestions = [
        { id: 1, title: 'Family Game Night', description: 'Play board games together', cost: 'Free' },
        { id: 2, title: 'Picnic in the Park', description: 'Enjoy nature and pack a lunch', cost: 'Low' },
        { id: 3, title: 'Movie Marathon', description: 'Watch a series of movies at home', cost: 'Low' },
      ];

      setSuggestions(mockSuggestions);
    };

    if (Object.keys(familyPreferences).length > 0) {
      generateSuggestions();
    }
  }, [familyPreferences]);

  const handleSuggestionClick = async (suggestion) => {
    const activityRef = firestore.collection('families').doc(currentUser.familyId).collection('activities').doc();
    await activityRef.set({
      ...suggestion,
      createdAt: new Date(),
      status: 'planned'
    });
    // Here you would typically update the global state or emit an event
    // to inform other components that a new activity has been added
  };

  return (
    <div className="activity-suggestions">
      <h2>Suggested Activities</h2>
      <ul>
        {suggestions.map(suggestion => (
          <li key={suggestion.id} onClick={() => handleSuggestionClick(suggestion)}>
            <h3>{suggestion.title}</h3>
            <p>{suggestion.description}</p>
            <p>Cost: {suggestion.cost}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ActivitySuggestions;