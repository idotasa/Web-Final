import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import {
    AuthResponse,
    AuthTokens,
    AuthUser,
    loginRequest,
    registerRequest,
    googleLoginRequest,
    refreshTokens,
    logoutRequest,
} from "../api";

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
    setUser: (user: AuthUser) => void;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = "web-final-auth";

type StoredAuth = { user: AuthUser; tokens: AuthTokens };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AuthState>({
        user: null,
        tokens: null,
        loading: true,
        error: null,
    });
    const restoreAttempted = useRef(false);

    useEffect(() => {
        if (restoreAttempted.current) return;
        restoreAttempted.current = true;

        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            setState((p) => ({ ...p, loading: false }));
            return;
        }
        let parsed: StoredAuth | null = null;
        try {
            parsed = JSON.parse(stored);
        } catch {
            localStorage.removeItem(STORAGE_KEY);
            setState((p) => ({ ...p, loading: false }));
            return;
        }
        if (!parsed?.tokens?.refreshToken) {
            localStorage.removeItem(STORAGE_KEY);
            setState((p) => ({ ...p, loading: false }));
            return;
        }
        (async () => {
            try {
                const tokens = await refreshTokens(parsed!.tokens.refreshToken);
                const user = parsed!.user;
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
        setState((p) => ({ ...p, error: null, loading: true }));
        try {
            const res: AuthResponse = await loginRequest(email, password);
            const { accessToken, refreshToken, _id, email: e, username, imgUrl } = res;
            const user: AuthUser = { _id, email: e, username, imgUrl };
            const tokens: AuthTokens = { accessToken, refreshToken };
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, tokens }));
            setState({ user, tokens, loading: false, error: null });
        } catch (err) {
            setState((p) => ({ ...p, loading: false, error: err instanceof Error ? err.message : "Login failed" }));
        }
    };

    const register = async (email: string, password: string, username: string, imgUrl?: string) => {
        setState((p) => ({ ...p, error: null, loading: true }));
        try {
            const res: AuthResponse = await registerRequest(email, password, username, imgUrl);
            const { accessToken, refreshToken, _id, email: e, username: u, imgUrl: img } = res;
            const user: AuthUser = { _id, email: e, username: u, imgUrl: img };
            const tokens: AuthTokens = { accessToken, refreshToken };
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, tokens }));
            setState({ user, tokens, loading: false, error: null });
        } catch (err) {
            setState((p) => ({ ...p, loading: false, error: err instanceof Error ? err.message : "Registration failed" }));
        }
    };

    const loginWithGoogle = async (idToken: string) => {
        setState((p) => ({ ...p, error: null, loading: true }));
        try {
            const res: AuthResponse = await googleLoginRequest(idToken);
            const { accessToken, refreshToken, _id, email: e, username, imgUrl } = res;
            const user: AuthUser = { _id, email: e, username, imgUrl };
            const tokens: AuthTokens = { accessToken, refreshToken };
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, tokens }));
            setState({ user, tokens, loading: false, error: null });
        } catch (err) {
            setState((p) => ({ ...p, loading: false, error: err instanceof Error ? err.message : "Google login failed" }));
        }
    };

    const setUser = (user: AuthUser) => {
        setState((p) => {
            if (!p.tokens) return p;
            const stored: StoredAuth = { user, tokens: p.tokens };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
            return { ...p, user };
        });
    };

    const logout = async () => {
        const refreshToken = state.tokens?.refreshToken;
        setState({ user: null, tokens: null, loading: false, error: null });
        localStorage.removeItem(STORAGE_KEY);
        if (refreshToken) {
            try {
                await logoutRequest(refreshToken);
            } catch {}
        }
    };

    return (
        <AuthContext.Provider value={{ ...state, login, register, loginWithGoogle, setUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
};
