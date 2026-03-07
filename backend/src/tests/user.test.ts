import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import request from "supertest";
import { Express } from "express";
import mongoose from "mongoose";
import initApp from "../app";
import User from "../models/userModel";
import Post from "../models/postModel";
import {
  authHeader,
  closeMongooseConnection,
  createAndLoginTestUser,
} from "./testUtils";
import {
  UPDATED_USER_A,
  USER_A_CONF,
  USER_B_CONF,
  USER_B_POST_DATA,
} from "./tests_conf";

let app: Express;
let userA: Awaited<ReturnType<typeof createAndLoginTestUser>>;
let userB: Awaited<ReturnType<typeof createAndLoginTestUser>>;

beforeAll(async () => {
  app = await initApp();
  await Promise.all([User.deleteMany({}), Post.deleteMany({})]);

  userA = await createAndLoginTestUser(app, {
    email: USER_A_CONF.email,
    username: USER_A_CONF.username,
  });

  userB = await createAndLoginTestUser(app, {
    email: USER_B_CONF.email,
    username: USER_B_CONF.username,
  });
});

afterAll(async () => {
  await closeMongooseConnection();
});

describe("User API", () => {
  test("search requires query param q", async () => {
    const res = await request(app).get("/user/search");
    expect(res.statusCode).toBe(400);
  });

  test("search by username", async () => {
    const res = await request(app).get("/user/search?q=user_");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  test("get user by id", async () => {
    const res = await request(app).get(`/user/${userA._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(userA._id);
    expect(res.body.password).toBeUndefined();
    expect(res.body.refreshTokens).toBeUndefined();
  });

  test("get non-existing user returns 404", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/user/${fakeId}`);
    expect(res.statusCode).toBe(404);
  });

  test("update profile requires auth", async () => {
    const res = await request(app)
      .put(`/user/${userA._id}`)
      .send({ username: "noauth" });
    expect(res.statusCode).toBe(401);
  });

  test("cannot update another user profile", async () => {
    const res = await request(app)
      .put(`/user/${userA._id}`)
      .set(authHeader(userB.accessToken))
      .send({ username: "hacked" });
    expect(res.statusCode).toBe(403);
  });

  test("update own profile", async () => {
    const res = await request(app)
      .put(`/user/${userA._id}`)
      .set(authHeader(userA.accessToken))
      .send(UPDATED_USER_A);
    expect(res.statusCode).toBe(200);
    expect(res.body.username).toBe(UPDATED_USER_A.username);
    expect(res.body.imgUrl).toBe(UPDATED_USER_A.imgUrl);
  });

  test("follow/unfollow flow", async () => {
    // cannot follow yourself
    const selfFollowRes = await request(app)
      .put(`/user/${userA._id}/follow`)
      .set(authHeader(userA.accessToken));
    expect(selfFollowRes.statusCode).toBe(400);

    // userA follows userB
    const followRes = await request(app)
      .put(`/user/${userB._id}/follow`)
      .set(authHeader(userA.accessToken));
    expect(followRes.statusCode).toBe(200);
    expect(followRes.body.isFollowing).toBe(true);
    expect(typeof followRes.body.followersCount).toBe("number");

    // followers list contains userA
    const followersRes = await request(app).get(
      `/user/${userB._id}/followers`
    );
    expect(followersRes.statusCode).toBe(200);
    const followerIds = followersRes.body.map((u: any) => u._id);
    expect(followerIds).toContain(userA._id);

    // following list of userA contains userB
    const followingRes = await request(app).get(
      `/user/${userA._id}/following`
    );
    expect(followingRes.statusCode).toBe(200);
    const followingIds = followingRes.body.map((u: any) => u._id);
    expect(followingIds).toContain(userB._id);

    // userA unfollows userB
    const unfollowRes = await request(app)
      .put(`/user/${userB._id}/follow`)
      .set(authHeader(userA.accessToken));
    expect(unfollowRes.statusCode).toBe(200);
    expect(unfollowRes.body.isFollowing).toBe(false);
  });

  test("follow non-existing user returns 404", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .put(`/user/${fakeId}/follow`)
      .set(authHeader(userA.accessToken));
    expect(res.statusCode).toBe(404);
  });

  test("followers for non-existing user returns 404", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/user/${fakeId}/followers`);
    expect(res.statusCode).toBe(404);
  });

  test("following for non-existing user returns 404", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/user/${fakeId}/following`);
    expect(res.statusCode).toBe(404);
  });

  test("delete user requires auth and self", async () => {
    const unauthRes = await request(app).delete(`/user/${userA._id}`);
    expect(unauthRes.statusCode).toBe(401);

    const otherRes = await request(app)
      .delete(`/user/${userA._id}`)
      .set(authHeader(userB.accessToken));
    expect(otherRes.statusCode).toBe(403);
  });

  test("delete own user and cascade", async () => {
    // create a post for userB
    const postRes = await request(app)
      .post("/post")
      .set(authHeader(userB.accessToken))
      .send(USER_B_POST_DATA);
    expect(postRes.statusCode).toBe(201);

    const deleteRes = await request(app)
      .delete(`/user/${userB._id}`)
      .set(authHeader(userB.accessToken));
    expect(deleteRes.statusCode).toBe(200);

    const getUserRes = await request(app).get(`/user/${userB._id}`);
    expect(getUserRes.statusCode).toBe(404);
  });
});

