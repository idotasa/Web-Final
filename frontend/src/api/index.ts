const API_BASE_URL = "http://localhost:3000";

export type AuthTokens = {
    accessToken: string;
    refreshToken: string;
};

export type AuthUser = {
    _id: string;
    email: string;
    username: string;
    imgUrl: string;
};

export type AuthResponse = AuthUser & AuthTokens;

export type UserProfile = {
    _id: string;
    email: string;
    username: string;
    imgUrl: string;
    followers?: string[];
    following?: string[];
};

export type UserSummary = {
    _id: string;
    username: string;
    imgUrl?: string;
};

export type Post = {
    _id: string;
    title: string;
    content?: string;
    imgUrl?: string;
    owner: { _id: string; username: string; imgUrl: string } | string;
    createdAt: string;
    updatedAt: string;
};

/** Feed item: post with populated owner and counts */
export type FeedPost = Post & {
    likesCount?: number;
    commentsCount?: number;
    isLiked?: boolean;
};

export type FeedResponse = {
    data: FeedPost[];
    page: number;
    hasMore: boolean;
};

export type Comment = {
    _id: string;
    content: string;
    postId: string;
    owner: string | { _id: string; username: string; imgUrl?: string };
    createdAt: string;
};

// Auth
export async function loginRequest(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data && data.error) || "Login failed");
    }
    return (await res.json()) as AuthResponse;
}

export async function registerRequest(
    email: string,
    password: string,
    username: string,
    imgUrl?: string
): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username, imgUrl }),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data && data.error) || "Registration failed");
    }
    return (await res.json()) as AuthResponse;
}

export async function googleLoginRequest(idToken: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data && data.error) || "Google login failed");
    }
    return (await res.json()) as AuthResponse;
}

export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { Authorization: `Bearer ${refreshToken}` },
    });
    if (!res.ok) throw new Error("Refresh token invalid");
    return (await res.json()) as AuthTokens;
}

export async function logoutRequest(refreshToken: string): Promise<void> {
    await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${refreshToken}` },
    });
}

// User profile
export async function getUserProfile(userId: string): Promise<UserProfile> {
    const res = await fetch(`${API_BASE_URL}/user/${userId}`);
    if (!res.ok) throw new Error("Failed to load profile");
    return (await res.json()) as UserProfile;
}

export async function updateUserProfile(
    userId: string,
    data: { username?: string; imgUrl?: string },
    accessToken: string
): Promise<UserProfile> {
    const res = await fetch(`${API_BASE_URL}/user/${userId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to update profile");
    }
    return (await res.json()) as UserProfile;
}

export async function getPostsByOwner(ownerId: string): Promise<Post[]> {
    const params = new URLSearchParams({ owner: ownerId });
    const res = await fetch(`${API_BASE_URL}/post?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to load posts");
    return (await res.json()) as Post[];
}

export async function getFollowing(userId: string): Promise<UserSummary[]> {
    const res = await fetch(`${API_BASE_URL}/user/${userId}/following`);
    if (!res.ok) throw new Error("Failed to load following");
    return (await res.json()) as UserSummary[];
}

export async function getFollowers(userId: string): Promise<UserSummary[]> {
    const res = await fetch(`${API_BASE_URL}/user/${userId}/followers`);
    if (!res.ok) throw new Error("Failed to load followers");
    return (await res.json()) as UserSummary[];
}

export async function toggleFollow(
    accessToken: string,
    userId: string
): Promise<{ isFollowing: boolean; followersCount: number }> {
    const res = await fetch(`${API_BASE_URL}/user/${userId}/follow`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data && data.error) || "Failed to update follow");
    }
    return (await res.json()) as { isFollowing: boolean; followersCount: number };
}

export async function searchUsers(q: string): Promise<UserSummary[]> {
    const res = await fetch(`${API_BASE_URL}/user/search?q=${encodeURIComponent(q)}`);
    if (!res.ok) throw new Error("Search failed");
    return (await res.json()) as UserSummary[];
}

// Feed (auth required)
export async function getFeed(accessToken: string, page = 1, limit = 10): Promise<FeedResponse> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    const res = await fetch(`${API_BASE_URL}/post/feed?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data && data.error) || "Failed to load feed");
    }
    return (await res.json()) as FeedResponse;
}

export async function createPost(
    accessToken: string,
    body: { title: string; content?: string; imgUrl?: string }
): Promise<Post> {
    const res = await fetch(`${API_BASE_URL}/post`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data && data.error) || "Failed to create post");
    }
    return (await res.json()) as Post;
}

export async function likePost(accessToken: string, postId: string): Promise<{ likes: number; isLiked: boolean }> {
    const res = await fetch(`${API_BASE_URL}/post/${postId}/like`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data && data.error) || "Failed to like post");
    }
    return (await res.json()) as { likes: number; isLiked: boolean };
}

export type PostWithLike = Post & { isLiked?: boolean; likes?: string[] };

export async function getPostById(postId: string, accessToken?: string): Promise<PostWithLike> {
    const headers: HeadersInit = {};
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const res = await fetch(`${API_BASE_URL}/post/${postId}`, { headers });
    if (!res.ok) {
        if (res.status === 404) throw new Error("Post not found");
        throw new Error("Failed to load post");
    }
    return (await res.json()) as PostWithLike;
}

export async function updatePost(
    accessToken: string,
    postId: string,
    body: { title?: string; content?: string; imgUrl?: string }
): Promise<Post> {
    const res = await fetch(`${API_BASE_URL}/post/${postId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data && data.error) || "Failed to update post");
    }
    return (await res.json()) as Post;
}

export async function deletePost(accessToken: string, postId: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/post/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data && data.error) || "Failed to delete post");
    }
}

// Comments
export async function getComments(postId: string): Promise<Comment[]> {
    const res = await fetch(`${API_BASE_URL}/comment?postId=${postId}`);
    if (!res.ok) throw new Error("Failed to load comments");
    return (await res.json()) as Comment[];
}

export async function addComment(
    accessToken: string,
    postId: string,
    content: string
): Promise<Comment> {
    const res = await fetch(`${API_BASE_URL}/comment`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ postId, content }),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data && data.error) || "Failed to add comment");
    }
    return (await res.json()) as Comment;
}
