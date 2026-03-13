import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoginPage from "./LoginPage";

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
                Feed will appear here later. You can open your profile or any user's profile by URL.
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
                To view another user's profile (e.g. from a future feed), go to:{" "}
                <code style={{ background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: 4 }}>
                    /profile/&lt;userId&gt;
                </code>
            </p>
        </div>
    );
};

export default HomePage;
