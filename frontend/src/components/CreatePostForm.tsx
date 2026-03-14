import React, { FormEvent, useRef, useState } from "react";
import { createPost, uploadFile, type Post } from "../api";

const font = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

type CreatePostFormProps = {
    accessToken: string;
    onSubmitSuccess: (post: Post) => void;
};

const CreatePostForm: React.FC<CreatePostFormProps> = ({ accessToken, onSubmitSuccess }) => {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setImageFile(file);
        if (file) {
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            setPreviewUrl(null);
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

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
            let imgUrl: string | undefined;
            if (imageFile) {
                imgUrl = await uploadFile(imageFile, accessToken);
            }
            const post = await createPost(accessToken, {
                title: trimmed,
                content: content.trim() || undefined,
                imgUrl,
            });
            setTitle("");
            setContent("");
            setImageFile(null);
            setPreviewUrl(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
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

                {/* Image picker */}
                <label style={{ fontSize: 14, color: "#94a3b8" }}>
                    Image (optional)
                    <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 10 }}>
                        <label
                            htmlFor="post-image-input"
                            style={{
                                padding: "8px 16px",
                                borderRadius: 8,
                                border: "1px solid rgba(148,163,184,0.4)",
                                background: "#0f172a",
                                color: "#94a3b8",
                                fontSize: 13,
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {imageFile ? "Change image" : "Choose image"}
                        </label>
                        <input
                            id="post-image-input"
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ display: "none" }}
                        />
                        {imageFile && (
                            <span style={{ fontSize: 12, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {imageFile.name}
                            </span>
                        )}
                    </div>
                </label>

                {/* Local preview */}
                {previewUrl && (
                    <div style={{ position: "relative", width: "100%", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(148,163,184,0.2)" }}>
                        <img
                            src={previewUrl}
                            alt="Preview"
                            style={{ width: "100%", maxHeight: 240, objectFit: "cover", display: "block" }}
                        />
                        <button
                            type="button"
                            onClick={handleRemoveImage}
                            style={{
                                position: "absolute",
                                top: 8,
                                right: 8,
                                background: "rgba(0,0,0,0.6)",
                                border: "none",
                                borderRadius: "50%",
                                width: 28,
                                height: 28,
                                color: "white",
                                fontSize: 16,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                lineHeight: 1,
                            }}
                            aria-label="Remove image"
                        >
                            ×
                        </button>
                    </div>
                )}

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
