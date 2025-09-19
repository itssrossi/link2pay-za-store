import { useState, useCallback, useEffect } from 'react';

const DEV_AUTH_KEY = 'dev_auth_timestamp';
const AUTH_DURATION = 30 * 60 * 1000; // 30 minutes

export const useDevAuth = () => {
  const [isDevAuthenticated, setIsDevAuthenticated] = useState(() => {
    const authTimestamp = sessionStorage.getItem(DEV_AUTH_KEY);
    if (!authTimestamp) return false;
    const timestamp = parseInt(authTimestamp);
    return Date.now() - timestamp < AUTH_DURATION;
  });

  // Check for existing authentication on mount
  useEffect(() => {
    const authTimestamp = sessionStorage.getItem(DEV_AUTH_KEY);
    if (authTimestamp) {
      const timestamp = parseInt(authTimestamp);
      const now = Date.now();
      
      if (now - timestamp < AUTH_DURATION) {
        setIsDevAuthenticated(true);
      } else {
        sessionStorage.removeItem(DEV_AUTH_KEY);
      }
    }
  }, []);

  const authenticate = useCallback((password: string) => {
    if (password === 'DEVJOHN') {
      const timestamp = Date.now().toString();
      sessionStorage.setItem(DEV_AUTH_KEY, timestamp);
      setIsDevAuthenticated(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(DEV_AUTH_KEY);
    setIsDevAuthenticated(false);
  }, []);

  return {
    isDevAuthenticated,
    authenticate,
    logout
  };
};