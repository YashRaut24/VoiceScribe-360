import { useState, useEffect } from 'react';
import apiService from '../services/api';
import AuthContext from './auth-context';

const getStoredUser = () => {
    const userData = localStorage.getItem('user');

    if (!userData) {
        return null;
    }

    try {
        return JSON.parse(userData);
    } catch {
        localStorage.removeItem('user');
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(getStoredUser);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyStoredToken = async () => {
            try {
                const response = await apiService.verifyToken();
                setUser(response.user);
                localStorage.setItem('user', JSON.stringify(response.user));
            } catch {
                setUser(null);
                apiService.removeToken();
                localStorage.removeItem('user');
            } finally {
                setLoading(false);
            }
        };

        verifyStoredToken();
    }, []);

    const login = async (email, password, userType) => {
        const response = await apiService.login(email, password, userType);
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
        return response;
    };

    const register = async (userData) => {
        const response = await apiService.register(userData);
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
        return response;
    };

    const logout = () => {
        setUser(null);
        apiService.removeToken();
        localStorage.removeItem('user');
        apiService.logout();
    };

    const value = {
        user,
        login,
        register,
        logout,
        loading,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};