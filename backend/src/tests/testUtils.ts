import { expect } from "@jest/globals";
import { Express } from "express";
import request from "supertest";
import mongoose from "mongoose";
import User from "../models/userModel";
import Post, { IPost } from "../models/postModel";
import Comment, { IComment } from "../models/commentModel";

export const clearDatabase = async () => {
  await Promise.all([
    User.deleteMany({}),
    Post.deleteMany({}),
    Comment.deleteMany({}),
  ]);
};

export interface TestUser {
  _id?: string;
  email: string;
  password: string;
  username: string;
  accessToken?: string;
  refreshToken?: string;
}

export const createAndLoginTestUser = async (
  app: Express,
  overrides: Partial<TestUser> = {}
): Promise<TestUser> => {
  const baseUser: TestUser = {
    email: "testuser@example.com",
    password: "1234567890",
    username: "testuser",
    ...overrides,
  };

  await User.deleteMany({ email: baseUser.email });

  const registerRes = await request(app).post("/auth/register").send({
    email: baseUser.email,
    password: baseUser.password,
    username: baseUser.username,
  });

  expect(registerRes.statusCode).toBe(201);

  const loginRes = await request(app).post("/auth/login").send({
    email: baseUser.email,
    password: baseUser.password,
  });

  expect(loginRes.statusCode).toBe(200);
  expect(loginRes.body.accessToken).toBeDefined();
  expect(loginRes.body.refreshToken).toBeDefined();

  return {
    ...baseUser,
    _id: loginRes.body._id,
    accessToken: loginRes.body.accessToken,
    refreshToken: loginRes.body.refreshToken,
  };
};

export const authHeader = (token?: string) =>
  token ? { Authorization: `Bearer ${token}` } : {};

export const closeMongooseConnection = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
};

