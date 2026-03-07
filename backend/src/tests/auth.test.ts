import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import request from "supertest";
import { Express } from "express";
import initApp from "../app";
import User from "../models/userModel";
import { closeMongooseConnection } from "./testUtils";
import {
  AUTH_USER,
  MISSING_EMAIL,
  TEST_PASSWORD,
  WRONG_PASSWORD,
} from "./tests_conf";

let app: Express;

const user = {
  email: AUTH_USER.email,
  password: TEST_PASSWORD,
  username: AUTH_USER.username,
};

let accessToken: string;
let refreshToken: string;

beforeAll(async () => {
  app = await initApp();
  await User.deleteMany({ email: user.email });
});

afterAll(async () => {
  await closeMongooseConnection();
});

describe("Auth API", () => {
  test("register new user", async () => {
    const res = await request(app).post("/auth/register").send(user);
    expect(res.statusCode).toBe(201);
    expect(res.body._id).toBeDefined();
    expect(res.body.email).toBe(user.email);
    expect(res.body.username).toBe(user.username);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  test("register with existing email returns 409", async () => {
    const res = await request(app).post("/auth/register").send(user);
    expect(res.statusCode).toBe(409);
    expect(res.body.error).toBeDefined();
  });

  test("register missing username returns 400", async () => {
    const res = await request(app).post("/auth/register").send({
      email: MISSING_EMAIL,
      password: TEST_PASSWORD,
    });
    expect(res.statusCode).toBe(400);
  });

  test("register missing email returns 400", async () => {
    const res = await request(app).post("/auth/register").send({
      password: TEST_PASSWORD,
      username: AUTH_USER.username,
    });
    expect(res.statusCode).toBe(400);
  });

  test("register missing password returns 400", async () => {
    const res = await request(app).post("/auth/register").send({
      email: AUTH_USER.email + ".missingpw",
      username: AUTH_USER.username,
    });
    expect(res.statusCode).toBe(400);
  });

  test("login with correct credentials", async () => {
    const res = await request(app).post("/auth/login").send({
      email: user.email,
      password: user.password,
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  test("login with wrong password returns 401", async () => {
    const res = await request(app).post("/auth/login").send({
      email: user.email,
      password: WRONG_PASSWORD,
    });
    expect(res.statusCode).toBe(401);
  });

  test("login with missing email returns 400", async () => {
    const res = await request(app).post("/auth/login").send({
      password: TEST_PASSWORD,
    });
    expect(res.statusCode).toBe(400);
  });

  test("login with missing password returns 400", async () => {
    const res = await request(app).post("/auth/login").send({
      email: AUTH_USER.email,
    });
    expect(res.statusCode).toBe(400);
  });

  test("login with non-existing email returns 401", async () => {
    const res = await request(app).post("/auth/login").send({
      email: "not_registered@example.com",
      password: TEST_PASSWORD,
    });
    expect(res.statusCode).toBe(401);
  });

  test("access protected route without token returns 401", async () => {
    const res = await request(app).get("/post/feed");
    expect(res.statusCode).toBe(401);
  });

  test("access protected route with invalid token returns 401", async () => {
    const res = await request(app)
      .get("/post/feed")
      .set("Authorization", "Bearer " + accessToken + "x");
    expect(res.statusCode).toBe(401);
  });

  test("logout without refresh token returns 401", async () => {
    const res = await request(app).post("/auth/logout");
    expect(res.statusCode).toBe(401);
  });

  test("logout with invalid refresh token returns 401", async () => {
    const res = await request(app)
      .post("/auth/logout")
      .set("Authorization", "Bearer invalid-refresh-token");
    expect(res.statusCode).toBe(401);
  });

  test("access protected route with valid token", async () => {
    const res = await request(app)
      .get("/post/feed")
      .set("Authorization", "Bearer " + accessToken);
    // Might be 200 with empty feed or 404 if user not found,
    // but should not be 401.
    expect(res.statusCode).not.toBe(401);
  });

  test("refresh token returns new pair and invalidates old", async () => {
    const res = await request(app)
      .post("/auth/refresh")
      .set("Authorization", "Bearer " + refreshToken);

    expect(res.statusCode).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();

    const newAccessToken = res.body.accessToken as string;
    const newRefreshToken = res.body.refreshToken as string;

    // new access token works
    const res2 = await request(app)
      .get("/post/feed")
      .set("Authorization", "Bearer " + newAccessToken);
    expect(res2.statusCode).not.toBe(401);

    // old refresh token cannot be used again
    const res3 = await request(app)
      .post("/auth/refresh")
      .set("Authorization", "Bearer " + refreshToken);
    expect(res3.statusCode).toBe(401);

    // and the newly-issued refresh token should also be invalid
    const res4 = await request(app)
      .post("/auth/refresh")
      .set("Authorization", "Bearer " + newRefreshToken);
    expect(res4.statusCode).toBe(401);
  });

  test("refresh without token returns 401", async () => {
    const res = await request(app).post("/auth/refresh");
    expect(res.statusCode).toBe(401);
  });

  test("refresh with invalid token returns 401", async () => {
    const res = await request(app)
      .post("/auth/refresh")
      .set("Authorization", "Bearer invalid-refresh-token");
    expect(res.statusCode).toBe(401);
  });

  test("logout removes refresh token", async () => {
    // login again to get a fresh refresh token
    const loginRes = await request(app).post("/auth/login").send({
      email: user.email,
      password: user.password,
    });
    expect(loginRes.statusCode).toBe(200);
    const currentRefresh = loginRes.body.refreshToken as string;

    const logoutRes = await request(app)
      .post("/auth/logout")
      .set("Authorization", "Bearer " + currentRefresh);
    expect(logoutRes.statusCode).toBe(200);

    const refreshRes = await request(app)
      .post("/auth/refresh")
      .set("Authorization", "Bearer " + currentRefresh);
    expect(refreshRes.statusCode).toBe(401);
  });
});

