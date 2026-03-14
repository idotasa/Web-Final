import React from "react";
import CreatePostForm from "./CreatePostForm";
import { type Post } from "../api";

const font = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

type CreatePostModalProps = {
    isOpen: boolean;
    onClose: () => void;
    accessToken: string;
    onSubmitSuccess: (post: Post) => void;
};

const CreatePostModal: React.FC<CreatePostModalProps> = ({
    isOpen,
    onClose,
    accessToken,
    onSubmitSuccess,
}) => {
    if (!isOpen) return null;

    const handleSuccess = (post: Post) => {
        onSubmitSuccess(post);
        onClose();
    };

    return (
        <>
            <div
                role="presentation"
                onClick={onClose}
                style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.6)",
                    zIndex: 1000,
                    backdropFilter: "blur(4px)",
                }}
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-post-title"
                style={{
                    position: "fixed",
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "100%",
                    maxWidth: 500,
                    maxHeight: "90vh",
                    overflow: "auto",
                    background: "#0f172a",
                    borderRadius: 20,
                    border: "1px solid rgba(148,163,184,0.3)",
                    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
                    zIndex: 1001,
                    fontFamily: font,
                }}
            >
                <div style={{ padding: 20, position: "relative" }}>
                    <h2 id="create-post-title" style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: "#e5e7eb" }}>
                        Create post
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        style={{
                            position: "absolute",
                            top: 20,
                            right: 20,
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            border: "none",
                            background: "rgba(148,163,184,0.2)",
                            color: "#e5e7eb",
                            fontSize: 20,
                            cursor: "pointer",
                            lineHeight: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        ×
                    </button>
                    <CreatePostForm accessToken={accessToken} onSubmitSuccess={handleSuccess} />
                </div>
            </div>
        </>
    );
};

export default CreatePostModal;
