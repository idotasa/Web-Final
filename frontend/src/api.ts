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

export async function googleLoginRequest(idToken: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/google`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message = (data && data.error) || "Google login failed";
        throw new Error(message);
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
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, username, imgUrl }),
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message = (data && data.error) || "Registration failed";
        throw new Error(message);
    }

    return (await res.json()) as AuthResponse;
}

export async function loginRequest(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message = (data && data.error) || "Login failed";
        throw new Error(message);
    }

    return (await res.json()) as AuthResponse;
}

export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${refreshToken}`,
        },
    });

    if (!res.ok) {
        throw new Error("Refresh token invalid");
    }

    return (await res.json()) as AuthTokens;
}

export async function logoutRequest(refreshToken: string): Promise<void> {
    await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${refreshToken}`,
        },
    });
}

