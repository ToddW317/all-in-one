import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { firestore } from '../firebase';
import HomeworkTracker from '../components/HomeworkTracker';
import GradeReports from '../components/GradeReports';
import ClassSchedules from '../components/ClassSchedules';
import ParentTeacherComm from '../components/ParentTeacherComm';
import LearningResources from '../components/LearningResources';
import ActivityLog from '../components/ActivityLog';

function Education() {
  const { currentUser } = useAuth();
  const [familyEducation, setFamilyEducation] = useState({});

  useEffect(() => {
    const fetchFamilyEducation = async () => {
      const educationRef = firestore.collection('families').doc(currentUser.familyId).collection('education');
      const snapshot = await educationRef.get();
      const educationData = {};
      snapshot.forEach(doc => {
        educationData[doc.id] = doc.data();
      });
      setFamilyEducation(educationData);
    };

    fetchFamilyEducation();
  }, [currentUser.familyId]);

  return (
    <div className="education-page">
      <h1>Education Center</h1>
      <HomeworkTracker familyEducation={familyEducation} />
      <GradeReports familyEducation={familyEducation} />
      <ClassSchedules familyEducation={familyEducation} />
      <ParentTeacherComm />
      <LearningResources />
      <ActivityLog />
    </div>
  );
}

export default Education;
