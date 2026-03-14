import { afterAll, afterEach, beforeAll, describe, expect, jest, test } from "@jest/globals";
import request from "supertest";
import { Express } from "express";
import initApp from "../app";
import User from "../models/userModel";
import { authHeader, closeMongooseConnection, createAndLoginTestUser } from "./testUtils";
import {
  AUTH_USER,
  DB_CREATE_FAILURE_MSG,
  DB_LOGOUT_FAILURE_MSG,
  DB_REFRESH_FAILURE_MSG,
  GHOST_REFRESH_USER,
  GHOST_USER,
  INVALID_REFRESH_TOKEN,
  MALFORMED_TOKEN,
  MISSING_EMAIL,
  NOT_REGISTERED_EMAIL,
  REGISTRATION_ERROR_USER,
  REGISTRATION_IMG_URL_CASE,
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

afterEach(() => {
  jest.restoreAllMocks();
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
      email: NOT_REGISTERED_EMAIL,
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
      .set("Authorization", "Bearer " + INVALID_REFRESH_TOKEN);
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
      .set("Authorization", "Bearer " + INVALID_REFRESH_TOKEN);
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

  test("register with imgUrl stores provided imgUrl", async () => {
    const res = await request(app).post("/auth/register").send({
      email: REGISTRATION_IMG_URL_CASE.email,
      password: TEST_PASSWORD,
      username: REGISTRATION_IMG_URL_CASE.username,
      imgUrl: REGISTRATION_IMG_URL_CASE.imgUrl,
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.imgUrl).toBe(REGISTRATION_IMG_URL_CASE.imgUrl);
  });

  test("logout with token whose user no longer exists returns 401", async () => {
    const ghost = {
      email: GHOST_USER.email,
      password: TEST_PASSWORD,
      username: GHOST_USER.username,
    };
    const reg = await request(app).post("/auth/register").send(ghost);
    const ghostRefresh = reg.body.refreshToken;
    await User.deleteOne({ _id: reg.body._id });

    const res = await request(app)
      .post("/auth/logout")
      .set("Authorization", `Bearer ${ghostRefresh}`);
    expect(res.statusCode).toBe(401);
  });

  test("refresh with token whose user no longer exists returns 401", async () => {
    const ghost = {
      email: GHOST_REFRESH_USER.email,
      password: TEST_PASSWORD,
      username: GHOST_REFRESH_USER.username,
    };
    const reg = await request(app).post("/auth/register").send(ghost);
    const ghostRefresh = reg.body.refreshToken;
    await User.deleteOne({ _id: reg.body._id });

    const res = await request(app)
      .post("/auth/refresh")
      .set("Authorization", `Bearer ${ghostRefresh}`);
    expect(res.statusCode).toBe(401);
  });

  test("logout returns 401 on verify error (malformed token)", async () => {
    const res = await request(app)
      .post("/auth/logout")
      .set("Authorization", "Bearer " + MALFORMED_TOKEN);
    expect(res.statusCode).toBe(401);
  });

  test("refresh returns 401 on verify error (malformed token)", async () => {
    const res = await request(app)
      .post("/auth/refresh")
      .set("Authorization", "Bearer " + MALFORMED_TOKEN);
    expect(res.statusCode).toBe(401);
  });

  test("POST /auth/register returns 500 when User.create throws", async () => {
    jest.spyOn(User, "findOne").mockResolvedValueOnce(null);
    jest.spyOn(User, "create").mockImplementationOnce(() => {
      throw new Error(DB_CREATE_FAILURE_MSG);
    });
    const res = await request(app).post("/auth/register").send({
      email: REGISTRATION_ERROR_USER.email,
      password: TEST_PASSWORD,
      username: REGISTRATION_ERROR_USER.username,
    });
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe("Registration failed");
  });

  test("POST /auth/login returns 500 when User.findOne throws", async () => {
    jest.spyOn(User, "findOne").mockImplementationOnce(() => {
      throw new Error("DB login error");
    });
    const res = await request(app).post("/auth/login").send(user);
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe("Login failed");
  });

  test("POST /auth/logout returns 401 when User.findById throws", async () => {
    const loginRes = await request(app).post("/auth/login").send(user);
    jest.spyOn(User, "findById").mockImplementationOnce(() => {
      throw new Error(DB_LOGOUT_FAILURE_MSG);
    });
    const res = await request(app)
      .post("/auth/logout")
      .set("Authorization", `Bearer ${loginRes.body.refreshToken}`);
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("Invalid token");
  });

  test("POST /auth/refresh returns 401 when User.findById throws", async () => {
    const loginRes = await request(app).post("/auth/login").send(user);
    jest.spyOn(User, "findById").mockImplementationOnce(() => {
      throw new Error(DB_REFRESH_FAILURE_MSG);
    });
    const res = await request(app)
      .post("/auth/refresh")
      .set("Authorization", `Bearer ${loginRes.body.refreshToken}`);
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("Invalid token");
  });

  test("POST /auth/logout clears tokens when refresh token not in list (reuse detection)", async () => {
    const loginRes = await request(app).post("/auth/login").send(user);
    const rt = loginRes.body.refreshToken;
    // Clear the list to simulate reuse discovery
    await User.findByIdAndUpdate(loginRes.body._id, { $set: { refreshTokens: [] } });

    const res = await request(app)
      .post("/auth/logout")
      .set("Authorization", `Bearer ${rt}`);
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("Invalid token");
  });

  test("createAndLoginTestUser works with default values", async () => {
    // This hits the default parameter branch 'overrides = {}' in testUtils.ts
    await User.deleteMany({ email: "testuser@example.com" });
    const user = await createAndLoginTestUser(app);
    expect(user.email).toBe("testuser@example.com");
    expect(user.accessToken).toBeDefined();
    await User.deleteMany({ email: "testuser@example.com" });
  });

  test("authHeader utility handles no token", () => {
    // This hits the else branch in testUtils.ts authHeader ternary
    expect(authHeader()).toEqual({});
  });

  test("authHeader returns empty object when no token provided", () => {
    const header = authHeader();
    expect(header).toEqual({});
});
});
