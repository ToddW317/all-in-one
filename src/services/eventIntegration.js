import { collection, addDoc, updateDoc, deleteDoc, query, where, getDocs, doc } from 'firebase/firestore';
import { firestore } from '../firebase';

export const addEventToCalendar = async (familyId, event) => {
  const eventsRef = collection(firestore, 'families', familyId, 'events');
  await addDoc(eventsRef, {
    ...event,
    createdAt: new Date()
  });
};

export const updateEventInCalendar = async (familyId, eventId, updates) => {
  const eventRef = doc(firestore, 'families', familyId, 'events', eventId);
  await updateDoc(eventRef, updates);
};

export const deleteEventFromCalendar = async (familyId, eventId) => {
  const eventRef = doc(firestore, 'families', familyId, 'events', eventId);
  await deleteDoc(eventRef);
};

export const syncTasksToCalendar = async (familyId) => {
  const tasksRef = collection(firestore, 'families', familyId, 'tasks');
  const taskSnapshot = await getDocs(tasksRef);
  
  taskSnapshot.forEach(async (doc) => {
    const task = doc.data();
    await addEventToCalendar(familyId, {
      title: task.title,
      start: new Date(task.dueDate),
      end: new Date(task.dueDate),
      allDay: true,
      type: 'task',
      taskId: doc.id
    });
  });
};

export const syncMealsToCalendar = async (familyId) => {
  const mealsRef = collection(firestore, 'families', familyId, 'mealPlan');
  const mealSnapshot = await getDocs(mealsRef);
  
  mealSnapshot.forEach(async (doc) => {
    const meal = doc.data();
    await addEventToCalendar(familyId, {
      title: `${meal.mealType}: ${meal.title}`,
      start: new Date(meal.date),
      end: new Date(meal.date),
      allDay: false,
      type: 'meal',
      mealId: doc.id
    });
  });
};