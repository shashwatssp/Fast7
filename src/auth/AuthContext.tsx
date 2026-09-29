import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    /** The currently selected (active) website */
    restaurantData: any | null;
    /** ALL websites owned by the user — a user can own many */
    restaurants: any[];
    /** Id of the active website (persisted across sessions) */
    activeRestaurantId: string | null;
    /** Switch the active website */
    setActiveRestaurantId: (id: string) => void;
    logout: () => Promise<void>;
    refreshRestaurantData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
    children: ReactNode;
}

const ACTIVE_KEY = 'fast7:activeRestaurant';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [activeRestaurantId, setActiveIdState] = useState<string | null>(null);
    const [restaurantData, setRestaurantData] = useState<any | null>(null);

    const fetchRestaurantData = async (user: User) => {
        try {
            // Load ALL websites owned by this user — one user can own many.
            const restaurantsRef = collection(db, 'restaurants');
            const q = query(restaurantsRef, where("ownerId", "==", user.uid));
            const querySnapshot = await getDocs(q);

            const list = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));

            // Legacy accounts keep a single doc keyed by their uid (no ownerId field)
            if (list.length === 0) {
                const legacyDoc = await getDoc(doc(db, 'restaurants', user.uid));
                if (legacyDoc.exists()) {
                    list.push({ id: legacyDoc.id, ...legacyDoc.data() } as any);
                }
            }

            // Newest website first
            list.sort((a, b) => {
                const ta = a?.createdAt?.toMillis?.() || 0;
                const tb = b?.createdAt?.toMillis?.() || 0;
                return tb - ta;
            });

            setRestaurants(list);

            // Restore last active website, fall back to the newest one
            const savedId = localStorage.getItem(ACTIVE_KEY);
            const initial = list.find(r => r.id === savedId)?.id || list[0]?.id || null;
            setActiveIdState(initial);
            setRestaurantData(list.find(r => r.id === initial) || null);
        } catch (error) {
            console.error('Error fetching restaurant data:', error);
            setRestaurants([]);
            setRestaurantData(null);
        }
    };

    const refreshRestaurantData = async () => {
        if (currentUser) {
            await fetchRestaurantData(currentUser);
        }
    };

    const setActiveRestaurantId = (id: string) => {
        setActiveIdState(id);
        localStorage.setItem(ACTIVE_KEY, id);
        setRestaurantData(restaurants.find(r => r.id === id) || null);
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setRestaurantData(null);
            setRestaurants([]);
            setActiveIdState(null);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            
            if (user) {
                try {
                    await fetchRestaurantData(user);
                } catch (error) {
                    console.error('Error fetching restaurant data in auth state change:', error);
                    setRestaurantData(null);
                }
            } else {
                setRestaurantData(null);
                setRestaurants([]);
            }
            
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{
            currentUser,
            loading,
            restaurantData,
            restaurants,
            activeRestaurantId,
            setActiveRestaurantId,
            logout,
            refreshRestaurantData
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
