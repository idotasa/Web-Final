import React, { FormEvent, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";

declare global {
    interface Window {
        google?: { accounts: { id: { initialize: (c: unknown) => void; renderButton: (el: HTMLElement, o: unknown) => void } } };
    }
}

const LoginPage: React.FC = () => {
    const { login, register, loginWithGoogle, loading, error } = useAuth();
    const [mode, setMode] = useState<"login" | "signup">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const googleButtonRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const clientId = (import.meta as unknown as { env?: { VITE_GOOGLE_CLIENT_ID?: string } }).env?.VITE_GOOGLE_CLIENT_ID;
        if (!clientId || !window.google || !googleButtonRef.current) return;
        window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response: { credential?: string }) => {
                if (response.credential) loginWithGoogle(response.credential);
            },
        });
        window.google.accounts.id.renderButton(googleButtonRef.current, {
            type: "standard",
            theme: "outline",
            size: "large",
            shape: "pill",
            text: "continue_with",
            width: 320,
        });
    }, [loginWithGoogle]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (mode === "login") await login(email, password);
        else await register(email, password, username);
    };

    const isSignup = mode === "signup";

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #0f172a, #1e293b)",
                fontFamily: "system-ui, sans-serif",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: 420,
                    backgroundColor: "rgba(15,23,42,0.95)",
                    borderRadius: 16,
                    padding: 32,
                    boxShadow: "0 24px 80px rgba(15,23,42,0.7)",
                    border: "1px solid rgba(148,163,184,0.3)",
                    color: "#e5e7eb",
                }}
            >
                <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, textAlign: "center" }}>
                    {isSignup ? "Join IO.Social" : "Welcome to IO.Social"}
                </h1>
                <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 16, textAlign: "center" }}>
                    {isSignup ? "Create your account." : "Login with your email and password."}
                </p>

                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        marginBottom: 20,
                        backgroundColor: "rgba(15,23,42,0.9)",
                        padding: 4,
                        borderRadius: 999,
                        border: "1px solid rgba(148,163,184,0.3)",
                    }}
                >
                    <button
                        type="button"
                        onClick={() => setMode("login")}
                        style={{
                            flex: 1,
                            padding: "6px 10px",
                            borderRadius: 999,
                            border: "none",
                            backgroundColor: !isSignup ? "#0ea5e9" : "transparent",
                            color: !isSignup ? "white" : "#9ca3af",
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: "pointer",
                        }}
                    >
                        Login
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode("signup")}
                        style={{
                            flex: 1,
                            padding: "6px 10px",
                            borderRadius: 999,
                            border: "none",
                            backgroundColor: isSignup ? "#0ea5e9" : "transparent",
                            color: isSignup ? "white" : "#9ca3af",
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: "pointer",
                        }}
                    >
                        Sign up
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {isSignup && (
                        <label style={{ fontSize: 14 }}>
                            Username
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                placeholder="Your username"
                                style={{
                                    marginTop: 6,
                                    width: "100%",
                                    padding: "10px 12px",
                                    borderRadius: 10,
                                    border: "1px solid rgba(148,163,184,0.5)",
                                    backgroundColor: "#020617",
                                    color: "#e5e7eb",
                                    outline: "none",
                                    fontSize: 14,
                                }}
                            />
                        </label>
                    )}
                    <label style={{ fontSize: 14 }}>
                        Email
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="you@example.com"
                            style={{
                                marginTop: 6,
                                width: "100%",
                                padding: "10px 12px",
                                borderRadius: 10,
                                border: "1px solid rgba(148,163,184,0.5)",
                                backgroundColor: "#020617",
                                color: "#e5e7eb",
                                outline: "none",
                                fontSize: 14,
                            }}
                        />
                    </label>
                    <label style={{ fontSize: 14 }}>
                        Password
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            style={{
                                marginTop: 6,
                                width: "100%",
                                padding: "10px 12px",
                                borderRadius: 10,
                                border: "1px solid rgba(148,163,184,0.5)",
                                backgroundColor: "#020617",
                                color: "#e5e7eb",
                                outline: "none",
                                fontSize: 14,
                            }}
                        />
                    </label>
                    {error && (
                        <div
                            style={{
                                fontSize: 13,
                                color: "#fecaca",
                                backgroundColor: "rgba(127,29,29,0.15)",
                                borderRadius: 10,
                                padding: "8px 10px",
                                border: "1px solid rgba(248,113,113,0.4)",
                            }}
                        >
                            {error}
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            marginTop: 8,
                            padding: "10px 14px",
                            borderRadius: 999,
                            border: "none",
                            background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
                            color: "white",
                            fontWeight: 600,
                            fontSize: 15,
                            cursor: "pointer",
                            opacity: loading ? 0.7 : 1,
                        }}
                    >
                        {loading ? (isSignup ? "Signing up..." : "Logging in...") : isSignup ? "Create account" : "Login"}
                    </button>
                </form>

                {(import.meta as unknown as { env?: { VITE_GOOGLE_CLIENT_ID?: string } }).env?.VITE_GOOGLE_CLIENT_ID && !isSignup && (
                    <div style={{ marginTop: 24 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, color: "#6b7280", fontSize: 12 }}>
                            <div style={{ flex: 1, height: 1, backgroundColor: "rgba(55,65,81,0.8)" }} />
                            <span>Or continue with</span>
                            <div style={{ flex: 1, height: 1, backgroundColor: "rgba(55,65,81,0.8)" }} />
                        </div>
                        <div ref={googleButtonRef} style={{ display: "flex", justifyContent: "center" }} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginPage;
