import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { firestore } from '../firebase';

function PantryInventory({ pantryItems, onUpdatePantry }) {
  const { currentUser } = useAuth();
  const [newItem, setNewItem] = useState({ name: '', quantity: 1, unit: 'piece', expirationDate: '' });

  const addItem = async (e) => {
    e.preventDefault();
    const pantryRef = firestore.collection('families').doc(currentUser.familyId).collection('pantry').doc();
    await pantryRef.set({
      ...newItem,
      id: pantryRef.id
    });
    setNewItem({ name: '', quantity: 1, unit: 'piece', expirationDate: '' });
    onUpdatePantry();
  };

  const updateItemQuantity = async (item, newQuantity) => {
    const pantryRef = firestore.collection('families').doc(currentUser.familyId).collection('pantry').doc(item.id);
    await pantryRef.update({ quantity: newQuantity });
    onUpdatePantry();
  };

  const removeItem = async (itemId) => {
    await firestore.collection('families').doc(currentUser.familyId).collection('pantry').doc(itemId).delete();
    onUpdatePantry();
  };

  return (
    <div className="pantry-inventory">
      <h3>Pantry Inventory</h3>
      <form onSubmit={addItem}>
        <input
          type="text"
          value={newItem.name}
          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
          placeholder="Item name"
          required
        />
        <input
          type="number"
          value={newItem.quantity}
          onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) })}
          min="1"
          required
        />
        <select
          value={newItem.unit}
          onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
        >
          <option value="piece">Piece</option>
          <option value="kg">Kg</option>
          <option value="g">g</option>
          <option value="l">L</option>
          <option value="ml">mL</option>
        </select>
        <input
          type="date"
          value={newItem.expirationDate}
          onChange={(e) => setNewItem({ ...newItem, expirationDate: e.target.value })}
        />
        <button type="submit">Add Item</button>
      </form>
      <ul>
        {pantryItems.map(item => (
          <li key={item.id}>
            {item.name} - 
            <input
              type="number"
              value={item.quantity}
              onChange={(e) => updateItemQuantity(item, parseInt(e.target.value))}
              min="0"
            />
            {item.unit}
            {item.expirationDate && ` - Expires: ${new Date(item.expirationDate).toLocaleDateString()}`}
            <button onClick={() => removeItem(item.id)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PantryInventory;