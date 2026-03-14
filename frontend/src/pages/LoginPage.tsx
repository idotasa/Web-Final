import React, { FormEvent, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { uploadFile } from "../api";

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (c: unknown) => void;
                    renderButton: (el: HTMLElement, o: unknown) => void;
                };
            };
        };
    }
}

const LoginPage: React.FC = () => {
    const { login, register, loginWithGoogle, loading, error } = useAuth();
    const [mode, setMode] = useState<"login" | "signup">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const googleButtonRef = useRef<HTMLDivElement>(null);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setAvatarFile(file);
        setAvatarPreview(file ? URL.createObjectURL(file) : null);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (mode === "login") {
            await login(email, password);
        } else {
            let imgUrl: string | undefined;
            if (avatarFile) {
                setUploadingAvatar(true);
                try {
                    imgUrl = await uploadFile(avatarFile);
                } catch {
                    // If upload fails don't block registration — just skip the avatar
                    imgUrl = undefined;
                } finally {
                    setUploadingAvatar(false);
                }
            }
            await register(email, password, username, imgUrl);
        }
    };

    const isSignup = mode === "signup";

    useEffect(() => {
        if (isSignup) return;
        const clientId = (import.meta as unknown as { env?: { VITE_GOOGLE_CLIENT_ID?: string } }).env?.VITE_GOOGLE_CLIENT_ID;
        if (!clientId || !window.google) return;
        window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response: { credential?: string }) => {
                if (response.credential) loginWithGoogle(response.credential);
            },
        });
        const id = requestAnimationFrame(() => {
            const el = googleButtonRef.current;
            if (el) {
                window.google!.accounts.id.renderButton(el, {
                    type: "standard",
                    theme: "outline",
                    size: "large",
                    shape: "pill",
                    text: "continue_with",
                    width: 320,
                });
            }
        });
        return () => cancelAnimationFrame(id);
    }, [loginWithGoogle, isSignup]);

    const inputStyle: React.CSSProperties = {
        marginTop: 6,
        width: "100%",
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid rgba(148,163,184,0.5)",
        backgroundColor: "#020617",
        color: "#e5e7eb",
        outline: "none",
        fontSize: 14,
        boxSizing: "border-box",
    };

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
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, textAlign: "center" }}>
                    {isSignup ? "Join IO.Social" : "Welcome to IO.Social"}
                </h1>
                <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 16, textAlign: "center" }}>
                    {isSignup ? "Create your account." : "Login with your email and password."}
                </p>

                {/* Mode toggle */}
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
                        <>
                            {/* Avatar picker with preview */}
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                                <div
                                    style={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: "50%",
                                        overflow: "hidden",
                                        border: "2px solid rgba(148,163,184,0.4)",
                                        background: "#1e293b",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                    }}
                                >
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Avatar preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                        <span style={{ fontSize: 32, color: "#64748b" }}>👤</span>
                                    )}
                                </div>
                                <label
                                    htmlFor="signup-avatar"
                                    style={{
                                        fontSize: 12,
                                        color: "#0ea5e9",
                                        cursor: "pointer",
                                        textDecoration: "underline",
                                    }}
                                >
                                    {avatarFile ? "Change photo" : "Upload profile photo (optional)"}
                                </label>
                                <input
                                    id="signup-avatar"
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    style={{ display: "none" }}
                                />
                            </div>

                            <label style={{ fontSize: 14 }}>
                                Username
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    placeholder="Your username"
                                    style={inputStyle}
                                />
                            </label>
                        </>
                    )}
                    <label style={{ fontSize: 14 }}>
                        Email
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="you@example.com"
                            style={inputStyle}
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
                            style={inputStyle}
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
                        disabled={loading || uploadingAvatar}
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
                            opacity: loading || uploadingAvatar ? 0.7 : 1,
                        }}
                    >
                        {uploadingAvatar
                            ? "Uploading photo..."
                            : loading
                              ? isSignup
                                  ? "Signing up..."
                                  : "Logging in..."
                              : isSignup
                                ? "Create account"
                                : "Login"}
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
