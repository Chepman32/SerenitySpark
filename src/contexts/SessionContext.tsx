import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SessionState, AudioSettings } from '../types';

interface SessionContextType {
  sessionState: SessionState;
  startSession: (duration: number, audioSettings: AudioSettings) => void;
  endSession: () => void;
  updateElapsed: (elapsed: number) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [sessionState, setSessionState] = useState<SessionState>({
    duration: 0,
    elapsed: 0,
    isActive: false,
    audioSettings: {
      natureEnabled: false,
      musicEnabled: false,
      natureTrack: 'rain',
      musicTrack: 'piano',
    },
  });

  const startSession = (duration: number, audioSettings: AudioSettings) => {
    setSessionState({
      duration,
      elapsed: 0,
      isActive: true,
      audioSettings,
    });
  };

  const endSession = () => {
    setSessionState(prev => ({
      ...prev,
      isActive: false,
    }));
  };

  const updateElapsed = (elapsed: number) => {
    setSessionState(prev => ({
      ...prev,
      elapsed,
    }));
  };

  return (
    <SessionContext.Provider
      value={{ sessionState, startSession, endSession, updateElapsed }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
};
