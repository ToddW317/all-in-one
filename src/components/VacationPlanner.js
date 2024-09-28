import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { firestore } from '../firebase';

function VacationPlanner({ familyActivities }) {
  const { currentUser } = useAuth();
  const [newVacation, setNewVacation] = useState({
    title: '',
    startDate: '',
    endDate: '',
    destination: '',
    budget: '',
    activities: [],
    packingList: []
  });
  const [newActivity, setNewActivity] = useState('');
  const [newPackingItem, setNewPackingItem] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewVacation(prev => ({ ...prev, [name]: value }));
  };

  const addActivity = () => {
    if (newActivity.trim()) {
      setNewVacation(prev => ({
        ...prev,
        activities: [...prev.activities, newActivity.trim()]
      }));
      setNewActivity('');
    }
  };

  const addPackingItem = () => {
    if (newPackingItem.trim()) {
      setNewVacation(prev => ({
        ...prev,
        packingList: [...prev.packingList, newPackingItem.trim()]
      }));
      setNewPackingItem('');
    }
  };

  const addVacation = async (e) => {
    e.preventDefault();
    const vacationRef = firestore.collection('families').doc(currentUser.familyId).collection('activities').doc();
    await vacationRef.set({
      ...newVacation,
      createdAt: new Date(),
      status: 'planned',
      type: 'vacation'
    });
    setNewVacation({
      title: '',
      startDate: '',
      endDate: '',
      destination: '',
      budget: '',
      activities: [],
      packingList: []
    });
  };

  const deleteVacation = async (vacationId) => {
    await firestore.collection('families').doc(currentUser.familyId).collection('activities').doc(vacationId).delete();
  };

  return (
    <div className="vacation-planner">
      <h2>Vacation Planner</h2>
      <form onSubmit={addVacation}>
        <input
          type="text"
          name="title"
          value={newVacation.title}
          onChange={handleInputChange}
          placeholder="Vacation Title"
          required
        />
        <input
          type="date"
          name="startDate"
          value={newVacation.startDate}
          onChange={handleInputChange}
          required
        />
        <input
          type="date"
          name="endDate"
          value={newVacation.endDate}
          onChange={handleInputChange}
          required
        />
        <input
          type="text"
          name="destination"
          value={newVacation.destination}
          onChange={handleInputChange}
          placeholder="Destination"
          required
        />
        <input
          type="number"
          name="budget"
          value={newVacation.budget}
          onChange={handleInputChange}
          placeholder="Budget"
          required
        />
        <div>
          <input
            type="text"
            value={newActivity}
            onChange={(e) => setNewActivity(e.target.value)}
            placeholder="Add activity"
          />
          <button type="button" onClick={addActivity}>Add Activity</button>
          <ul>
            {newVacation.activities.map((activity, index) => (
              <li key={index}>{activity}</li>
            ))}
          </ul>
        </div>
        <div>
          <input
            type="text"
            value={newPackingItem}
            onChange={(e) => setNewPackingItem(e.target.value)}
            placeholder="Add packing item"
          />
          <button type="button" onClick={addPackingItem}>Add to Packing List</button>
          <ul>
            {newVacation.packingList.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
        <button type="submit">Add Vacation</button>
      </form>
      <h3>Planned Vacations</h3>
      <ul>
        {familyActivities.filter(activity => activity.type === 'vacation').map(vacation => (
          <li key={vacation.id}>
            <h4>{vacation.title}</h4>
            <p>Destination: {vacation.destination}</p>
            <p>Dates: {new Date(vacation.startDate).toLocaleDateString()} - {new Date(vacation.endDate).toLocaleDateString()}</p>
            <p>Budget: ${vacation.budget}</p>
            <h5>Activities:</h5>
            <ul>
              {vacation.activities.map((activity, index) => (
                <li key={index}>{activity}</li>
              ))}
            </ul>
            <h5>Packing List:</h5>
            <ul>
              {vacation.packingList.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            <button onClick={() => deleteVacation(vacation.id)}>Delete Vacation</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default VacationPlanner;