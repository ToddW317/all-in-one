import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, updateDoc, deleteDoc, getDocs, query, where, doc } from 'firebase/firestore';
import { firestore } from '../firebase';
import { syncTasksToCalendar, syncMealsToCalendar } from '../services/eventIntegration';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

function FamilyCalendar() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({ title: '', start: new Date(), end: new Date(), allDay: false, type: 'general' });
  const [showEventTypes, setShowEventTypes] = useState({ general: true, task: true, meal: true, activity: true });

  useEffect(() => {
    if (currentUser?.familyId) {
      fetchEvents();
      syncTasksToCalendar(currentUser.familyId);
      syncMealsToCalendar(currentUser.familyId);
    }
  }, [currentUser]);

  const fetchEvents = async () => {
    if (!currentUser?.familyId) return;
    const eventsRef = collection(firestore, 'families', currentUser.familyId, 'events');
    const snapshot = await getDocs(eventsRef);
    const fetchedEvents = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      start: doc.data().start.toDate(),
      end: doc.data().end.toDate()
    }));
    setEvents(fetchedEvents);
  };

  const handleSelectSlot = ({ start, end }) => {
    setNewEvent({ ...newEvent, start, end });
  };

  const handleSelectEvent = (event) => {
    // Implement edit functionality here
    console.log(event);
  };

  const addEvent = async (e) => {
    e.preventDefault();
    if (!currentUser?.familyId) return;
    const eventsRef = collection(firestore, 'families', currentUser.familyId, 'events');
    await addDoc(eventsRef, newEvent);
    setNewEvent({ title: '', start: new Date(), end: new Date(), allDay: false, type: 'general' });
    fetchEvents();
  };

  const deleteEvent = async (eventId) => {
    if (!currentUser?.familyId) return;
    const eventRef = doc(firestore, 'families', currentUser.familyId, 'events', eventId);
    await deleteDoc(eventRef);
    fetchEvents();
  };

  const eventStyleGetter = (event) => {
    let style = {
      backgroundColor: '#3174ad',
      borderRadius: '0px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block'
    };

    switch (event.type) {
      case 'task':
        style.backgroundColor = '#ff9800';
        break;
      case 'meal':
        style.backgroundColor = '#4caf50';
        break;
      case 'activity':
        style.backgroundColor = '#e91e63';
        break;
      default:
        break;
    }

    return {
      style: style
    };
  };

  const filteredEvents = events.filter(event => showEventTypes[event.type]);

  return (
    <div className="family-calendar">
      <h2>Family Calendar</h2>
      <div className="event-type-toggles">
        {Object.keys(showEventTypes).map(type => (
          <label key={type}>
            <input
              type="checkbox"
              checked={showEventTypes[type]}
              onChange={() => setShowEventTypes(prev => ({ ...prev, [type]: !prev[type] }))}
            />
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </label>
        ))}
      </div>
      <form onSubmit={addEvent}>
        <input
          type="text"
          value={newEvent.title}
          onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
          placeholder="Event Title"
          required
        />
        <select
          value={newEvent.type}
          onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
        >
          <option value="general">General</option>
          <option value="task">Task</option>
          <option value="meal">Meal</option>
          <option value="activity">Activity</option>
        </select>
        <button type="submit">Add Event</button>
      </form>
      <Calendar
        localizer={localizer}
        events={filteredEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        selectable
        eventPropGetter={eventStyleGetter}
      />
    </div>
  );
}

export default FamilyCalendar;