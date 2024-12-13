import { useState, useEffect } from 'react';

const DEBUG_MODE_KEY = 'debug_mode';

export function useDebugMode() {
  const [debugMode, setDebugMode] = useState<boolean>(() => {
    // Try to get the saved value from localStorage
    const saved = localStorage.getItem(DEBUG_MODE_KEY);
    return saved ? JSON.parse(saved) : false;
  });

  // Save to localStorage whenever the value changes
  useEffect(() => {
    localStorage.setItem(DEBUG_MODE_KEY, JSON.stringify(debugMode));
  }, [debugMode]);

  return {
    debugMode,
    toggleDebugMode: () => setDebugMode((prev: boolean) => !prev)
  };
} 