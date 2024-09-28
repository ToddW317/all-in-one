import React from 'react';
import { useAuth } from '../contexts/AuthContext';

function Education() {
  const { currentUser } = useAuth();

  return (
    <div className="education-page">
      <h1>Education Center</h1>
      {/* Implement education components here */}
    </div>
  );
}

export default Education;
