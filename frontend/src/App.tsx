import React from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import LoginPage from "./LoginPage";

const AppContent: React.FC = () => {
    const { user, logout, loading } = useAuth();

    if (loading) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#020617",
                    color: "#e5e7eb",
                    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                }}
            >
                Loading...
            </div>
        );
    }

    if (!user) {
        return <LoginPage />;
    }

    return (
        <div
            style={{
                minHeight: "100vh",
                padding: 32,
                background: "radial-gradient(circle at top, #0ea5e9 0, transparent 55%), #020617",
                color: "#e5e7eb",
                fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
        >
            <header
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 32,
                }}
            >
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 700 }}>IO Social</h1>
                    <p style={{ color: "#9ca3af", marginTop: 4 }}>You are logged in as {user.email}</p>
                </div>
                <button
                    onClick={logout}
                    style={{
                        padding: "8px 14px",
                        borderRadius: 999,
                        border: "1px solid rgba(148,163,184,0.5)",
                        backgroundColor: "transparent",
                        color: "#e5e7eb",
                        cursor: "pointer",
                        fontSize: 14,
                    }}
                >
                    Logout
                </button>
            </header>

            <main>
                <p>Protected content goes here. You are authenticated with JWT.</p>
            </main>
        </div>
    );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

export default App;

