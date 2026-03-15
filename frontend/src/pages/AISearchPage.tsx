import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    aiSearch,
    aiParseQuery,
    AIApiError,
    type AISearchResponse,
    type AIParseResponse,
} from "../api";

const font = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

/* ─────────────── Skeleton Loader ─────────────── */
const SkeletonLine: React.FC<{ width?: string }> = ({ width = "100%" }) => (
    <div
        style={{
            height: 14,
            borderRadius: 6,
            background: "linear-gradient(90deg, rgba(148,163,184,0.12) 25%, rgba(148,163,184,0.22) 50%, rgba(148,163,184,0.12) 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s infinite",
            width,
            marginBottom: 10,
        }}
    />
);

const SkeletonBlock: React.FC = () => (
    <div style={{ padding: 24, borderRadius: 16, background: "rgba(30,41,59,0.6)", border: "1px solid rgba(148,163,184,0.2)", marginBottom: 16 }}>
        <SkeletonLine width="70%" />
        <SkeletonLine width="100%" />
        <SkeletonLine width="85%" />
        <SkeletonLine width="60%" />
    </div>
);

/* ─────────────── Source Card ─────────────── */
const SourceCard: React.FC<{ postId: string; snippet: string; index: number; score?: number }> = ({ postId, snippet, index, score }) => (
    <Link
        to={`/post/${postId}`}
        state={{ from: "ai-search" }}
        style={{
            display: "block",
            padding: "14px 18px",
            borderRadius: 12,
            background: "rgba(30,41,59,0.5)",
            border: "1px solid rgba(148,163,184,0.2)",
            textDecoration: "none",
            color: "#e5e7eb",
            transition: "border-color 0.2s, background 0.2s",
            marginBottom: 10,
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(14,165,233,0.5)";
            e.currentTarget.style.background = "rgba(30,41,59,0.8)";
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(148,163,184,0.2)";
            e.currentTarget.style.background = "rgba(30,41,59,0.5)";
        }}
    >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span
                style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
                }}
            >
                {index}
            </span>
            <span style={{ fontSize: 13, color: "#94a3b8", fontFamily: "monospace" }}>
                Post {postId.slice(-6)}
            </span>
            {score !== undefined && (
                <span
                    style={{
                        marginLeft: "auto",
                        fontSize: 12,
                        color: "#10b981",
                        background: "rgba(16,185,129,0.1)",
                        padding: "2px 8px",
                        borderRadius: 12,
                        fontWeight: 600,
                    }}
                >
                    Score: {score.toFixed(3)}
                </span>
            )}
        </div>
        <p style={{ fontSize: 14, color: "#cbd5e1", lineHeight: 1.5, margin: 0 }}>
            {snippet}
        </p>
    </Link>
);

/* ─────────────── Filter Badge ─────────────── */
const Badge: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <span
        style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 12px",
            borderRadius: 9999,
            fontSize: 13,
            fontWeight: 600,
            background: "rgba(14,165,233,0.15)",
            color: "#38bdf8",
            border: "1px solid rgba(14,165,233,0.3)",
        }}
    >
        <span style={{ color: "#94a3b8", fontWeight: 400 }}>{label}:</span> {value}
    </span>
);

