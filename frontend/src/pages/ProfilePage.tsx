import React, { FormEvent, useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    getUserProfile,
    getPostsByOwner,
    updateUserProfile,
    updatePost,
    deletePost,
    type Post,
    type UserProfile,
} from "../api";

const ProfilePage: React.FC = () => {
    const { userId } = useParams<"userId">();
    const navigate = useNavigate();
    const { user: currentUser, tokens, setUser } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editUsername, setEditUsername] = useState("");
    const [editImgUrl, setEditImgUrl] = useState("");
    const [showEditForm, setShowEditForm] = useState(false);
    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [editPostTitle, setEditPostTitle] = useState("");
    const [editPostContent, setEditPostContent] = useState("");
    const [editPostImgUrl, setEditPostImgUrl] = useState("");
    const [savingPost, setSavingPost] = useState(false);
    const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

    const profileId = userId === "me" || !userId ? currentUser?._id : userId;
    const isOwnProfile = !!currentUser && profileId === currentUser._id;

    useEffect(() => {
        if (!profileId) {
            setLoading(false);
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                setError(null);
                setShowEditForm(false);
                const [p, userPosts] = await Promise.all([
                    getUserProfile(profileId),
                    getPostsByOwner(profileId),
                ]);
                if (cancelled) return;
                setProfile(p);
                setPosts(userPosts);
                setEditUsername(p.username);
                setEditImgUrl(p.imgUrl || "");
            } catch (e) {
                if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load profile");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [profileId]);

    const handleSave = async (e: FormEvent) => {
        e.preventDefault();
        if (!currentUser || !tokens?.accessToken || !profileId || !isOwnProfile) return;
        try {
            setSaving(true);
            setError(null);
            const updated = await updateUserProfile(
                profileId,
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
            setShowEditForm(false);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const startEditPost = (p: Post) => {
        setEditingPostId(p._id);
        setEditPostTitle(p.title);
        setEditPostContent(p.content || "");
        setEditPostImgUrl(p.imgUrl || "");
    };

    const handleSavePost = async (e: FormEvent) => {
        e.preventDefault();
        if (!tokens?.accessToken || !editingPostId) return;
        setSavingPost(true);
        setError(null);
        try {
            const updated = await updatePost(tokens.accessToken, editingPostId, {
                title: editPostTitle.trim(),
                content: editPostContent.trim() || undefined,
                imgUrl: editPostImgUrl.trim() || undefined,
            });
            setPosts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
            setEditingPostId(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to update post");
        } finally {
            setSavingPost(false);
        }
    };

    const handleDeletePost = async (postId: string) => {
        if (!tokens?.accessToken || !window.confirm("Delete this post?")) return;
        setDeletingPostId(postId);
        setError(null);
        try {
            await deletePost(tokens.accessToken, postId);
            setPosts((prev) => prev.filter((p) => p._id !== postId));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to delete post");
        } finally {
            setDeletingPostId(null);
        }
    };

    if (!currentUser && !profileId) {
        return (
            <div style={{ padding: 24, color: "#e5e7eb", fontFamily: "system-ui, sans-serif" }}>
                <p>Please log in to view profiles.</p>
                <button
                    type="button"
                    onClick={() => navigate("/")}
                    style={{
                        marginTop: 12,
                        padding: "8px 14px",
                        borderRadius: 8,
                        border: "1px solid rgba(148,163,184,0.5)",
                        background: "transparent",
                        color: "#e5e7eb",
                        cursor: "pointer",
                    }}
                >
                    Go to login
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div style={{ padding: 48, color: "#9ca3af", fontFamily: "system-ui, sans-serif", textAlign: "center" }}>
                Loading profile...
            </div>
        );
    }

    if (!profile) {
        return (
            <div style={{ padding: 24, color: "#e5e7eb", fontFamily: "system-ui, sans-serif" }}>
                <p>Profile not found.</p>
                <button
                    type="button"
                    onClick={() => navigate("/")}
                    style={{
                        marginTop: 12,
                        padding: "8px 14px",
                        borderRadius: 8,
                        border: "1px solid rgba(148,163,184,0.5)",
                        background: "transparent",
                        color: "#e5e7eb",
                        cursor: "pointer",
                    }}
                >
                    Back
                </button>
            </div>
        );
    }

    const followersCount = profile.followers?.length ?? 0;
    const followingCount = profile.following?.length ?? 0;
    const font = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

    return (
        <div style={{ fontFamily: font, color: "#e5e7eb", paddingBottom: 48 }}>
            <div
                style={{
                    height: 200,
                    margin: "-24px -24px 0",
                    background: "linear-gradient(135deg, #1e3a5f 0%, #312e81 50%, #4c1d95 100%)",
                    borderBottom: "1px solid rgba(148,163,184,0.2)",
                }}
            />
            <div style={{ marginTop: -64, paddingLeft: 24, paddingRight: 24, marginBottom: 24 }}>
                <div
                    style={{
                        width: 128,
                        height: 128,
                        borderRadius: "50%",
                        overflow: "hidden",
                        border: "4px solid #0f172a",
                        background: "#1e293b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                    }}
                >
                    {profile.imgUrl ? (
                        <img src={profile.imgUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                        <span style={{ fontSize: 48, fontWeight: 700, color: "#64748b" }}>
                            {profile.username.charAt(0).toUpperCase()}
                        </span>
                    )}
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 800, marginTop: 16, marginBottom: 4 }}>{profile.username}</h1>
                {isOwnProfile && (
                    <p style={{ color: "#94a3b8", fontSize: 15, marginBottom: 16 }}>{profile.email}</p>
                )}
                <div style={{ display: "flex", gap: 24, fontSize: 15, marginBottom: 20 }}>
                    <span><strong style={{ color: "#e5e7eb" }}>{posts.length}</strong> posts</span>
                    <span><strong style={{ color: "#e5e7eb" }}>{followersCount}</strong> followers</span>
                    <span><strong style={{ color: "#e5e7eb" }}>{followingCount}</strong> following</span>
                </div>
                {isOwnProfile && (
                    <div style={{ marginBottom: 24 }}>
                        <button
                            type="button"
                            onClick={() => setShowEditForm((v) => !v)}
                            style={{
                                padding: "10px 24px",
                                borderRadius: 9999,
                                border: "1px solid rgba(148,163,184,0.5)",
                                background: "transparent",
                                color: "#e5e7eb",
                                fontWeight: 600,
                                fontSize: 15,
                                cursor: "pointer",
                            }}
                        >
                            {showEditForm ? "Cancel" : "Edit profile"}
                        </button>
                    </div>
                )}
                {isOwnProfile && showEditForm && (
                    <div
                        style={{
                            padding: 20,
                            borderRadius: 16,
                            backgroundColor: "rgba(30,41,59,0.8)",
                            border: "1px solid rgba(148,163,184,0.25)",
                            maxWidth: 420,
                            marginBottom: 24,
                        }}
                    >
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Edit profile</h3>
                        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
                                        padding: "10px 12px",
                                        borderRadius: 8,
                                        border: "1px solid rgba(148,163,184,0.4)",
                                        backgroundColor: "#0f172a",
                                        color: "#e5e7eb",
                                        outline: "none",
                                        fontSize: 15,
                                    }}
                                />
                            </label>
                            <label style={{ fontSize: 14 }}>
                                Profile photo URL
                                <input
                                    type="url"
                                    value={editImgUrl}
                                    onChange={(e) => setEditImgUrl(e.target.value)}
                                    placeholder="https://..."
                                    style={{
                                        marginTop: 6,
                                        width: "100%",
                                        padding: "10px 12px",
                                        borderRadius: 8,
                                        border: "1px solid rgba(148,163,184,0.4)",
                                        backgroundColor: "#0f172a",
                                        color: "#e5e7eb",
                                        outline: "none",
                                        fontSize: 15,
                                    }}
                                />
                            </label>
                            {error && (
                                <div
                                    style={{
                                        fontSize: 13,
                                        color: "#fecaca",
                                        backgroundColor: "rgba(127,29,29,0.2)",
                                        borderRadius: 8,
                                        padding: "8px 10px",
                                    }}
                                >
                                    {error}
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={saving}
                                style={{
                                    padding: "10px 20px",
                                    borderRadius: 9999,
                                    border: "none",
                                    background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
                                    color: "white",
                                    fontWeight: 600,
                                    fontSize: 15,
                                    cursor: "pointer",
                                    opacity: saving ? 0.7 : 1,
                                }}
                            >
                                {saving ? "Saving..." : "Save"}
                            </button>
                        </form>
                    </div>
                )}
            </div>
            <div style={{ borderTop: "1px solid rgba(148,163,184,0.2)", paddingTop: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
                    {isOwnProfile ? "Your posts" : "Posts"}
                </h2>
                {posts.length === 0 ? (
                    <p style={{ color: "#94a3b8", fontSize: 15 }}>
                        {isOwnProfile ? "You haven't posted anything yet." : "No posts yet."}
                    </p>
                ) : (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                            gap: 16,
                        }}
                    >
                        {posts.map((post) => (
                            <article
                                key={post._id}
                                style={{
                                    backgroundColor: "rgba(30,41,59,0.6)",
                                    borderRadius: 16,
                                    overflow: "hidden",
                                    border: "1px solid rgba(148,163,184,0.2)",
                                    position: "relative",
                                }}
                            >
                                {editingPostId === post._id ? (
                                    <div
                                        style={{ padding: 14 }}
                                        onClick={(e) => e.stopPropagation()}
                                        role="presentation"
                                    >
                                        <form onSubmit={handleSavePost} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                            <input
                                                value={editPostTitle}
                                                onChange={(e) => setEditPostTitle(e.target.value)}
                                                required
                                                placeholder="Title"
                                                style={{
                                                    padding: "8px 10px",
                                                    borderRadius: 8,
                                                    border: "1px solid rgba(148,163,184,0.4)",
                                                    background: "#0f172a",
                                                    color: "#e5e7eb",
                                                    fontSize: 14,
                                                }}
                                            />
                                            <textarea
                                                value={editPostContent}
                                                onChange={(e) => setEditPostContent(e.target.value)}
                                                placeholder="Content (optional)"
                                                rows={2}
                                                style={{
                                                    padding: "8px 10px",
                                                    borderRadius: 8,
                                                    border: "1px solid rgba(148,163,184,0.4)",
                                                    background: "#0f172a",
                                                    color: "#e5e7eb",
                                                    fontSize: 14,
                                                    resize: "vertical",
                                                }}
                                            />
                                            <input
                                                value={editPostImgUrl}
                                                onChange={(e) => setEditPostImgUrl(e.target.value)}
                                                placeholder="Image URL (optional)"
                                                type="url"
                                                style={{
                                                    padding: "8px 10px",
                                                    borderRadius: 8,
                                                    border: "1px solid rgba(148,163,184,0.4)",
                                                    background: "#0f172a",
                                                    color: "#e5e7eb",
                                                    fontSize: 14,
                                                }}
                                            />
                                            <div style={{ display: "flex", gap: 8 }}>
                                                <button
                                                    type="submit"
                                                    disabled={savingPost}
                                                    style={{
                                                        padding: "6px 14px",
                                                        borderRadius: 8,
                                                        border: "none",
                                                        background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
                                                        color: "white",
                                                        fontWeight: 600,
                                                        fontSize: 13,
                                                        cursor: savingPost ? "wait" : "pointer",
                                                    }}
                                                >
                                                    {savingPost ? "Saving..." : "Save"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingPostId(null)}
                                                    style={{
                                                        padding: "6px 14px",
                                                        borderRadius: 8,
                                                        border: "1px solid rgba(148,163,184,0.5)",
                                                        background: "transparent",
                                                        color: "#e5e7eb",
                                                        fontSize: 13,
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                ) : (
                                    <>
                                        <Link
                                            to={`/post/${post._id}`}
                                            style={{ textDecoration: "none", color: "inherit", display: "block" }}
                                        >
                                            {post.imgUrl && (
                                                <div style={{ aspectRatio: "1", overflow: "hidden", background: "#0f172a" }}>
                                                    <img
                                                        src={post.imgUrl}
                                                        alt=""
                                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                    />
                                                </div>
                                            )}
                                            <div style={{ padding: 14 }}>
                                                <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{post.title}</h4>
                                                {post.content && (
                                                    <p
                                                        style={{
                                                            fontSize: 14,
                                                            color: "#94a3b8",
                                                            marginBottom: 8,
                                                            maxHeight: 60,
                                                            overflow: "hidden",
                                                            display: "-webkit-box",
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: "vertical",
                                                        }}
                                                    >
                                                        {post.content}
                                                    </p>
                                                )}
                                                <p style={{ fontSize: 12, color: "#64748b" }}>
                                                    {new Date(post.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </Link>
                                        {isOwnProfile && (
                                            <div
                                                style={{
                                                    padding: "8px 14px",
                                                    borderTop: "1px solid rgba(148,163,184,0.2)",
                                                    display: "flex",
                                                    gap: 12,
                                                }}
                                                onClick={(e) => e.preventDefault()}
                                                role="presentation"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => startEditPost(post)}
                                                    style={{
                                                        padding: "4px 10px",
                                                        borderRadius: 6,
                                                        border: "1px solid rgba(148,163,184,0.4)",
                                                        background: "transparent",
                                                        color: "#94a3b8",
                                                        fontSize: 12,
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeletePost(post._id)}
                                                    disabled={deletingPostId === post._id}
                                                    style={{
                                                        padding: "4px 10px",
                                                        borderRadius: 6,
                                                        border: "1px solid rgba(239,68,68,0.5)",
                                                        background: "transparent",
                                                        color: "#f87171",
                                                        fontSize: 12,
                                                        cursor: deletingPostId === post._id ? "wait" : "pointer",
                                                    }}
                                                >
                                                    {deletingPostId === post._id ? "Deleting..." : "Delete"}
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;
