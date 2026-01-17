import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    restaurantData: any | null;
    logout: () => Promise<void>;
    refreshRestaurantData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [restaurantData, setRestaurantData] = useState<any | null>(null);

    const fetchRestaurantData = async (user: User) => {
        try {
            const restaurantDoc = await getDoc(doc(db, 'restaurants', user.uid));
            if (restaurantDoc.exists()) {
                setRestaurantData(restaurantDoc.data());
            } else {
                setRestaurantData(null);
            }
        } catch (error) {
            console.error('Error fetching restaurant data:', error);
            setRestaurantData(null);
        }
    };

    const refreshRestaurantData = async () => {
        if (currentUser) {
            await fetchRestaurantData(currentUser);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setRestaurantData(null);
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
