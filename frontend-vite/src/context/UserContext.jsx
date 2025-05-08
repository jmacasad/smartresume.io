import { createContext, useEffect, useState, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);         // Firebase user object
  const [isGuest, setIsGuest] = useState(true);   // Default to guest mode
  const [loading, setLoading] = useState(true);   // Prevent flash
  const [userTier, setUserTier] = useState('guest'); // guest | free | paid | premium
  const [freeUserUsageCount, setFreeUserUsageCount] = useState(0); // Usage count for free users



  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);
          setIsGuest(false);
    
          // 🧪 Mock the tier for now
          setUserTier('free'); // Or try 'paid', 'premium'

          const savedCount = localStorage.getItem('freeUserUsageCount');
          if (savedCount !== null) {
            setFreeUserUsageCount(parseInt(savedCount));
        }
        } else {
          setUser(null);
          setIsGuest(true);
          setUserTier('guest');
        }
        setLoading(false);
      });

    return () => unsubscribe();
  }, []);

    // 💾 Persist usage count to localStorage
    useEffect(() => {
      if (userTier === 'free') {
        localStorage.setItem('freeUserUsageCount', freeUserUsageCount.toString());
      }
    }, [freeUserUsageCount, userTier]);

  return (
        <UserContext.Provider
            value={{
            user,
            isGuest,
            loading,
            setUser,
            setIsGuest,
            userTier,
            setUserTier,
            freeUserUsageCount,
            setFreeUserUsageCount,
            }}
        >
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
  return useContext(UserContext);
}
