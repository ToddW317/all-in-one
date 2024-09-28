import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import Navigation from './components/Navigation';
import {
  Home,
  Calendar,
  Tasks,
  Meals,
  Budget,
  Health,
  Education,
  Documents,
  Communication,
  Activities,
  Profile,
  Settings
} from './pages';
import './styles/global.css';
import Activities from './pages/Activities';

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <div className="App">
            <Navigation />
            <Switch>
              <Route exact path="/" component={Home} />
              <Route path="/calendar" component={Calendar} />
              <Route path="/tasks" component={Tasks} />
              <Route path="/meals" component={Meals} />
              <Route path="/budget" component={Budget} />
              <Route path="/health" component={Health} />
              <Route path="/education" component={Education} />
              <Route path="/documents" component={Documents} />
              <Route path="/communication" component={Communication} />
              <Route path="/activities" component={Activities} />
              <Route path="/profile" component={Profile} />
              <Route path="/settings" component={Settings} />
            </Switch>
          </div>
        </Router>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
