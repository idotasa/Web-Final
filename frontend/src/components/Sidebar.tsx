import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getFollowing, searchUsers, toggleFollow, type UserSummary } from "../api";

const font = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

type SidebarProps = {
    currentUserId: string;
    accessToken: string;
};

const Sidebar: React.FC<SidebarProps> = ({ currentUserId, accessToken }) => {
    const [following, setFollowing] = useState<UserSummary[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<UserSummary[]>([]);
    const [searching, setSearching] = useState(false);
    const [loadingFollowing, setLoadingFollowing] = useState(true);
    const [followLoadingId, setFollowLoadingId] = useState<string | null>(null);

    const followingIds = new Set(following.map((u) => u._id));

    const handleToggleFollow = async (userId: string) => {
        if (followLoadingId) return;
        setFollowLoadingId(userId);
        try {
            await toggleFollow(accessToken, userId);
            const list = await getFollowing(currentUserId);
            setFollowing(list);
        } catch {
            // keep state as is
        } finally {
            setFollowLoadingId(null);
        }
    };

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const list = await getFollowing(currentUserId);
                if (!cancelled) setFollowing(list);
            } catch {
                if (!cancelled) setFollowing([]);
            } finally {
                if (!cancelled) setLoadingFollowing(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [currentUserId]);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        const t = setTimeout(async () => {
            setSearching(true);
            try {
                const list = await searchUsers(searchQuery.trim());
                setSearchResults(list.filter((u) => u._id !== currentUserId));
            } catch {
                setSearchResults([]);
            } finally {
                setSearching(false);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [searchQuery, currentUserId]);

    return (
        <aside
            style={{
                fontFamily: font,
                width: 280,
                flexShrink: 0,
                position: "sticky",
                top: 24,
                alignSelf: "flex-start",
            }}
        >
            <div
                style={{
                    background: "rgba(30,41,59,0.5)",
                    borderRadius: 16,
                    border: "1px solid rgba(148,163,184,0.2)",
                    overflow: "hidden",
                }}
            >
                <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#e5e7eb", margin: 0 }}>
                        Following
                    </h3>
                </div>
                <div style={{ maxHeight: 260, overflowY: "auto" }}>
                    {loadingFollowing ? (
                        <div style={{ padding: 20, color: "#94a3b8", fontSize: 14 }}>Loading...</div>
                    ) : following.length === 0 ? (
                        <div style={{ padding: 16, color: "#94a3b8", fontSize: 14 }}>
                            Follow people from their profiles to see them here.
                        </div>
                    ) : (
                        following.slice(0, 15).map((u) => (
                            <Link
                                key={u._id}
                                to={`/profile/${u._id}`}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    padding: "10px 16px",
                                    textDecoration: "none",
                                    color: "#e5e7eb",
                                    borderBottom: "1px solid rgba(148,163,184,0.1)",
                                }}
                            >
                                <div
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: "50%",
                                        overflow: "hidden",
                                        background: "#1e293b",
                                        flexShrink: 0,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    {u.imgUrl ? (
                                        <img src={u.imgUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                        <span style={{ fontSize: 14, fontWeight: 700, color: "#64748b" }}>
                                            {(u.username || "?").charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <span style={{ fontWeight: 600, fontSize: 14 }}>{u.username}</span>
                            </Link>
                        ))
                    )}
                </div>
            </div>

            <div
                style={{
                    marginTop: 16,
                    background: "rgba(30,41,59,0.5)",
                    borderRadius: 16,
                    border: "1px solid rgba(148,163,184,0.2)",
                    overflow: "hidden",
                }}
            >
                <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#e5e7eb", margin: 0 }}>
                        Find people
                    </h3>
                </div>
                <div style={{ padding: 12 }}>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by username..."
                        style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: 10,
                            border: "1px solid rgba(148,163,184,0.4)",
                            background: "#0f172a",
                            color: "#e5e7eb",
                            fontSize: 14,
                            outline: "none",
                            boxSizing: "border-box",
                        }}
                    />
                    <div style={{ marginTop: 8, maxHeight: 200, overflowY: "auto" }}>
                        {searching && (
                            <div style={{ padding: 8, color: "#94a3b8", fontSize: 13 }}>Searching...</div>
                        )}
                        {!searching && searchQuery.trim() && searchResults.length === 0 && (
                            <div style={{ padding: 8, color: "#94a3b8", fontSize: 13 }}>No users found</div>
                        )}
                        {!searching &&
                            searchResults.slice(0, 8).map((u) => {
                                const isFollowing = followingIds.has(u._id);
                                const loading = followLoadingId === u._id;
                                return (
                                    <div
                                        key={u._id}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 10,
                                            padding: "8px 0",
                                            justifyContent: "space-between",
                                        }}
                                    >
                                        <Link
                                            to={`/profile/${u._id}`}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 10,
                                                flex: 1,
                                                minWidth: 0,
                                                textDecoration: "none",
                                                color: "#e5e7eb",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: "50%",
                                                    overflow: "hidden",
                                                    background: "#1e293b",
                                                    flexShrink: 0,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                {u.imgUrl ? (
                                                    <img src={u.imgUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                ) : (
                                                    <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>
                                                        {(u.username || "?").charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <span style={{ fontWeight: 500, fontSize: 14 }}>{u.username}</span>
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleToggleFollow(u._id);
                                            }}
                                            disabled={loading}
                                            style={{
                                                flexShrink: 0,
                                                padding: "6px 12px",
                                                borderRadius: 9999,
                                                border: "none",
                                                background: isFollowing ? "rgba(148,163,184,0.3)" : "linear-gradient(135deg, #0ea5e9, #6366f1)",
                                                color: "#e5e7eb",
                                                fontSize: 12,
                                                fontWeight: 600,
                                                cursor: loading ? "wait" : "pointer",
                                                opacity: loading ? 0.7 : 1,
                                            }}
                                        >
                                            {loading ? "..." : isFollowing ? "Unfollow" : "Follow"}
                                        </button>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
