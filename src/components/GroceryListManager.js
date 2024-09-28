import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { firestore } from '../firebase';

function GroceryListManager({ groceryList, pantryItems, onUpdateGroceryList }) {
  const { currentUser } = useAuth();
  const [newItem, setNewItem] = useState({ name: '', quantity: 1, unit: 'piece' });

  const addItem = async (e) => {
    e.preventDefault();
    const groceryListRef = firestore.collection('families').doc(currentUser.familyId).collection('groceryList').doc();
    await groceryListRef.set({
      ...newItem,
      id: groceryListRef.id,
      checked: false
    });
    setNewItem({ name: '', quantity: 1, unit: 'piece' });
    onUpdateGroceryList();
  };

  const toggleItem = async (item) => {
    const groceryListRef = firestore.collection('families').doc(currentUser.familyId).collection('groceryList').doc(item.id);
    await groceryListRef.update({ checked: !item.checked });
    onUpdateGroceryList();
  };

  const removeItem = async (itemId) => {
    await firestore.collection('families').doc(currentUser.familyId).collection('groceryList').doc(itemId).delete();
    onUpdateGroceryList();
  };

  const addToPantry = async (item) => {
    const pantryRef = firestore.collection('families').doc(currentUser.familyId).collection('pantry').doc(item.id);
    const pantryItem = pantryItems.find(pItem => pItem.id === item.id);
    if (pantryItem) {
      await pantryRef.update({ quantity: pantryItem.quantity + item.quantity });
    } else {
      await pantryRef.set({ ...item, id: pantryRef.id });
    }
    await removeItem(item.id);
  };

  return (
    <div className="grocery-list-manager">
      <h3>Grocery List</h3>
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
        <button type="submit">Add Item</button>
      </form>
      <ul>
        {groceryList.map(item => (
          <li key={item.id}>
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => toggleItem(item)}
            />
            <span style={{ textDecoration: item.checked ? 'line-through' : 'none' }}>
              {item.name} - {item.quantity} {item.unit}
            </span>
            <button onClick={() => removeItem(item.id)}>Remove</button>
            <button onClick={() => addToPantry(item)}>Add to Pantry</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default GroceryListManager;