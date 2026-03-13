import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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

export default Layout;
