import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { User as UserType } from './types';

interface AuthContextType {
  user: User | null;
  profile: UserType | null;
  loading: boolean;
  isAdmin: boolean;
  updateProfile: (data: Partial<UserType>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  updateProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  const updateProfile = async (data: Partial<UserType>) => {
    if (!user) throw new Error("Not authenticated");
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      const unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as UserType;
          setProfile(data);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }, (error) => {
        console.error("Error fetching profile:", error);
        setLoading(false);
      });

      return () => unsubscribeProfile();
    }
  }, [user]);

  const isAdmin = profile?.role === 'admin' || 
                  profile?.role === 'moderator' || 
                  user?.email?.toLowerCase() === 'francismugebe@gmail.com';

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
