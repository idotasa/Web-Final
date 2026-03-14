import React, { FormEvent, useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    getPostById,
    getComments,
    addComment,
    deleteComment,
    likePost,
    getUserProfile,
    type Post,
    type Comment as CommentType,
} from "../api";

const font = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const PostPage: React.FC = () => {
    const { postId } = useParams<"postId">();
    const navigate = useNavigate();
    const { user, tokens } = useAuth();
    const [post, setPost] = useState<Post | null>(null);
    const [ownerName, setOwnerName] = useState<string>("User");
    const [ownerImg, setOwnerImg] = useState<string>("");
    const [ownerId, setOwnerId] = useState<string>("");
    const [comments, setComments] = useState<CommentType[]>([]);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState("");
    const [submittingComment, setSubmittingComment] = useState(false);
    const [likes, setLikes] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [liking, setLiking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!postId) {
            setLoading(false);
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                setError(null);
                const accessToken = tokens?.accessToken;
                const [postData, commentsData] = await Promise.all([
                    getPostById(postId, accessToken),
                    getComments(postId),
                ]);
                if (cancelled) return;
                setPost(postData);
                setComments(commentsData);
                const owner = postData.owner;
                if (typeof owner === "string") {
                    try {
                        const profile = await getUserProfile(owner);
                        if (!cancelled) {
                            setOwnerName(profile.username);
                            setOwnerImg(profile.imgUrl || "");
                            setOwnerId(profile._id);
                        }
                    } catch {
                        if (!cancelled) setOwnerId(owner);
                    }
                } else {
                    setOwnerName(owner.username);
                    setOwnerImg(owner.imgUrl || "");
                    setOwnerId(owner._id);
                }
                setLikes(postData.likes?.length ?? 0);
                if (typeof postData.isLiked === "boolean") setIsLiked(postData.isLiked);
            } catch (e) {
                if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load post");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [postId, tokens?.accessToken]);

    const handleSubmitComment = async (e: FormEvent) => {
        e.preventDefault();
        if (!tokens?.accessToken || !postId || !commentText.trim()) return;
        setSubmittingComment(true);
        try {
            const newComment = await addComment(tokens.accessToken, postId, commentText.trim());
            const commentWithOwner = user
                ? { ...newComment, owner: { _id: user._id, username: user.username, imgUrl: user.imgUrl } }
                : newComment;
            setComments((prev) => [commentWithOwner, ...prev]);
            setCommentText("");
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!tokens?.accessToken || !window.confirm("Are you sure you want to delete this comment?")) return;
        try {
            await deleteComment(tokens.accessToken, commentId);
            setComments((prev) => prev.filter((c) => c._id !== commentId));
        } catch (e) {
            alert(e instanceof Error ? e.message : "Failed to delete comment");
        }
    };

    const handleLike = async () => {
        if (!tokens?.accessToken || !postId || liking) return;
        setLiking(true);
        try {
            const result = await likePost(tokens.accessToken, postId);
            setIsLiked(result.isLiked);
            setLikes(result.likes);
        } finally {
            setLiking(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: 48, textAlign: "center", color: "#9ca3af", fontFamily: font }}>
                Loading post...
            </div>
        );
    }

    if (error || !post) {
        return (
            <div style={{ padding: 24, fontFamily: font, color: "#e5e7eb" }}>
                <p>{error || "Post not found."}</p>
                <button
                    type="button"
                    onClick={() => navigate(-1)}
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

    return (
        <div style={{ fontFamily: font, color: "#e5e7eb", paddingBottom: 48 }}>
            <div style={{ marginBottom: 24 }}>
                <Link
                    to="/"
                    style={{
                        fontSize: 14,
                        color: "#94a3b8",
                        textDecoration: "none",
                    }}
                >
                    ← Back to feed
                </Link>
            </div>

            <article
                style={{
                    background: "rgba(30,41,59,0.6)",
                    borderRadius: 16,
                    border: "1px solid rgba(148,163,184,0.2)",
                    overflow: "hidden",
                    marginBottom: 24,
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
                            width: 44,
                            height: 44,
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
                        {ownerImg ? (
                            <img src={ownerImg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                            <span style={{ fontSize: 20, fontWeight: 700 }}>{ownerName.charAt(0).toUpperCase()}</span>
                        )}
                    </Link>
                    <div>
                        <Link
                            to={ownerId ? `/profile/${ownerId}` : "#"}
                            style={{
                                fontWeight: 700,
                                fontSize: 16,
                                color: "#e5e7eb",
                                textDecoration: "none",
                                display: "block",
                            }}
                        >
                            {ownerName}
                        </Link>
                        <time style={{ fontSize: 13, color: "#94a3b8" }}>
                            {new Date(post.createdAt).toLocaleString()}
                        </time>
                    </div>
                </header>
                <div style={{ padding: "16px 16px 12px" }}>
                    <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: "#e5e7eb" }}>
                        {post.title}
                    </h1>
                    {post.content && (
                        <p
                            style={{
                                fontSize: 16,
                                color: "#cbd5e1",
                                lineHeight: 1.5,
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                                marginBottom: post.imgUrl ? 12 : 0,
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
                            }}
                        >
                            <img
                                src={post.imgUrl}
                                alt=""
                                style={{ width: "100%", display: "block", maxHeight: 500, objectFit: "contain" }}
                            />
                        </div>
                    )}
                </div>
                {user && tokens?.accessToken && (
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
                        >
                            <span style={{ fontSize: 20 }}>{isLiked ? "❤️" : "🤍"}</span>
                            <span>{likes}</span>
                        </button>
                        <span style={{ fontSize: 14, color: "#94a3b8" }}>
                            {comments.length} {comments.length === 1 ? "comment" : "comments"}
                        </span>
                    </footer>
                )}
            </article>

            <section style={{ marginTop: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Comments</h2>

                {user && tokens?.accessToken && (
                    <form
                        onSubmit={handleSubmitComment}
                        style={{
                            marginBottom: 24,
                            display: "flex",
                            gap: 12,
                            alignItems: "flex-start",
                        }}
                    >
                        <input
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Write a comment..."
                            maxLength={500}
                            style={{
                                flex: 1,
                                padding: "12px 14px",
                                borderRadius: 10,
                                border: "1px solid rgba(148,163,184,0.4)",
                                background: "#0f172a",
                                color: "#e5e7eb",
                                fontSize: 15,
                                outline: "none",
                            }}
                        />
                        <button
                            type="submit"
                            disabled={submittingComment || !commentText.trim()}
                            style={{
                                padding: "12px 20px",
                                borderRadius: 9999,
                                border: "none",
                                background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
                                color: "white",
                                fontWeight: 600,
                                fontSize: 14,
                                cursor: submittingComment ? "wait" : "pointer",
                                opacity: commentText.trim() ? 1 : 0.5,
                            }}
                        >
                            {submittingComment ? "..." : "Comment"}
                        </button>
                    </form>
                )}

                {comments.length === 0 ? (
                    <p style={{ color: "#94a3b8", fontSize: 15 }}>No comments yet.</p>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {comments.map((c) => {
                            const author = typeof c.owner === "string" ? null : c.owner;
                            const authorName = author?.username ?? "User";
                            const authorImg = author?.imgUrl ?? "";
                            const authorId = author?._id ?? (typeof c.owner === "string" ? c.owner : "");
                            return (
                                <div
                                    key={c._id}
                                    style={{
                                        padding: 14,
                                        borderRadius: 12,
                                        background: "rgba(30,41,59,0.5)",
                                        border: "1px solid rgba(148,163,184,0.15)",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 10,
                                            marginBottom: 8,
                                        }}
                                    >
                                        {authorId ? (
                                            <Link
                                                to={`/profile/${authorId}`}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                    textDecoration: "none",
                                                    color: "#e5e7eb",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: 28,
                                                        height: 28,
                                                        borderRadius: "50%",
                                                        overflow: "hidden",
                                                        background: "#1e293b",
                                                        flexShrink: 0,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                    }}
                                                >
                                                    {authorImg ? (
                                                        <img
                                                            src={authorImg}
                                                            alt=""
                                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                        />
                                                    ) : (
                                                        <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>
                                                            {authorName.charAt(0).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <span style={{ fontWeight: 600, fontSize: 14 }}>{authorName}</span>
                                            </Link>
                                        ) : (
                                            <span style={{ fontWeight: 600, fontSize: 14, color: "#e5e7eb" }}>
                                                {authorName}
                                            </span>
                                        )}
                                        <span style={{ fontSize: 12, color: "#64748b" }}>
                                            {new Date(c.createdAt).toLocaleString()}
                                        </span>
                                        {user && authorId === user._id && (
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteComment(c._id)}
                                                style={{
                                                    marginLeft: "auto",
                                                    background: "none",
                                                    border: "none",
                                                    color: "#ef4444",
                                                    fontSize: 12,
                                                    cursor: "pointer",
                                                    padding: "4px 8px",
                                                    borderRadius: 6,
                                                    transition: "background 0.2s",
                                                }}
                                                onMouseOver={(e) =>
                                                    (e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)")
                                                }
                                                onMouseOut={(e) => (e.currentTarget.style.background = "none")}
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                    <p style={{ fontSize: 14, color: "#cbd5e1", margin: 0, whiteSpace: "pre-wrap" }}>
                                        {c.content}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
};

export default PostPage;