/* ─────────────── Main Page ─────────────── */
const AISearchPage: React.FC = () => {
    const { tokens } = useAuth();
    const [query, setQuery] = useState(() => sessionStorage.getItem("aiSearch_query") || "");
    const [scope, setScope] = useState<"all" | "friends">(() => (sessionStorage.getItem("aiSearch_scope") as any) || "all");
    const [loading, setLoading] = useState(false);
    const [searchResult, setSearchResult] = useState<AISearchResponse | null>(() => {
        const saved = sessionStorage.getItem("aiSearch_result");
        return saved ? JSON.parse(saved) : null;
    });
    const [parsedFilters, setParsedFilters] = useState<AIParseResponse | null>(() => {
        const saved = sessionStorage.getItem("aiSearch_filters");
        return saved ? JSON.parse(saved) : null;
    });
    const [error, setError] = useState<string | null>(null);

    // Save to sessionStorage when state changes
    useEffect(() => {
        sessionStorage.setItem("aiSearch_query", query);
    }, [query]);

    useEffect(() => {
        sessionStorage.setItem("aiSearch_scope", scope);
    }, [scope]);

    useEffect(() => {
        if (searchResult) sessionStorage.setItem("aiSearch_result", JSON.stringify(searchResult));
        else sessionStorage.removeItem("aiSearch_result");
    }, [searchResult]);

    useEffect(() => {
        if (parsedFilters) sessionStorage.setItem("aiSearch_filters", JSON.stringify(parsedFilters));
        else sessionStorage.removeItem("aiSearch_filters");
    }, [parsedFilters]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || !tokens?.accessToken) return;
        setLoading(true);
        setError(null);
        setSearchResult(null);
        setParsedFilters(null);

        try {
            // Step 1: Parse the query into structured filters
            const parsed = await aiParseQuery(tokens.accessToken, query.trim());
            setParsedFilters(parsed);

            // Step 2: Run the RAG search
            const effectiveScope = parsed.scope === "friends" ? "friends" : scope;
            const result = await aiSearch(tokens.accessToken, query.trim(), effectiveScope);
            setSearchResult(result);
        } catch (err) {
            if (err instanceof AIApiError) {
                if (err.status === 429) {
                    setError("⏳ Rate limit exceeded. Please wait a moment and try again.");
                } else if (err.status === 503) {
                    setError("🔧 AI service is temporarily unavailable. Please try again later.");
                } else {
                    setError(err.message);
                }
            } else {
                setError(err instanceof Error ? err.message : "Something went wrong.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ fontFamily: font, color: "#e5e7eb", minHeight: "100%" }}>
            {/* Shimmer animation keyframes */}
            <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>

            {/* ── Header ── */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>
                    <span style={{ background: "linear-gradient(135deg, #0ea5e9, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        ✨ AI Smart Search
                    </span>
                </h1>
                <p style={{ fontSize: 15, color: "#94a3b8" }}>
                    Ask anything - our AI searches across all posts to find and summarize the best answers.
                </p>
            </div>

            {/* ── Search Bar ── */}
            <form onSubmit={handleSearch} style={{ marginBottom: 20 }}>
                <div
                    style={{
                        display: "flex",
                        gap: 10,
                        background: "rgba(30,41,59,0.6)",
                        borderRadius: 16,
                        border: "1px solid rgba(148,163,184,0.25)",
                        padding: 6,
                        alignItems: "center",
                    }}
                >
                    <input
                        id="ai-search-input"
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="e.g. Find posts about stock trends from last week..."
                        style={{
                            flex: 1,
                            padding: "12px 16px",
                            border: "none",
                            background: "transparent",
                            color: "#e5e7eb",
                            fontSize: 15,
                            outline: "none",
                            fontFamily: font,
                        }}
                    />
                    <select
                        id="ai-search-scope"
                        value={scope}
                        onChange={(e) => setScope(e.target.value as "all" | "friends")}
                        style={{
                            padding: "8px 12px",
                            borderRadius: 10,
                            border: "1px solid rgba(148,163,184,0.3)",
                            background: "rgba(15,23,42,0.8)",
                            color: "#e5e7eb",
                            fontSize: 13,
                            cursor: "pointer",
                        }}
                    >
                        <option value="all">All posts</option>
                        <option value="friends">Friends only</option>
                    </select>
                    <button
                        id="ai-search-submit"
                        type="submit"
                        disabled={loading || !query.trim()}
                        style={{
                            padding: "10px 22px",
                            borderRadius: 12,
                            border: "none",
                            background: loading || !query.trim()
                                ? "rgba(148,163,184,0.2)"
                                : "linear-gradient(135deg, #0ea5e9, #6366f1)",
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: 14,
                            cursor: loading || !query.trim() ? "not-allowed" : "pointer",
                            whiteSpace: "nowrap",
                            transition: "opacity 0.2s",
                        }}
                    >
                        {loading ? "Thinking..." : "🔍 Search"}
                    </button>
                </div>
            </form>

            {/* ── Error ── */}
            {error && (
                <div
                    style={{
                        marginBottom: 16,
                        padding: "14px 18px",
                        borderRadius: 12,
                        background: error.includes("Rate limit")
                            ? "rgba(234,179,8,0.12)"
                            : error.includes("unavailable")
                              ? "rgba(59,130,246,0.12)"
                              : "rgba(127,29,29,0.2)",
                        color: error.includes("Rate limit")
                            ? "#fde68a"
                            : error.includes("unavailable")
                              ? "#93c5fd"
                              : "#fecaca",
                        fontSize: 14,
                        border: `1px solid ${error.includes("Rate limit") ? "rgba(234,179,8,0.3)" : error.includes("unavailable") ? "rgba(59,130,246,0.3)" : "rgba(127,29,29,0.3)"}`,
                    }}
                >
                    {error}
                </div>
            )}

            {/* ── Loading Skeleton ── */}
            {loading && (
                <div>
                    <SkeletonBlock />
                    <SkeletonBlock />
                </div>
            )}

            {/* ── Parsed Filters ── */}
            {parsedFilters && !loading && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16, alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "#64748b", marginRight: 4 }}>Detected filters:</span>
                    {parsedFilters.category && <Badge label="Category" value={parsedFilters.category} />}
                    {parsedFilters.scope !== "all" && <Badge label="Scope" value={parsedFilters.scope} />}
                    {parsedFilters.dateRange.from && <Badge label="From" value={parsedFilters.dateRange.from.split("T")[0]} />}
                    {parsedFilters.dateRange.to && <Badge label="To" value={parsedFilters.dateRange.to.split("T")[0]} />}
                    {parsedFilters.keywords.length > 0 && (
                        <Badge label="Keywords" value={parsedFilters.keywords.join(", ")} />
                    )}
                </div>
            )}

            {/* ── AI Summary ── */}
            {searchResult && !loading && (
                <div>
                    <div
                        style={{
                            padding: "20px 24px",
                            borderRadius: 16,
                            background: "rgba(30,41,59,0.6)",
                            border: "1px solid rgba(148,163,184,0.2)",
                            marginBottom: 24,
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <span style={{ fontSize: 20 }}>🤖</span>
                            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>AI Summary</h2>
                            {searchResult.requestId && (
                                <span style={{ fontSize: 11, color: "#64748b", marginLeft: "auto", fontFamily: "monospace" }}>
                                    ID: {searchResult.requestId.slice(0, 8)}
                                </span>
                            )}
                        </div>
                        <p
                            style={{
                                fontSize: 15,
                                color: "#cbd5e1",
                                lineHeight: 1.65,
                                margin: 0,
                                whiteSpace: "pre-wrap",
                            }}
                        >
                            {searchResult.answer}
                        </p>
                    </div>

                    {/* ── Sources ── */}
                    {searchResult.sources.length > 0 && (
                        <div>
                            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: "#94a3b8" }}>
                                📄 Sources ({searchResult.sources.length})
                            </h3>
                            {searchResult.sources.map((source, i) => (
                                <SourceCard
                                    key={`${source.postId}-${i}`}
                                    postId={source.postId}
                                    snippet={source.snippet}
                                    index={i + 1}
                                    score={(source as any).score}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Empty state ── */}
            {!loading && !searchResult && !error && (
                <div
                    style={{
                        textAlign: "center",
                        padding: "48px 24px",
                        background: "rgba(30,41,59,0.4)",
                        borderRadius: 16,
                        border: "1px solid rgba(148,163,184,0.15)",
                    }}
                >
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🔎</div>
                    <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Search across all posts with AI</p>
                    <p style={{ fontSize: 14, color: "#94a3b8", maxWidth: 400, margin: "0 auto" }}>
                        Try a natural language query like "What are people saying about crypto?" or "Finance posts from my friends"
                    </p>
                </div>
            )}
        </div>
    );
};

export default AISearchPage;
