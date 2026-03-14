import { afterAll, beforeAll, describe, expect, jest, test } from "@jest/globals";
import request from "supertest";
import { Express } from "express";
import jwt from "jsonwebtoken";
import initApp from "../app";
import User from "../models/userModel";
import { closeMongooseConnection } from "./testUtils";
import { GOOGLE_EXISTING_USER, GOOGLE_NEW_USER, GOOGLE_NO_EMAIL_USER } from "./tests_conf";

let app: Express;

beforeAll(async () => {
  app = await initApp();
  await User.deleteMany({ email: /@google.local$/ });
  await User.deleteMany({ email: GOOGLE_NEW_USER.email });
});

afterAll(async () => {
  await closeMongooseConnection();
});

describe("Google Auth API", () => {
  test("POST /auth/google - fails if no idToken provided", async () => {
    const res = await request(app).post("/auth/google").send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Google ID token is required");
  });

  test("POST /auth/google - fails if token is invalid (decode returns null)", async () => {
    jest.spyOn(jwt, "decode").mockReturnValueOnce(null);
    const res = await request(app).post("/auth/google").send({ idToken: "invalid" });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Invalid Google token");
  });

  test("POST /auth/google - success for new user", async () => {
    jest.spyOn(jwt, "decode").mockReturnValueOnce(GOOGLE_NEW_USER);

    const res = await request(app).post("/auth/google").send({ idToken: "valid-token" });
    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe(GOOGLE_NEW_USER.email);
    expect(res.body.username).toBe(GOOGLE_NEW_USER.name);
    expect(res.body.imgUrl).toBe(GOOGLE_NEW_USER.picture);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();

    // Verify user created in DB
    const userInDb = await User.findOne({ email: GOOGLE_NEW_USER.email });
    expect(userInDb).toBeDefined();
    expect(userInDb?.username).toBe(GOOGLE_NEW_USER.name);
  });

  test("POST /auth/google - success for existing user", async () => {
    jest.spyOn(jwt, "decode").mockReturnValueOnce(GOOGLE_EXISTING_USER);

    const res = await request(app).post("/auth/google").send({ idToken: "valid-token" });
    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe(GOOGLE_EXISTING_USER.email);
    // Note: The controller doesn't update existing user info currently based on the code provided,
    // it only creates if NOT found. So we expect the ORIGINAL info.
  });

  test("POST /auth/google - success with fallback email (sub@google.local)", async () => {
    jest.spyOn(jwt, "decode").mockReturnValueOnce(GOOGLE_NO_EMAIL_USER);

    const res = await request(app).post("/auth/google").send({ idToken: "valid-token" });
    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe(`${GOOGLE_NO_EMAIL_USER.sub}@google.local`);
    expect(res.body.username).toBe(GOOGLE_NO_EMAIL_USER.name);
  });

  test("googleLogin uses email prefix as username when name is missing", async () => {
    const tokenWithoutName = jwt.sign(
      { email: "noname@example.com", picture: "", sub: "12345" },
      "any-secret"
    );

    const res = await request(app)
      .post("/auth/google")
      .send({ idToken: tokenWithoutName });

    expect(res.statusCode).toBe(200);
    expect(res.body.username).toBe("noname");
  });
});
