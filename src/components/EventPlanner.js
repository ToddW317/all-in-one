import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { firestore } from '../firebase';

function EventPlanner({ familyActivities }) {
  const { currentUser } = useAuth();
  const [newEvent, setNewEvent] = useState({ title: '', date: '', description: '' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent(prev => ({ ...prev, [name]: value }));
  };

  const addEvent = async (e) => {
    e.preventDefault();
    const eventRef = firestore.collection('families').doc(currentUser.familyId).collection('activities').doc();
    await eventRef.set({
      ...newEvent,
      createdAt: new Date(),
      status: 'planned',
      type: 'event'
    });
    setNewEvent({ title: '', date: '', description: '' });
  };

  const deleteEvent = async (eventId) => {
    await firestore.collection('families').doc(currentUser.familyId).collection('activities').doc(eventId).delete();
  };

  return (
    <div className="event-planner">
      <h2>Event Planner</h2>
      <form onSubmit={addEvent}>
        <input
          type="text"
          name="title"
          value={newEvent.title}
          onChange={handleInputChange}
          placeholder="Event Title"
          required
        />
        <input
          type="date"
          name="date"
          value={newEvent.date}
          onChange={handleInputChange}
          required
        />
        <textarea
          name="description"
          value={newEvent.description}
          onChange={handleInputChange}
          placeholder="Event Description"
        />
        <button type="submit">Add Event</button>
      </form>
      <ul>
        {familyActivities.filter(activity => activity.type === 'event').map(event => (
          <li key={event.id}>
            <h3>{event.title}</h3>
            <p>Date: {new Date(event.date).toLocaleDateString()}</p>
            <p>{event.description}</p>
            <button onClick={() => deleteEvent(event.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default EventPlanner;