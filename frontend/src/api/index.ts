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

export type Post = {
    _id: string;
    title: string;
    content?: string;
    imgUrl?: string;
    owner: { _id: string; username: string; imgUrl: string } | string;
    createdAt: string;
    updatedAt: string;
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
