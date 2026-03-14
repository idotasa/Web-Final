import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, tokens, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const isProfilePage = location.pathname.startsWith("/profile");

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
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        textDecoration: "none",
                        color: "#e5e7eb",
                    }}
                >
                    <div
                        style={{
                            width: 42,
                            height: 42,
                            borderRadius: "50%",
                            overflow: "hidden",
                            flexShrink: 0,
                            background: "#0f172a",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <img
                            src="/logo.png"
                            alt="iO Social"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                    </div>
                    <span style={{ fontSize: 22, fontWeight: 700 }}>IO Social</span>
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
            <div
                style={{
                    display: "flex",
                    gap: isProfilePage ? 48 : 24,
                    padding: "24px 24px 48px",
                    maxWidth: isProfilePage ? 1200 : 900,
                    margin: "0 auto",
                    alignItems: "flex-start",
                }}
            >
                <main style={{ flex: 1, minWidth: 0, maxWidth: isProfilePage ? 900 : 640, paddingRight: isProfilePage ? 16 : 0 }}>
                    {children}
                </main>
                {isProfilePage && tokens?.accessToken && <Sidebar currentUserId={user._id} accessToken={tokens.accessToken} />}
            </div>
        </div>
    );
};

export default Layout;
