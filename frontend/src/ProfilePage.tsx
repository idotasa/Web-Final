import React, { FormEvent, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { getUserProfile, getPostsByOwner, updateUserProfile, Post, UserProfile } from "./api";

const ProfilePage: React.FC = () => {
    const { user, tokens, setUser } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [editUsername, setEditUsername] = useState("");
    const [editImgUrl, setEditImgUrl] = useState("");

    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                const [p, userPosts] = await Promise.all([
                    getUserProfile(user._id),
                    getPostsByOwner(user._id),
                ]);
                if (cancelled) return;
                setProfile(p);
                setPosts(userPosts);
                setEditUsername(p.username);
                setEditImgUrl(p.imgUrl || "");
                setError(null);
            } catch (e) {
                if (cancelled) return;
                setError(e instanceof Error ? e.message : "Failed to load profile");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [user]);

    const handleSave = async (e: FormEvent) => {
        e.preventDefault();
        if (!user || !tokens?.accessToken) return;
        try {
            setSaving(true);
            setError(null);
            const updated = await updateUserProfile(
                user._id,
                { username: editUsername, imgUrl: editImgUrl },
                tokens.accessToken
            );
            setProfile(updated);
            setUser({
                _id: updated._id,
                email: updated.email,
                username: updated.username,
                imgUrl: updated.imgUrl,
            });
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to save profile");
        } finally {
            setSaving(false);
        }
    };

    if (!user) return null;

    if (loading) {
        return <p>Loading profile...</p>;
    }

    if (!profile) {
        return <p>Profile not found.</p>;
    }

    const followersCount = profile.followers?.length ?? 0;
    const followingCount = profile.following?.length ?? 0;

    return (
        <div>
            <section
                style={{
                    display: "flex",
                    gap: 24,
                    alignItems: "center",
                    marginBottom: 32,
                }}
            >
                <div
                    style={{
                        width: 96,
                        height: 96,
                        borderRadius: "50%",
                        overflow: "hidden",
                        background:
                            "radial-gradient(circle at 0 0, #22d3ee 0, transparent 45%), radial-gradient(circle at 100% 0, #a855f7 0, transparent 45%), #020617",
                        border: "2px solid rgba(148,163,184,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}
                >
                    {profile.imgUrl ? (
                        // eslint-disable-next-line jsx-a11y/alt-text
                        <img
                            src={profile.imgUrl}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                    ) : (
                        <span style={{ fontSize: 32, fontWeight: 600 }}>
                            {profile.username.charAt(0).toUpperCase()}
                        </span>
                    )}
                </div>
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 700 }}>{profile.username}</h2>
                    <p style={{ color: "#9ca3af", marginTop: 4 }}>{profile.email}</p>
                    <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 14 }}>
                        <span>
                            <strong>{followersCount}</strong> followers
                        </span>
                        <span>
                            <strong>{followingCount}</strong> following
                        </span>
                        <span>
                            <strong>{posts.length}</strong> posts
                        </span>
                    </div>
                </div>
            </section>

            <section
                style={{
                    marginBottom: 32,
                    padding: 16,
                    borderRadius: 12,
                    backgroundColor: "rgba(15,23,42,0.9)",
                    border: "1px solid rgba(148,163,184,0.3)",
                    maxWidth: 480,
                }}
            >
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Edit profile</h3>
                <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <label style={{ fontSize: 14 }}>
                        Username
                        <input
                            type="text"
                            value={editUsername}
                            onChange={(e) => setEditUsername(e.target.value)}
                            required
                            style={{
                                marginTop: 6,
                                width: "100%",
                                padding: "8px 10px",
                                borderRadius: 8,
                                border: "1px solid rgba(148,163,184,0.5)",
                                backgroundColor: "#020617",
                                color: "#e5e7eb",
                                outline: "none",
                                fontSize: 14,
                            }}
                        />
                    </label>

                    <label style={{ fontSize: 14 }}>
                        Profile image URL
                        <input
                            type="url"
                            value={editImgUrl}
                            onChange={(e) => setEditImgUrl(e.target.value)}
                            placeholder="https://example.com/avatar.jpg"
                            style={{
                                marginTop: 6,
                                width: "100%",
                                padding: "8px 10px",
                                borderRadius: 8,
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
                                borderRadius: 8,
                                padding: "6px 8px",
                                border: "1px solid rgba(248,113,113,0.4)",
                            }}
                        >
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={saving}
                        style={{
                            marginTop: 4,
                            padding: "8px 12px",
                            borderRadius: 999,
                            border: "none",
                            background:
                                "radial-gradient(circle at 0 0, #22d3ee 0, transparent 45%), radial-gradient(circle at 100% 0, #a855f7 0, transparent 45%), linear-gradient(135deg, #0ea5e9, #6366f1)",
                            color: "white",
                            fontWeight: 600,
                            fontSize: 14,
                            cursor: "pointer",
                            opacity: saving ? 0.7 : 1,
                        }}
                    >
                        {saving ? "Saving..." : "Save changes"}
                    </button>
                </form>
            </section>

            <section>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Your posts</h3>
                {posts.length === 0 ? (
                    <p style={{ color: "#9ca3af" }}>You haven&apos;t posted anything yet.</p>
                ) : (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                            gap: 16,
                        }}
                    >
                        {posts.map((post) => (
                            <article
                                key={post._id}
                                style={{
                                    backgroundColor: "rgba(15,23,42,0.9)",
                                    borderRadius: 12,
                                    padding: 14,
                                    border: "1px solid rgba(148,163,184,0.3)",
                                }}
                            >
                                <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{post.title}</h4>
                                {post.content && (
                                    <p
                                        style={{
                                            fontSize: 14,
                                            color: "#9ca3af",
                                            marginBottom: 8,
                                            maxHeight: 80,
                                            overflow: "hidden",
                                        }}
                                    >
                                        {post.content}
                                    </p>
                                )}
                                {post.imgUrl && (
                                    // eslint-disable-next-line jsx-a11y/alt-text
                                    <img
                                        src={post.imgUrl}
                                        style={{
                                            width: "100%",
                                            maxHeight: 180,
                                            objectFit: "cover",
                                            borderRadius: 10,
                                            marginTop: 6,
                                        }}
                                    />
                                )}
                                <p
                                    style={{
                                        fontSize: 12,
                                        color: "#6b7280",
                                        marginTop: 8,
                                    }}
                                >
                                    {new Date(post.createdAt).toLocaleString()}
                                </p>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default ProfilePage;

