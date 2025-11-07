import { createContext } from 'react';
import type { User } from '@/lib/api';

export interface UserSessionError {
  code:
    | 'UNAUTHENTICATED'
    | 'NETWORK'
    | 'NOT_FOUND'
    | 'UNKNOWN';
  message: string;
  cause?: unknown;
}

export interface UserSessionContextType {
  user: User | null;
  isSignedIn: boolean;
  isLoading: boolean;
  error: UserSessionError | null;
  refetch: () => Promise<void>;
}

export const UserSessionContext = createContext<UserSessionContextType | null>(null);
UserSessionContext.displayName = 'UserSessionContext';
