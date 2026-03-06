import { Request, Response } from "express";
import User from "../models/userModel";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const generateTokens = async (userId: string) => {
    const accessToken = jwt.sign(
        { _id: userId },
        process.env.JWT_SECRET as string,
        { expiresIn: process.env.JWT_EXPIRATION || "1h" } as jwt.SignOptions
    );
    const refreshToken = jwt.sign(
        { _id: userId, nonce: Math.random().toString(36) },
        process.env.JWT_REFRESH_SECRET as string
    );
    return { accessToken, refreshToken };
};

const register = async (req: Request, res: Response) => {
    const { email, password, username, imgUrl } = req.body;
    if (!email || !password || !username) {
        return res.status(400).json({ error: "Email, password, and username are required" });
    }
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: "Email already exists" });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = await User.create({
            email,
            password: hashedPassword,
            username,
            imgUrl: imgUrl || "",
        });
        const tokens = await generateTokens(user._id.toString());
        user.refreshTokens.push(tokens.refreshToken);
        await user.save();
        res.status(201).json({
            _id: user._id,
            email: user.email,
            username: user.username,
            imgUrl: user.imgUrl,
            ...tokens,
        });
    } catch (error) {
        res.status(500).json({ error: "Registration failed" });
    }
};

const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: "Email or password incorrect" });
        }
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: "Email or password incorrect" });
        }
        const tokens = await generateTokens(user._id.toString());
        user.refreshTokens.push(tokens.refreshToken);
        await user.save();
        res.status(200).json({
            _id: user._id,
            email: user.email,
            username: user.username,
            imgUrl: user.imgUrl,
            ...tokens,
        });
    } catch (error) {
        res.status(500).json({ error: "Login failed" });
    }
};

const logout = async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const refreshToken = authHeader && authHeader.split(" ")[1];
    if (!refreshToken) {
        return res.status(401).json({ error: "Refresh token required" });
    }
    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as { _id: string };
        const user = await User.findById(decoded._id);
        if (!user) {
            return res.status(401).json({ error: "Invalid token" });
        }
        if (!user.refreshTokens.includes(refreshToken)) {
            user.refreshTokens = [];
            await user.save();
            return res.status(401).json({ error: "Invalid token" });
        }
        user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
        await user.save();
        res.status(200).json({ message: "Logged out" });
    } catch (error) {
        res.status(401).json({ error: "Invalid token" });
    }
};

const refresh = async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const refreshToken = authHeader && authHeader.split(" ")[1];
    if (!refreshToken) {
        return res.status(401).json({ error: "Refresh token required" });
    }
    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as { _id: string };
        const user = await User.findById(decoded._id);
        if (!user) {
            return res.status(401).json({ error: "Invalid token" });
        }
        if (!user.refreshTokens.includes(refreshToken)) {
            user.refreshTokens = [];
            await user.save();
            return res.status(401).json({ error: "Invalid token" });
        }
        const tokens = await generateTokens(user._id.toString());
        user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
        user.refreshTokens.push(tokens.refreshToken);
        await user.save();
        res.status(200).json(tokens);
    } catch (error) {
        res.status(401).json({ error: "Invalid token" });
    }
};

export default { register, login, logout, refresh };
