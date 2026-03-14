import React, { FormEvent, useState } from "react";
import { createPost, type Post } from "../api";

const font = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

type CreatePostFormProps = {
    accessToken: string;
    onSubmitSuccess: (post: Post) => void;
};

const CreatePostForm: React.FC<CreatePostFormProps> = ({ accessToken, onSubmitSuccess }) => {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [imgUrl, setImgUrl] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const trimmed = title.trim();
        if (!trimmed) {
            setError("Title is required");
            return;
        }
        setError(null);
        setSubmitting(true);
        try {
            const post = await createPost(accessToken, {
                title: trimmed,
                content: content.trim() || undefined,
                imgUrl: imgUrl.trim() || undefined,
            });
            setTitle("");
            setContent("");
            setImgUrl("");
            onSubmitSuccess(post);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create post");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            style={{
                fontFamily: font,
                background: "rgba(30,41,59,0.6)",
                borderRadius: 16,
                border: "1px solid rgba(148,163,184,0.2)",
                padding: 20,
                marginBottom: 24,
            }}
        >
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: "#e5e7eb" }}>
                Create a post
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <label style={{ fontSize: 14, color: "#94a3b8" }}>
                    Title
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="What's on your mind?"
                        maxLength={200}
                        style={{
                            marginTop: 6,
                            width: "100%",
                            padding: "12px 14px",
                            borderRadius: 10,
                            border: "1px solid rgba(148,163,184,0.4)",
                            background: "#0f172a",
                            color: "#e5e7eb",
                            fontSize: 15,
                            outline: "none",
                            boxSizing: "border-box",
                        }}
                    />
                </label>
                <label style={{ fontSize: 14, color: "#94a3b8" }}>
                    Content (optional)
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Add more details..."
                        rows={3}
                        style={{
                            marginTop: 6,
                            width: "100%",
                            padding: "12px 14px",
                            borderRadius: 10,
                            border: "1px solid rgba(148,163,184,0.4)",
                            background: "#0f172a",
                            color: "#e5e7eb",
                            fontSize: 15,
                            outline: "none",
                            resize: "vertical",
                            boxSizing: "border-box",
                        }}
                    />
                </label>
                <label style={{ fontSize: 14, color: "#94a3b8" }}>
                    Image URL (optional)
                    <input
                        type="url"
                        value={imgUrl}
                        onChange={(e) => setImgUrl(e.target.value)}
                        placeholder="https://..."
                        style={{
                            marginTop: 6,
                            width: "100%",
                            padding: "12px 14px",
                            borderRadius: 10,
                            border: "1px solid rgba(148,163,184,0.4)",
                            background: "#0f172a",
                            color: "#e5e7eb",
                            fontSize: 15,
                            outline: "none",
                            boxSizing: "border-box",
                        }}
                    />
                </label>
                {error && (
                    <div
                        style={{
                            fontSize: 13,
                            color: "#fecaca",
                            background: "rgba(127,29,29,0.2)",
                            borderRadius: 8,
                            padding: "8px 12px",
                        }}
                    >
                        {error}
                    </div>
                )}
                <button
                    type="submit"
                    disabled={submitting}
                    style={{
                        padding: "12px 24px",
                        borderRadius: 9999,
                        border: "none",
                        background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
                        color: "white",
                        fontWeight: 600,
                        fontSize: 15,
                        cursor: submitting ? "wait" : "pointer",
                        opacity: submitting ? 0.8 : 1,
                        alignSelf: "flex-start",
                    }}
                >
                    {submitting ? "Posting..." : "Post"}
                </button>
            </div>
        </form>
    );
};

export default CreatePostForm;
