import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { useAuth } from '../contexts/AuthContext';
import { firestore } from '../firebase';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

function FamilyCalendar() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({
    title: '',
    start: new Date(),
    end: new Date(),
    allDay: false,
    category: 'general',
    recurringType: 'none',
    recurringEndDate: null
  });

  useEffect(() => {
    const fetchEvents = async () => {
      const eventsRef = firestore.collection('families').doc(currentUser.familyId).collection('events');
      const unsubscribe = eventsRef.onSnapshot(snapshot => {
        const fetchedEvents = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            start: data.start.toDate(),
            end: data.end.toDate(),
            allDay: data.allDay,
            category: data.category,
            recurringType: data.recurringType,
            recurringEndDate: data.recurringEndDate ? data.recurringEndDate.toDate() : null
          };
        });
        setEvents(fetchedEvents);
      });

      return () => unsubscribe();
    };

    fetchEvents();
  }, [currentUser.familyId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent(prev => ({ ...prev, [name]: value }));
  };

  const addEvent = async (e) => {
    e.preventDefault();
    const eventRef = firestore.collection('families').doc(currentUser.familyId).collection('events').doc();
    await eventRef.set({
      ...newEvent,
      start: firestore.Timestamp.fromDate(newEvent.start),
      end: firestore.Timestamp.fromDate(newEvent.end),
      recurringEndDate: newEvent.recurringEndDate ? firestore.Timestamp.fromDate(newEvent.recurringEndDate) : null
    });
    setNewEvent({
      title: '',
      start: new Date(),
      end: new Date(),
      allDay: false,
      category: 'general',
      recurringType: 'none',
      recurringEndDate: null
    });
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

    switch (event.category) {
      case 'work':
        style.backgroundColor = '#ff0000';
        break;
      case 'school':
        style.backgroundColor = '#00ff00';
        break;
      case 'family':
        style.backgroundColor = '#0000ff';
        break;
      default:
        break;
    }

    return {
      style: style
    };
  };

  return (
    <div className="family-calendar">
      <h2>Family Calendar</h2>
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
          type="datetime-local"
          name="start"
          value={moment(newEvent.start).format('YYYY-MM-DDTHH:mm')}
          onChange={(e) => setNewEvent(prev => ({ ...prev, start: new Date(e.target.value) }))}
          required
        />
        <input
          type="datetime-local"
          name="end"
          value={moment(newEvent.end).format('YYYY-MM-DDTHH:mm')}
          onChange={(e) => setNewEvent(prev => ({ ...prev, end: new Date(e.target.value) }))}
          required
        />
        <select
          name="category"
          value={newEvent.category}
          onChange={handleInputChange}
        >
          <option value="general">General</option>
          <option value="work">Work</option>
          <option value="school">School</option>
          <option value="family">Family</option>
        </select>
        <select
          name="recurringType"
          value={newEvent.recurringType}
          onChange={handleInputChange}
        >
          <option value="none">None</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
        {newEvent.recurringType !== 'none' && (
          <input
            type="date"
            name="recurringEndDate"
            value={newEvent.recurringEndDate ? moment(newEvent.recurringEndDate).format('YYYY-MM-DD') : ''}
            onChange={(e) => setNewEvent(prev => ({ ...prev, recurringEndDate: new Date(e.target.value) }))}
          />
        )}
        <button type="submit">Add Event</button>
      </form>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        eventPropGetter={eventStyleGetter}
      />
    </div>
  );
}

export default FamilyCalendar;