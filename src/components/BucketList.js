import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { firestore } from '../firebase';

function BucketList({ familyActivities }) {
  const { currentUser } = useAuth();
  const [newBucketListItem, setNewBucketListItem] = useState({
    title: '',
    description: '',
    targetDate: '',
    status: 'Not Started'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBucketListItem(prev => ({ ...prev, [name]: value }));
  };

  const addBucketListItem = async (e) => {
    e.preventDefault();
    const bucketListRef = firestore.collection('families').doc(currentUser.familyId).collection('activities').doc();
    await bucketListRef.set({
      ...newBucketListItem,
      createdAt: new Date(),
      type: 'bucketList'
    });
    setNewBucketListItem({
      title: '',
      description: '',
      targetDate: '',
      status: 'Not Started'
    });
  };

  const updateBucketListItemStatus = async (itemId, newStatus) => {
    await firestore.collection('families').doc(currentUser.familyId).collection('activities').doc(itemId).update({
      status: newStatus
    });
  };

  const deleteBucketListItem = async (itemId) => {
    await firestore.collection('families').doc(currentUser.familyId).collection('activities').doc(itemId).delete();
  };

  return (
    <div className="bucket-list">
      <h2>Family Bucket List</h2>
      <form onSubmit={addBucketListItem}>
        <input
          type="text"
          name="title"
          value={newBucketListItem.title}
          onChange={handleInputChange}
          placeholder="Bucket List Item Title"
          required
        />
        <textarea
          name="description"
          value={newBucketListItem.description}
          onChange={handleInputChange}
          placeholder="Description"
          required
        />
        <input
          type="date"
          name="targetDate"
          value={newBucketListItem.targetDate}
          onChange={handleInputChange}
        />
        <select
          name="status"
          value={newBucketListItem.status}
          onChange={handleInputChange}
        >
          <option value="Not Started">Not Started</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
        <button type="submit">Add to Bucket List</button>
      </form>
      <h3>Our Bucket List</h3>
      <ul>
        {familyActivities.filter(activity => activity.type === 'bucketList').map(item => (
          <li key={item.id}>
            <h4>{item.title}</h4>
            <p>{item.description}</p>
            <p>Target Date: {item.targetDate ? new Date(item.targetDate).toLocaleDateString() : 'Not set'}</p>
            <p>Status: {item.status}</p>
            <select
              value={item.status}
              onChange={(e) => updateBucketListItemStatus(item.id, e.target.value)}
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
            <button onClick={() => deleteBucketListItem(item.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default BucketList;