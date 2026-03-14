import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getFeed, type FeedPost, type Post } from "../api";
import LoginPage from "./LoginPage";
import CreatePostForm from "../components/CreatePostForm";
import FeedPostCard from "../components/FeedPostCard";

const PAGE_SIZE = 10;
const font = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const HomePage: React.FC = () => {
    const { user, tokens, loading: authLoading } = useAuth();
    const [posts, setPosts] = useState<FeedPost[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadFeed = useCallback(
        async (pageNum: number, append: boolean) => {
            if (!tokens?.accessToken || !user) return;
            setLoading(true);
            setError(null);
            try {
                const res = await getFeed(tokens.accessToken, pageNum, PAGE_SIZE);
                setPosts((prev) => (append ? [...prev, ...res.data] : res.data));
                setHasMore(res.hasMore);
                setPage(res.page);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to load feed");
            } finally {
                setLoading(false);
            }
        },
        [tokens?.accessToken, user]
    );

    useEffect(() => {
        if (!user || !tokens?.accessToken) return;
        loadFeed(1, false);
    }, [user, tokens?.accessToken]);

    const handleLoadMore = () => {
        if (loading || !hasMore) return;
        loadFeed(page + 1, true);
    };

    const handleNewPost = (post: Post) => {
        const feedPost: FeedPost = {
            ...post,
            owner: user
                ? { _id: user._id, username: user.username, imgUrl: user.imgUrl }
                : post.owner,
            likesCount: 0,
            commentsCount: 0,
        };
        setPosts((prev) => [feedPost, ...prev]);
    };

    const handleLikeUpdate = (postId: string, likes: number, isLiked: boolean) => {
        setPosts((prev) =>
            prev.map((p) =>
                p._id === postId ? { ...p, likesCount: likes, isLiked } : p
            )
        );
    };

    if (authLoading) {
        return (
            <div style={{ padding: 24, textAlign: "center", color: "#9ca3af", fontFamily: font }}>
                Loading...
            </div>
        );
    }

    if (!user) {
        return <LoginPage />;
    }

    return (
        <div style={{ fontFamily: font, color: "#e5e7eb" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Feed</h2>
                <Link
                    to="/profile/me"
                    style={{
                        padding: "10px 18px",
                        borderRadius: 9999,
                        background: "rgba(148,163,184,0.2)",
                        color: "#e5e7eb",
                        textDecoration: "none",
                        fontWeight: 600,
                        fontSize: 14,
                    }}
                >
                    My profile
                </Link>
            </div>

            <CreatePostForm accessToken={tokens!.accessToken} onSubmitSuccess={handleNewPost} />

            {error && (
                <div
                    style={{
                        marginBottom: 16,
                        padding: 12,
                        borderRadius: 10,
                        background: "rgba(127,29,29,0.2)",
                        color: "#fecaca",
                        fontSize: 14,
                    }}
                >
                    {error}
                </div>
            )}

            {posts.length === 0 && !loading && (
                <div
                    style={{
                        padding: 48,
                        textAlign: "center",
                        background: "rgba(30,41,59,0.5)",
                        borderRadius: 16,
                        border: "1px solid rgba(148,163,184,0.2)",
                    }}
                >
                    <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Your feed is empty</p>
                    <p style={{ color: "#94a3b8", marginBottom: 20, maxWidth: 400, margin: "0 auto 20px" }}>
                        Follow people from their profiles to see their posts here. You can also create a post above.
                    </p>
                    <Link
                        to="/profile/me"
                        style={{
                            padding: "10px 20px",
                            borderRadius: 9999,
                            background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
                            color: "white",
                            textDecoration: "none",
                            fontWeight: 600,
                            fontSize: 14,
                        }}
                    >
                        Go to my profile
                    </Link>
                </div>
            )}

            <div>
                {posts.map((post) => (
                    <FeedPostCard
                        key={post._id}
                        post={post}
                        accessToken={tokens!.accessToken}
                        onLikeUpdate={handleLikeUpdate}
                    />
                ))}
            </div>

            {hasMore && posts.length > 0 && (
                <div style={{ textAlign: "center", marginTop: 24, marginBottom: 32 }}>
                    <button
                        type="button"
                        onClick={handleLoadMore}
                        disabled={loading}
                        style={{
                            padding: "12px 28px",
                            borderRadius: 9999,
                            border: "1px solid rgba(148,163,184,0.5)",
                            background: "transparent",
                            color: "#e5e7eb",
                            fontWeight: 600,
                            fontSize: 14,
                            cursor: loading ? "wait" : "pointer",
                            opacity: loading ? 0.7 : 1,
                        }}
                    >
                        {loading ? "Loading..." : "Load more"}
                    </button>
                </div>
            )}
        </div>
    );
};

export default HomePage;
