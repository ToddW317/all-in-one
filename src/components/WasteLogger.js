import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { firestore } from '../firebase';
import { Chart } from 'react-google-charts';

function WasteLogger() {
  const { currentUser } = useAuth();
  const [wasteLog, setWasteLog] = useState([]);
  const [newWasteItem, setNewWasteItem] = useState({ item: '', quantity: 1, unit: 'piece', reason: '' });

  useEffect(() => {
    if (currentUser?.familyId) {
      fetchWasteLog();
    }
  }, [currentUser]);

  const fetchWasteLog = async () => {
    if (!currentUser?.familyId) return;
    const wasteLogRef = firestore.collection('families').doc(currentUser.familyId).collection('wasteLog');
    const snapshot = await wasteLogRef.orderBy('date', 'desc').get();
    setWasteLog(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const addWasteItem = async (e) => {
    e.preventDefault();
    if (!currentUser?.familyId) return;
    const wasteLogRef = firestore.collection('families').doc(currentUser.familyId).collection('wasteLog').doc();
    await wasteLogRef.set({
      ...newWasteItem,
      date: new Date(),
      createdAt: firestore.FieldValue.serverTimestamp()
    });
    setNewWasteItem({ item: '', quantity: 1, unit: 'piece', reason: '' });
    fetchWasteLog();
  };

  const getWasteChartData = () => {
    const wasteByReason = {};
    wasteLog.forEach(item => {
      if (wasteByReason[item.reason]) {
        wasteByReason[item.reason] += item.quantity;
      } else {
        wasteByReason[item.reason] = item.quantity;
      }
    });

    return [
      ['Reason', 'Quantity'],
      ...Object.entries(wasteByReason)
    ];
  };

  return (
    <div className="waste-logger">
      <h3>Waste Logger</h3>
      <form onSubmit={addWasteItem}>
        <input
          type="text"
          value={newWasteItem.item}
          onChange={(e) => setNewWasteItem({ ...newWasteItem, item: e.target.value })}
          placeholder="Item name"
          required
        />
        <input
          type="number"
          value={newWasteItem.quantity}
          onChange={(e) => setNewWasteItem({ ...newWasteItem, quantity: parseInt(e.target.value) })}
          min="1"
          required
        />
        <select
          value={newWasteItem.unit}
          onChange={(e) => setNewWasteItem({ ...newWasteItem, unit: e.target.value })}
        >
          <option value="piece">Piece</option>
          <option value="kg">Kg</option>
          <option value="g">g</option>
          <option value="l">L</option>
          <option value="ml">mL</option>
        </select>
        <input
          type="text"
          value={newWasteItem.reason}
          onChange={(e) => setNewWasteItem({ ...newWasteItem, reason: e.target.value })}
          placeholder="Reason for waste"
          required
        />
        <button type="submit">Log Waste</button>
      </form>

      <h4>Waste Log</h4>
      <ul>
        {wasteLog.map(item => (
          <li key={item.id}>
            {item.item} - {item.quantity} {item.unit} - {item.reason} - {new Date(item.date.toDate()).toLocaleDateString()}
          </li>
        ))}
      </ul>

      <h4>Waste Analysis</h4>
      <Chart
        width={'500px'}
        height={'300px'}
        chartType="PieChart"
        loader={<div>Loading Chart</div>}
        data={getWasteChartData()}
        options={{
          title: 'Waste by Reason',
        }}
      />
    </div>
  );
}

export default WasteLogger;