'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  signIn as amplifySignIn,
  signUp as amplifySignUp,
  confirmSignUp as amplifyConfirmSignUp,
  signOut as amplifySignOut,
  getCurrentUser,
  fetchAuthSession,
  type AuthUser,
} from 'aws-amplify/auth';
import '../lib/amplifyConfig';

export interface AuthContextType {
  user: AuthUser | null;
  userSub: string | null;
  userEmail: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: typeof amplifySignIn;
  signUp: typeof amplifySignUp;
  confirmSignUp: typeof amplifyConfirmSignUp;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userSub, setUserSub] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const currentUser = await getCurrentUser();
      const session = await fetchAuthSession();

      setUser(currentUser);
      setUserSub(currentUser.userId || session.tokens?.idToken?.payload?.sub?.toString() || null);
      setUserEmail((session.tokens?.idToken?.payload?.email as string) || currentUser.username || null);
    } catch {
      setUser(null);
      setUserSub(null);
      setUserEmail(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const signOut = async () => {
    try {
      await amplifySignOut();
    } catch (err) {
      console.error('[AuthContext] Sign out error:', err);
    } finally {
      setUser(null);
      setUserSub(null);
      setUserEmail(null);
    }
  };

  const getAccessToken = async (): Promise<string | null> => {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.accessToken?.toString() || null;
    } catch {
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userSub,
        userEmail,
        isAuthenticated: !!user,
        isLoading,
        signIn: async (input) => {
          const res = await amplifySignIn(input);
          await refreshSession();
          return res;
        },
        signUp: amplifySignUp,
        confirmSignUp: async (input) => {
          const res = await amplifyConfirmSignUp(input);
          await refreshSession();
          return res;
        },
        signOut,
        getAccessToken,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
