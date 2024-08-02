import React, { useState, useEffect, useRef, useCallback } from 'react';
import Vapi from '@vapi-ai/web';
import { getAssistantConfig } from './assistantConfig';
import { sendToWebhook } from './webhook';
import { getAllItems } from './storage';
import './Interview.css';

const SpeechIndicator = ({ isSpeaking, isAI }) => (
  <div className={`speaking-indicator ${isAI ? 'ai' : 'user'} ${isSpeaking ? 'active' : ''}`}>
    <div className="indicator-circle"></div>
    <p>{isAI ? 'AI' : 'You'}</p>
  </div>
);

function Interview({ onEndCall }) {
  const [vapi, setVapi] = useState(null);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [isFinalQuestionAsked, setIsFinalQuestionAsked] = useState(false);
  const [currentMessage, setCurrentMessage] = useState({ role: '', content: '' });
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const chatWindowRef = useRef(null);
  const vapiRef = useRef(null);

  const initVapi = useCallback(async () => {
    console.log('Initializing Vapi...');
    const allItems = getAllItems();
    console.log('All stored items:', allItems);

    if (!allItems.userInfo || !allItems.resumeAnalysis) {
      setError('User information or resume analysis is missing. Please complete the form first.');
      return;
    }

    const publicKey = process.env.REACT_APP_VAPI_API_KEY;
    if (!publicKey) {
      setError('VAPI_API_KEY is not defined in environment variables');
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Media devices are not supported in this browser.');
      return;
    }

    try {
      const assistantConfig = getAssistantConfig(allItems.userInfo, allItems.resumeAnalysis);
      console.log('Assistant Config:', assistantConfig);

      if (vapiRef.current) {
        console.log('Vapi instance already exists. Stopping previous instance.');
        await vapiRef.current.stop();
        vapiRef.current = null;
      }

      const vapiInstance = new Vapi(publicKey);
      vapiRef.current = vapiInstance;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        stream.getAudioTracks().forEach(track => track.enabled = false); // Mute local audio track to prevent feedback
      }

      await vapiInstance.start(assistantConfig);
      setVapi(vapiInstance);
      console.log('Vapi instance initialized successfully');

      vapiInstance.on('error', (error) => {
        console.error('Vapi error:', error);
        setError(`Vapi error: ${error.message}`);
      });

      vapiInstance.on('call-start', () => {
        console.log('Call started successfully');
        setIsInterviewStarted(true);
      });

      vapiInstance.on('call-end', () => {
        console.log('Call ended');
        setIsInterviewStarted(false);
        onEndCall();
      });

      vapiInstance.on('speech-start', () => setIsAiSpeaking(true));
      vapiInstance.on('speech-end', () => setIsAiSpeaking(false));
      vapiInstance.on('user-speech-start', () => setIsUserSpeaking(true));
      vapiInstance.on('user-speech-end', () => setIsUserSpeaking(false));

      vapiInstance.on('transcript', (message) => {
        console.log('Received transcript message:', message);
        if (message && message.text) {
          setCurrentMessage({ role: 'user', content: message.text });
        }
      });

      vapiInstance.on('message', (message) => {
        console.log('Received message event:', message);
        if (message.type === "conversation-update") {
          const lastMessage = message.conversation[message.conversation.length - 1];
          if (lastMessage) {
            setCurrentMessage(lastMessage);
          }
        } else if (message.type === "agent-response-update") {
          setCurrentMessage({ role: 'assistant', content: message.message });
          setIsStreaming(true);
        }
      });

    } catch (err) {
      console.error('Error initializing Vapi:', err);
      setError(`Failed to initialize Vapi: ${err.message}`);
    }
  }, [onEndCall]);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [currentMessage]);

  const endCall = useCallback(async () => {
    if (vapi) {
      if (!isFinalQuestionAsked) {
        setIsFinalQuestionAsked(true);
        return;
      }
      vapi.stop();
      setIsInterviewStarted(false);
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      try {
        await sendToWebhook(getAllItems());
      } catch (error) {
        console.error('Failed to send interview data to webhook', error);
      }
      onEndCall();
    }
  }, [vapi, isFinalQuestionAsked, onEndCall]);

  useEffect(() => {
    let timer;
    if (isInterviewStarted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          const newTime = prevTime - 1;
          if (newTime === 60 && vapi) {
            vapi.send({
              type: "add-message",
              message: {
                role: "system",
                content: "There is 1 minute left in the interview. Please start wrapping up.",
              },
            });
          }
          if (newTime === 0) {
            endCall();
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isInterviewStarted, timeLeft, vapi, endCall]);

  useEffect(() => {
    initVapi();
  
    return () => {
      if (vapiRef.current) {
        console.log('Cleaning up Vapi instance');
        vapiRef.current.stop();
        vapiRef.current = null;
      }
    };
  }, [initVapi]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="interview-container">
      {error && <div className="error" style={{ display: 'none' }}>{error}</div>}
      <header>
        <h1>Interview in Progress</h1>
        <div className="timer">Time Left: {formatTime(timeLeft)}</div>
      </header>
      <main>
        <section className="video-section">
          <video ref={videoRef} autoPlay playsInline />
          <div className="speech-indicators">
            <SpeechIndicator isSpeaking={isUserSpeaking} isAI={false} />
            <SpeechIndicator isSpeaking={isAiSpeaking} isAI={true} />
          </div>
        </section>
        <section className="chat-section">
          <div className="chat-window" ref={chatWindowRef}>
            <p className={`message ${currentMessage.role} ${isStreaming ? 'streaming' : ''}`}>
              <strong>{currentMessage.role === 'assistant' ? 'AI' : 'You'}:</strong> {currentMessage.content}
            </p>
          </div>
        </section>
      </main>
      <footer>
        <button className="end-call-button" onClick={endCall}>End Call</button>
      </footer>
    </div>
  );
}

export default Interview;
