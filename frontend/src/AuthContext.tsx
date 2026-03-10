import React, { createContext, useContext, useEffect, useState } from "react";
import {
    AuthResponse,
    AuthTokens,
    AuthUser,
    loginRequest,
    refreshTokens,
    logoutRequest,
    registerRequest,
    googleLoginRequest,
} from "./api";

type AuthState = {
    user: AuthUser | null;
    tokens: AuthTokens | null;
    loading: boolean;
    error: string | null;
};

type AuthContextValue = AuthState & {
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, username: string, imgUrl?: string) => Promise<void>;
    loginWithGoogle: (idToken: string) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "web-final-auth";

type StoredAuth = {
    user: AuthUser;
    tokens: AuthTokens;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AuthState>({
        user: null,
        tokens: null,
        loading: true,
        error: null,
    });

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            setState((prev) => ({ ...prev, loading: false }));
            return;
        }
        const parsed: StoredAuth | null = JSON.parse(stored);
        if (!parsed?.tokens?.refreshToken) {
            localStorage.removeItem(STORAGE_KEY);
            setState((prev) => ({ ...prev, loading: false }));
            return;
        }

        (async () => {
            try {
                const tokens = await refreshTokens(parsed.tokens.refreshToken);
                const user = parsed.user;
                const newStored: StoredAuth = { user, tokens };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newStored));
                setState({ user, tokens, loading: false, error: null });
            } catch {
                localStorage.removeItem(STORAGE_KEY);
                setState({ user: null, tokens: null, loading: false, error: null });
            }
        })();
    }, []);

    const login = async (email: string, password: string) => {
        setState((prev) => ({ ...prev, error: null, loading: true }));
        try {
            const res: AuthResponse = await loginRequest(email, password);
            const { accessToken, refreshToken, _id, email: userEmail, username, imgUrl } = res;
            const user: AuthUser = { _id, email: userEmail, username, imgUrl };
            const tokens: AuthTokens = { accessToken, refreshToken };
            const stored: StoredAuth = { user, tokens };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
            setState({ user, tokens, loading: false, error: null });
        } catch (err) {
            const message = err instanceof Error ? err.message : "Login failed";
            setState((prev) => ({ ...prev, loading: false, error: message }));
        }
    };

    const register = async (email: string, password: string, username: string, imgUrl?: string) => {
        setState((prev) => ({ ...prev, error: null, loading: true }));
        try {
            const res: AuthResponse = await registerRequest(email, password, username, imgUrl);
            const { accessToken, refreshToken, _id, email: userEmail, username: userName, imgUrl: avatar } = res;
            const user: AuthUser = { _id, email: userEmail, username: userName, imgUrl: avatar };
            const tokens: AuthTokens = { accessToken, refreshToken };
            const stored: StoredAuth = { user, tokens };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
            setState({ user, tokens, loading: false, error: null });
        } catch (err) {
            const message = err instanceof Error ? err.message : "Registration failed";
            setState((prev) => ({ ...prev, loading: false, error: message }));
        }
    };

    const loginWithGoogle = async (idToken: string) => {
        setState((prev) => ({ ...prev, error: null, loading: true }));
        try {
            const res: AuthResponse = await googleLoginRequest(idToken);
            const { accessToken, refreshToken, _id, email: userEmail, username, imgUrl } = res;
            const user: AuthUser = { _id, email: userEmail, username, imgUrl };
            const tokens: AuthTokens = { accessToken, refreshToken };
            const stored: StoredAuth = { user, tokens };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
            setState({ user, tokens, loading: false, error: null });
        } catch (err) {
            const message = err instanceof Error ? err.message : "Google login failed";
            setState((prev) => ({ ...prev, loading: false, error: message }));
        }
    };

    const logout = async () => {
        const refreshToken = state.tokens?.refreshToken;
        setState({ user: null, tokens: null, loading: false, error: null });
        localStorage.removeItem(STORAGE_KEY);
        if (refreshToken) {
            try {
                await logoutRequest(refreshToken);
            } catch {
                // ignore logout errors
            }
        }
    };

    const value: AuthContextValue = {
        ...state,
        login,
        register,
        loginWithGoogle,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return ctx;
};

