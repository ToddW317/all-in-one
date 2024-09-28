import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export function useApp() {
  return useContext(AppContext);
}

export function AppProvider({ children }) {
  const [appState, setAppState] = useState({
    // Add any global app state here
    // For example:
    // theme: 'light',
    // language: 'en',
  });

  const value = {
    appState,
    setAppState,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}