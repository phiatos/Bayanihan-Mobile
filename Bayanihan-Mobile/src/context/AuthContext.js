import React, { createContext } from 'react';

export const AuthContext = createContext({
  user: undefined,
  setUser: () => {},
});