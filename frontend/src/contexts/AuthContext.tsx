import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import { User } from '@/types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  getIdToken: () => Promise<string | null>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local storage key for demo/mock session fallback
const MOCK_USER_STORAGE_KEY = 'ai_doc_mock_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync profile when currentUser changes
  useEffect(() => {
    let unsubscribe = () => {};

    try {
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setCurrentUser(user);
          setUserProfile({
            id: user.uid,
            email: user.email || '',
            displayName: user.displayName || user.email?.split('@')[0] || 'User',
            photoURL: user.photoURL,
          });
        } else {
          // Check for mock user fallback in local storage if Firebase is in demo/offline mode
          const storedMock = localStorage.getItem(MOCK_USER_STORAGE_KEY);
          if (storedMock) {
            try {
              const mockParsed = JSON.parse(storedMock);
              setUserProfile(mockParsed);
            } catch {
              setUserProfile(null);
            }
          } else {
            setCurrentUser(null);
            setUserProfile(null);
          }
        }
        setLoading(false);
      });
    } catch (err) {
      console.warn('Firebase auth listener failed, falling back to local session:', err);
      const storedMock = localStorage.getItem(MOCK_USER_STORAGE_KEY);
      if (storedMock) {
        try {
          setUserProfile(JSON.parse(storedMock));
        } catch {
          setUserProfile(null);
        }
      }
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      setCurrentUser(user);
      setUserProfile({
        id: user.uid,
        email: user.email || email,
        displayName: user.displayName || email.split('@')[0],
        photoURL: user.photoURL,
      });
      localStorage.removeItem(MOCK_USER_STORAGE_KEY);
    } catch (firebaseErr: any) {
      // If Firebase project is invalid / mock configuration during dev, allow simulated login for test accounts
      if (
        firebaseErr?.code === 'auth/api-key-not-valid' ||
        firebaseErr?.code === 'auth/invalid-api-key' ||
        firebaseErr?.message?.includes('API key') ||
        import.meta.env.VITE_FIREBASE_API_KEY?.startsWith('mock')
      ) {
        console.warn('Demo/Mock auth fallback engaged (Mock Firebase config detected)');
        const mockUser: User = {
          id: 'demo-user-123',
          email,
          displayName: email.split('@')[0] || 'Demo User',
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify(mockUser));
        setUserProfile(mockUser);
        setLoading(false);
        return;
      }
      setLoading(false);
      throw firebaseErr;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName?: string): Promise<void> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName });
      setCurrentUser(user);
      setUserProfile({
        id: user.uid,
        email: user.email || email,
        displayName: displayName || email.split('@')[0],
      });
      localStorage.removeItem(MOCK_USER_STORAGE_KEY);
    } catch (firebaseErr: any) {
      if (
        firebaseErr?.code === 'auth/api-key-not-valid' ||
        firebaseErr?.code === 'auth/invalid-api-key' ||
        firebaseErr?.message?.includes('API key') ||
        import.meta.env.VITE_FIREBASE_API_KEY?.startsWith('mock')
      ) {
        console.warn('Demo/Mock auth fallback engaged for signup');
        const mockUser: User = {
          id: 'demo-user-' + Date.now(),
          email,
          displayName: displayName || email.split('@')[0],
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify(mockUser));
        setUserProfile(mockUser);
        setLoading(false);
        return;
      }
      setLoading(false);
      throw firebaseErr;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
    } catch {
      // Ignored if offline
    }
    localStorage.removeItem(MOCK_USER_STORAGE_KEY);
    setCurrentUser(null);
    setUserProfile(null);
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (firebaseErr: any) {
      if (
        firebaseErr?.code === 'auth/api-key-not-valid' ||
        firebaseErr?.code === 'auth/invalid-api-key' ||
        import.meta.env.VITE_FIREBASE_API_KEY?.startsWith('mock')
      ) {
        // Mock success for local demonstration
        return;
      }
      throw firebaseErr;
    }
  };

  const getIdToken = async (): Promise<string | null> => {
    if (currentUser) {
      try {
        return await currentUser.getIdToken();
      } catch (err) {
        console.error('Failed to get token:', err);
      }
    }
    // Return mock token if in mock mode
    if (userProfile) {
      return 'mock-jwt-token-for-development';
    }
    return null;
  };

  const updateUserProfile = async (data: Partial<User>): Promise<void> => {
    if (currentUser && data.displayName) {
      try {
        await updateProfile(currentUser, { displayName: data.displayName });
      } catch (err) {
        console.error('Failed to update firebase profile', err);
      }
    }
    setUserProfile((prev) => (prev ? { ...prev, ...data } : null));
    if (localStorage.getItem(MOCK_USER_STORAGE_KEY)) {
      const current = userProfile ? { ...userProfile, ...data } : null;
      if (current) {
        localStorage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify(current));
      }
    }
  };

  const value = useMemo(
    () => ({
      currentUser,
      userProfile,
      loading,
      signIn,
      signUp,
      signOut,
      resetPassword,
      getIdToken,
      updateUserProfile,
    }),
    [currentUser, userProfile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
