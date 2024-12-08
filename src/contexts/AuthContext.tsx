import { createContext } from 'react';
import type { AuthContextType } from '../types/user';

// Create context with undefined initial value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Add display name for debugging
AuthContext.displayName = 'AuthContext';

export { AuthContext }; 