import React, { useState, useRef, useEffect } from 'react';
import * as Tone from 'tone';

const MobileAudioTest: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [testResult, setTestResult] = useState<string>('');
  const synthRef = useRef<Tone.Synth | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const initializeAudio = async () => {
    try {
      if (Tone.context.state !== 'running') {
        await Tone.start();
        console.log('Audio context started');
      }
      
      synthRef.current = new Tone.Synth().toDestination();
      setIsInitialized(true);
      setTestResult('Audio initialized - ready to test!');
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      setTestResult('Failed to initialize audio');
    }
  };

  const playBeep = () => {
    if (!synthRef.current) return;
    
    try {
      synthRef.current.triggerAttackRelease('C4', '8n');
      setTestResult('Beep played successfully!');
    } catch (error) {
      console.error('Failed to play beep:', error);
      setTestResult('Failed to play beep');
    }
  };

  const startContinuousBeeps = () => {
    if (!synthRef.current) return;
    
    setIsPlaying(true);
    setTestResult('Playing continuous beeps...');
    
    intervalRef.current = setInterval(() => {
      if (synthRef.current) {
        synthRef.current.triggerAttackRelease('C4', '16n');
      }
    }, 1000);
  };

  const stopContinuousBeeps = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
    setTestResult('Stopped continuous beeps');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f0f0',
      textAlign: 'center'
    }}>
      <h1 style={{ color: '#333', marginBottom: '10px' }}>Mobile Audio Test</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        This test verifies audio functionality on mobile devices
      </p>
      
      {!isInitialized ? (
        <div>
          <button 
            onClick={initializeAudio}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              fontSize: '18px',
              borderRadius: '8px',
              cursor: 'pointer',
              marginBottom: '20px'
            }}
          >
            Initialize Audio
          </button>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Click to enable audio (required on mobile)
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
          <button 
            onClick={playBeep}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              fontSize: '18px',
              borderRadius: '8px',
              cursor: 'pointer',
              minWidth: '200px'
            }}
          >
            Play Single Beep
          </button>
          
          {!isPlaying ? (
            <button 
              onClick={startContinuousBeeps}
              style={{
                backgroundColor: '#ffc107',
                color: '#212529',
                border: 'none',
                padding: '15px 30px',
                fontSize: '18px',
                borderRadius: '8px',
                cursor: 'pointer',
                minWidth: '200px'
              }}
            >
              Start Continuous Beeps
            </button>
          ) : (
            <button 
              onClick={stopContinuousBeeps}
              style={{
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '15px 30px',
                fontSize: '18px',
                borderRadius: '8px',
                cursor: 'pointer',
                minWidth: '200px'
              }}
            >
              Stop Beeps
            </button>
          )}
        </div>
      )}
      
      <div style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: 'white',
        borderRadius: '8px',
        minWidth: '250px',
        border: '1px solid #ddd'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Test Status:</h3>
        <p style={{ margin: 0, color: testResult.includes('success') ? '#28a745' : '#666' }}>
          {testResult || 'Waiting to test...'}
        </p>
      </div>
      
      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#fff3cd',
        borderRadius: '8px',
        maxWidth: '300px',
        border: '1px solid #ffeaa7'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>Instructions:</h4>
        <ul style={{ textAlign: 'left', fontSize: '14px', color: '#856404', margin: 0, paddingLeft: '20px' }}>
          <li>Turn up your device volume</li>
          <li>Tap "Initialize Audio" first</li>
          <li>Then test "Play Single Beep"</li>
          <li>If successful, try continuous beeps</li>
        </ul>
      </div>
    </div>
  );
};

export default MobileAudioTest;