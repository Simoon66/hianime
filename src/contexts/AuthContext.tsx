import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

interface UserProfile {
  name: string;
  email: string;
  role: 'admin' | 'user';
  avatarUrl?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }

      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        
        unsubscribeProfile = onSnapshot(userRef, async (userSnap) => {
          if (userSnap.exists()) {
            const data = userSnap.data();
            // Merge in case the profile was partially created by AuthModal
            if (!data.email || !data.role || !data.createdAt) {
              const isFirstAdmin = (currentUser.email === 'kamaluddin124578@gmail.com' && currentUser.emailVerified) || currentUser.email === 'admin@hianime.local';
              const completeProfile: UserProfile = {
                name: data.name || currentUser.displayName || 'Anonymous',
                email: data.email || currentUser.email || '',
                role: data.role || (isFirstAdmin ? 'admin' : 'user'),
                avatarUrl: data.avatarUrl || currentUser.photoURL || '',
                createdAt: data.createdAt || new Date().toISOString(),
              };
              await setDoc(userRef, completeProfile, { merge: true });
              setProfile(completeProfile);
            } else {
              setProfile(data as UserProfile);
            }
          } else {
            // Create new user profile
            const isFirstAdmin = (currentUser.email === 'kamaluddin124578@gmail.com' && currentUser.emailVerified) || currentUser.email === 'admin@hianime.local';
            const newProfile: UserProfile = {
              name: currentUser.displayName || 'Anonymous',
              email: currentUser.email || '',
              role: isFirstAdmin ? 'admin' : 'user',
              avatarUrl: currentUser.photoURL || '',
              createdAt: new Date().toISOString(),
            };
            await setDoc(userRef, newProfile);
            setProfile(newProfile);
          }
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
