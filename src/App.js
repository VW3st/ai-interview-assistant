import React, { useState } from 'react';
import UserInfoForm from './UserInfoForm';
import Interview from './Interview';
import EndCallMessage from './EndCallMessage';
import LoadingSpinner from './LoadingSpinner';
import './App.css';

function App() {
  const [step, setStep] = useState('gatherInfo');
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleUserInfoSubmit = (info) => {
    setIsLoading(true);
    setUserInfo(info);
    // Simulate a delay or perform any async operations
    setTimeout(() => {
      setIsLoading(false);
      setStep('interview');
    }, 2000);
  };

  const handleEndCall = () => {
    setStep('endCall');
  };

  return (
    <div className="App">
      {isLoading && <LoadingSpinner />}
      {step === 'gatherInfo' && <UserInfoForm onSubmit={handleUserInfoSubmit} setIsLoading={setIsLoading} />}
      {step === 'interview' && <Interview userInfo={userInfo} onEndCall={handleEndCall} />}
      {step === 'endCall' && <EndCallMessage />}
    </div>
  );
}

export default App;