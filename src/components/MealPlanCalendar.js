import React from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

function MealPlanCalendar({ mealPlan, onSelectDate, onAddMeal }) {
  const events = mealPlan.map(meal => ({
    id: meal.id,
    title: meal.title,
    start: new Date(meal.date),
    end: new Date(meal.date),
    allDay: true,
    resource: meal
  }));

  return (
    <div className="meal-plan-calendar">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        onSelectSlot={(slotInfo) => onSelectDate(slotInfo.start)}
        onSelectEvent={(event) => onAddMeal(event.resource)}
        views={['month', 'week', 'day']}
      />
    </div>
  );
}

export default MealPlanCalendar;