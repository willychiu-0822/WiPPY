import { createContext } from 'react';
import type { User } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  retry: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({ user: null, loading: true, error: null, retry: async () => {} });
