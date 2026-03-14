import React, { useState } from "react";
import { Link } from "react-router-dom";
import { likePost, type FeedPost } from "../api";

const font = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

function formatDate(createdAt: string): string {
    const d = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
}

type FeedPostCardProps = {
    post: FeedPost & { isLiked?: boolean };
    accessToken: string;
    currentUserId: string;
    onLikeUpdate: (postId: string, likes: number, isLiked: boolean) => void;
};

const FeedPostCard: React.FC<FeedPostCardProps> = ({
    post,
    accessToken,
    currentUserId,
    onLikeUpdate,
}) => {
    const [liking, setLiking] = useState(false);
    const owner = typeof post.owner === "string" ? null : post.owner;
    const ownerId = owner?._id ?? (typeof post.owner === "string" ? post.owner : "");
    const username = owner?.username ?? "User";
    const imgUrl = owner?.imgUrl ?? "";
    const likesCount = post.likesCount ?? 0;
    const commentsCount = post.commentsCount ?? 0;
    const [isLiked, setIsLiked] = useState(post.isLiked ?? false);
    const [likes, setLikes] = useState(likesCount);

    const handleLike = async () => {
        if (liking) return;
        setLiking(true);
        try {
            const result = await likePost(accessToken, post._id);
            setIsLiked(result.isLiked);
            setLikes(result.likes);
            onLikeUpdate(post._id, result.likes, result.isLiked);
        } finally {
            setLiking(false);
        }
    };

    return (
        <article
            style={{
                fontFamily: font,
                background: "rgba(30,41,59,0.6)",
                borderRadius: 16,
                border: "1px solid rgba(148,163,184,0.2)",
                overflow: "hidden",
                marginBottom: 16,
            }}
        >
            <header
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 16px",
                    borderBottom: "1px solid rgba(148,163,184,0.15)",
                }}
            >
                <Link
                    to={ownerId ? `/profile/${ownerId}` : "#"}
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        overflow: "hidden",
                        flexShrink: 0,
                        background: "#1e293b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        textDecoration: "none",
                        color: "#e5e7eb",
                    }}
                >
                    {imgUrl ? (
                        <img src={imgUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                        <span style={{ fontSize: 18, fontWeight: 700 }}>{username.charAt(0).toUpperCase()}</span>
                    )}
                </Link>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <Link
                        to={ownerId ? `/profile/${ownerId}` : "#"}
                        style={{
                            fontWeight: 700,
                            fontSize: 15,
                            color: "#e5e7eb",
                            textDecoration: "none",
                            display: "block",
                        }}
                    >
                        {username}
                    </Link>
                    <time style={{ fontSize: 13, color: "#94a3b8" }}>{formatDate(post.createdAt)}</time>
                </div>
            </header>
            <div style={{ padding: "12px 16px 10px" }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6, color: "#e5e7eb" }}>
                    {post.title}
                </h3>
                {post.content && (
                    <p
                        style={{
                            fontSize: 15,
                            color: "#cbd5e1",
                            lineHeight: 1.45,
                            marginBottom: post.imgUrl ? 12 : 0,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                        }}
                    >
                        {post.content}
                    </p>
                )}
                {post.imgUrl && (
                    <div
                        style={{
                            borderRadius: 12,
                            overflow: "hidden",
                            background: "#0f172a",
                            marginTop: 8,
                            maxHeight: 400,
                        }}
                    >
                        <img
                            src={post.imgUrl}
                            alt=""
                            style={{ width: "100%", display: "block", maxHeight: 400, objectFit: "cover" }}
                        />
                    </div>
                )}
            </div>
            <footer
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 20,
                    padding: "10px 16px 14px",
                    borderTop: "1px solid rgba(148,163,184,0.15)",
                }}
            >
                <button
                    type="button"
                    onClick={handleLike}
                    disabled={liking}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        background: "none",
                        border: "none",
                        color: isLiked ? "#f472b6" : "#94a3b8",
                        cursor: liking ? "wait" : "pointer",
                        fontSize: 14,
                        padding: "4px 0",
                    }}
                    aria-label={isLiked ? "Unlike" : "Like"}
                >
                    <span style={{ fontSize: 20 }}>{isLiked ? "❤️" : "🤍"}</span>
                    <span>{likes}</span>
                </button>
                <span style={{ fontSize: 14, color: "#94a3b8" }}>
                    {commentsCount} {commentsCount === 1 ? "comment" : "comments"}
                </span>
            </footer>
        </article>
    );
};

export default FeedPostCard;
