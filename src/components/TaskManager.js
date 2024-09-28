import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, updateDoc, deleteDoc, getDocs, doc, query, where, orderBy } from 'firebase/firestore';
import { firestore } from '../firebase';
import { addEventToCalendar, updateEventInCalendar, deleteEventFromCalendar } from '../services/eventIntegration';

function TaskManager() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignee: '',
    dueDate: '',
    priority: 'medium',
    status: 'not started',
    isRecurring: false,
    recurrencePattern: ''
  });
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('dueDate');

  useEffect(() => {
    fetchTasks();
  }, [currentUser, filter, sort]);

  const fetchTasks = async () => {
    if (!currentUser || !currentUser.familyId) return;

    const tasksRef = collection(firestore, 'families', currentUser.familyId, 'tasks');
    let q = query(tasksRef);

    if (filter !== 'all') {
      q = query(q, where('status', '==', filter));
    }

    q = query(q, orderBy(sort, 'asc'));

    const snapshot = await getDocs(q);
    setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!currentUser || !currentUser.familyId) return;

    const tasksRef = collection(firestore, 'families', currentUser.familyId, 'tasks');
    const docRef = await addDoc(tasksRef, {
      ...newTask,
      createdAt: new Date(),
      createdBy: currentUser.uid
    });

    await addEventToCalendar(currentUser.familyId, {
      title: newTask.title,
      start: new Date(newTask.dueDate),
      end: new Date(newTask.dueDate),
      allDay: true,
      type: 'task',
      taskId: docRef.id
    });

    setNewTask({
      title: '',
      description: '',
      assignee: '',
      dueDate: '',
      priority: 'medium',
      status: 'not started',
      isRecurring: false,
      recurrencePattern: ''
    });

    fetchTasks();
  };

  const updateTask = async (taskId, updates) => {
    if (!currentUser || !currentUser.familyId) return;

    const taskRef = doc(firestore, 'families', currentUser.familyId, 'tasks', taskId);
    await updateDoc(taskRef, updates);

    await updateEventInCalendar(currentUser.familyId, taskId, {
      title: updates.title,
      start: new Date(updates.dueDate),
      end: new Date(updates.dueDate)
    });

    fetchTasks();
  };

  const deleteTask = async (taskId) => {
    if (!currentUser || !currentUser.familyId) return;

    const taskRef = doc(firestore, 'families', currentUser.familyId, 'tasks', taskId);
    await deleteDoc(taskRef);

    await deleteEventFromCalendar(currentUser.familyId, taskId);

    fetchTasks();
  };

  return (
    <div className="task-manager">
      <h2>Task Manager</h2>
      
      <form onSubmit={addTask}>
        <input
          type="text"
          value={newTask.title}
          onChange={(e) => setNewTask({...newTask, title: e.target.value})}
          placeholder="Task Title"
          required
        />
        <textarea
          value={newTask.description}
          onChange={(e) => setNewTask({...newTask, description: e.target.value})}
          placeholder="Task Description"
        />
        <input
          type="text"
          value={newTask.assignee}
          onChange={(e) => setNewTask({...newTask, assignee: e.target.value})}
          placeholder="Assignee"
        />
        <input
          type="date"
          value={newTask.dueDate}
          onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
        />
        <select
          value={newTask.priority}
          onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <label>
          <input
            type="checkbox"
            checked={newTask.isRecurring}
            onChange={(e) => setNewTask({...newTask, isRecurring: e.target.checked})}
          />
          Recurring Task
        </label>
        {newTask.isRecurring && (
          <input
            type="text"
            value={newTask.recurrencePattern}
            onChange={(e) => setNewTask({...newTask, recurrencePattern: e.target.value})}
            placeholder="Recurrence Pattern (e.g., 'daily', 'weekly on Monday')"
          />
        )}
        <button type="submit">Add Task</button>
      </form>

      <div>
        <label>
          Filter:
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="not started">Not Started</option>
            <option value="in progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </label>
        <label>
          Sort By:
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="status">Status</option>
          </select>
        </label>
      </div>

      <ul className="task-list">
        {tasks.map(task => (
          <li key={task.id} className="task-item">
            <h3>{task.title}</h3>
            <p>{task.description}</p>
            <p>Assignee: {task.assignee}</p>
            <p>Due: {task.dueDate}</p>
            <p>Priority: {task.priority}</p>
            <p>Status: {task.status}</p>
            {task.isRecurring && <p>Recurrence: {task.recurrencePattern}</p>}
            <select
              value={task.status}
              onChange={(e) => updateTask(task.id, { status: e.target.value })}
            >
              <option value="not started">Not Started</option>
              <option value="in progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <button onClick={() => deleteTask(task.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TaskManager;