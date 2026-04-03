import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from '../models';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  logout: () => void;
  loading: boolean;
  isAuthReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      try {
        setFirebaseUser(fUser);
        if (fUser) {
          const userDocRef = doc(db, 'users', fUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          let userData: User;
          if (userDoc.exists()) {
            userData = { id: fUser.uid, ...userDoc.data() } as User;
            
            // Force admin role for the specific owner email if not already set
            if (fUser.email?.toLowerCase() === 'thakurjatin8882@gmail.com' && userData.role !== 'admin') {
              userData.role = 'admin';
              try {
                await setDoc(userDocRef, { role: 'admin' }, { merge: true });
              } catch (e) {
                console.error("Failed to update admin role in Firestore:", e);
              }
            }
          } else {
            // New user from Google or other provider
            userData = {
              id: fUser.uid,
              username: fUser.displayName || 'User',
              email: fUser.email || '',
              role: fUser.email?.toLowerCase() === 'thakurjatin8882@gmail.com' ? 'admin' : 'student',
              joinDate: new Date().toISOString(),
            };
            await setDoc(userDocRef, userData);
          }
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth state change error:", error);
        // Don't throw here to avoid crashing the app
      } finally {
        setLoading(false);
        setIsAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = () => {
    signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, logout, loading, isAuthReady }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
