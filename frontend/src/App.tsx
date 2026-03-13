import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import LoginPage from "./LoginPage";
import ProfilePage from "./ProfilePage";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    if (!user) {
        return <>{children}</>;
    }

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "radial-gradient(circle at top, #0ea5e9 0, transparent 55%), #020617",
                color: "#e5e7eb",
                fontFamily: "system-ui, sans-serif",
            }}
        >
            <header
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px 24px",
                    borderBottom: "1px solid rgba(148,163,184,0.2)",
                    backgroundColor: "rgba(15,23,42,0.6)",
                }}
            >
                <Link
                    to="/"
                    style={{
                        fontSize: 22,
                        fontWeight: 700,
                        color: "#e5e7eb",
                        textDecoration: "none",
                    }}
                >
                    IO Social
                </Link>
                <nav style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <Link
                        to="/profile/me"
                        style={{
                            padding: "8px 14px",
                            borderRadius: 8,
                            color: "#e5e7eb",
                            textDecoration: "none",
                            border: "1px solid rgba(148,163,184,0.4)",
                        }}
                    >
                        My profile
                    </Link>
                    <button
                        type="button"
                        onClick={async () => {
                            await logout();
                            navigate("/");
                        }}
                        style={{
                            padding: "8px 14px",
                            borderRadius: 8,
                            border: "1px solid rgba(148,163,184,0.5)",
                            backgroundColor: "transparent",
                            color: "#e5e7eb",
                            cursor: "pointer",
                            fontSize: 14,
                        }}
                    >
                        Logout
                    </button>
                </nav>
            </header>
            <main style={{ padding: "24px 24px 48px", maxWidth: 900, margin: "0 auto" }}>
                {children}
            </main>
        </div>
    );
};

const HomePage: React.FC = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    if (loading) {
        return (
            <div style={{ padding: 24, textAlign: "center", color: "#9ca3af" }}>
                Loading...
            </div>
        );
    }

    if (!user) {
        return <LoginPage />;
    }

    return (
        <div style={{ padding: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Home</h2>
            <p style={{ color: "#9ca3af", marginBottom: 24 }}>
                Feed will appear here later. You can open your profile or any user’s profile by URL.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link
                    to="/profile/me"
                    style={{
                        padding: "10px 18px",
                        borderRadius: 999,
                        background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
                        color: "white",
                        textDecoration: "none",
                        fontWeight: 600,
                        fontSize: 14,
                    }}
                >
                    My profile
                </Link>
                <button
                    type="button"
                    onClick={() => navigate("/profile/me")}
                    style={{
                        padding: "10px 18px",
                        borderRadius: 999,
                        border: "1px solid rgba(148,163,184,0.5)",
                        background: "transparent",
                        color: "#e5e7eb",
                        cursor: "pointer",
                        fontSize: 14,
                    }}
                >
                    View profile by ID: /profile/{user._id}
                </button>
            </div>
            <p style={{ marginTop: 24, fontSize: 13, color: "#6b7280" }}>
                To view another user’s profile (e.g. from a future feed), go to: <code style={{ background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: 4 }}>/profile/&lt;userId&gt;</code>
            </p>
        </div>
    );
};

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Layout>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/profile" element={<Navigate to="/profile/me" replace />} />
                        <Route path="/profile/me" element={<ProfilePage />} />
                        <Route path="/profile/:userId" element={<ProfilePage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Layout>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
