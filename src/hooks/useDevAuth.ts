import { useState, useCallback } from 'react';

export const useDevAuth = () => {
  const [isDevAuthenticated, setIsDevAuthenticated] = useState(false);

  const authenticate = useCallback((password: string) => {
    if (password === 'DEVJOHN') {
      setIsDevAuthenticated(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setIsDevAuthenticated(false);
  }, []);

  return {
    isDevAuthenticated,
    authenticate,
    logout
  };
};