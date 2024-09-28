import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { firestore } from '../firebase';

function TaskManager() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: '',
    priority: 'medium',
    status: 'not started',
    isChore: false,
    recurringType: 'none'
  });

  useEffect(() => {
    const fetchTasks = async () => {
      const tasksRef = firestore.collection('families').doc(currentUser.familyId).collection('tasks');
      const unsubscribe = tasksRef.onSnapshot(snapshot => {
        const fetchedTasks = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTasks(fetchedTasks);
      });

      return () => unsubscribe();
    };

    fetchTasks();
  }, [currentUser.familyId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask(prev => ({ ...prev, [name]: value }));
  };

  const addTask = async (e) => {
    e.preventDefault();
    const taskRef = firestore.collection('families').doc(currentUser.familyId).collection('tasks').doc();
    await taskRef.set({
      ...newTask,
      createdAt: firestore.FieldValue.serverTimestamp(),
      createdBy: currentUser.uid
    });
    setNewTask({
      title: '',
      description: '',
      assignedTo: '',
      dueDate: '',
      priority: 'medium',
      status: 'not started',
      isChore: false,
      recurringType: 'none'
    });
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    await firestore.collection('families').doc(currentUser.familyId).collection('tasks').doc(taskId).update({
      status: newStatus
    });
  };

  const deleteTask = async (taskId) => {
    await firestore.collection('families').doc(currentUser.familyId).collection('tasks').doc(taskId).delete();
  };

  return (
    <div className="task-manager">
      <h2>Task Manager</h2>
      <form onSubmit={addTask}>
        <input
          type="text"
          name="title"
          value={newTask.title}
          onChange={handleInputChange}
          placeholder="Task Title"
          required
        />
        <textarea
          name="description"
          value={newTask.description}
          onChange={handleInputChange}
          placeholder="Task Description"
        />
        <input
          type="text"
          name="assignedTo"
          value={newTask.assignedTo}
          onChange={handleInputChange}
          placeholder="Assign to"
        />
        <input
          type="date"
          name="dueDate"
          value={newTask.dueDate}
          onChange={handleInputChange}
        />
        <select
          name="priority"
          value={newTask.priority}
          onChange={handleInputChange}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <label>
          <input
            type="checkbox"
            name="isChore"
            checked={newTask.isChore}
            onChange={(e) => setNewTask(prev => ({ ...prev, isChore: e.target.checked }))}
          />
          Is this a chore?
        </label>
        {newTask.isChore && (
          <select
            name="recurringType"
            value={newTask.recurringType}
            onChange={handleInputChange}
          >
            <option value="none">None</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        )}
        <button type="submit">Add Task</button>
      </form>
      <div className="task-list">
        <h3>Tasks and Chores</h3>
        {tasks.map(task => (
          <div key={task.id} className="task-item">
            <h4>{task.title}</h4>
            <p>{task.description}</p>
            <p>Assigned to: {task.assignedTo}</p>
            <p>Due: {task.dueDate}</p>
            <p>Priority: {task.priority}</p>
            <p>Status: {task.status}</p>
            {task.isChore && <p>Recurring: {task.recurringType}</p>}
            <select
              value={task.status}
              onChange={(e) => updateTaskStatus(task.id, e.target.value)}
            >
              <option value="not started">Not Started</option>
              <option value="in progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <button onClick={() => deleteTask(task.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TaskManager;