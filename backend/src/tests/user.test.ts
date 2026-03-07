import { afterAll, afterEach, beforeAll, describe, expect, jest, test } from "@jest/globals";
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
  signToken,
} from "./testUtils";
import {
  MALFORMED_ID,
  SEARCH_QUERY,
  UPDATE_USERNAME_HACKED,
  UPDATE_USERNAME_NOAUTH,
  UPDATED_USER_A,
  UNKNOWN_ERROR,
  UNKNOWN_ERROR_MSG,
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

afterEach(() => {
  jest.restoreAllMocks();
});

describe("User API", () => {
  test("search requires query param q", async () => {
    const res = await request(app).get("/user/search");
    expect(res.statusCode).toBe(400);
  });

  test("search requires non-empty query param q", async () => {
    const res = await request(app).get("/user/search?q=");
    expect(res.statusCode).toBe(400);
  });

  test("search by username", async () => {
    const res = await request(app).get("/user/search?q=" + SEARCH_QUERY);
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
      .send({ username: UPDATE_USERNAME_NOAUTH });
    expect(res.statusCode).toBe(401);
  });

  test("cannot update another user profile", async () => {
    const res = await request(app)
      .put(`/user/${userA._id}`)
      .set(authHeader(userB.accessToken))
      .send({ username: UPDATE_USERNAME_HACKED });
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

  test("PUT /user/:id/follow with malformed id returns 500", async () => {
    // This triggers the 500 in toggleFollow's try/catch during findById
    const res = await request(app)
      .put("/user/" + MALFORMED_ID + "/follow")
      .set(authHeader(userA.accessToken));
    expect(res.statusCode).toBe(500);
  });

  test("GET /user/:id/followers with malformed id returns 500", async () => {
    // This triggers the 500 in getRelated's try/catch during findById
    const res = await request(app).get("/user/" + MALFORMED_ID + "/followers");
    expect(res.statusCode).toBe(500);
  });

  test("DELETE /user/:id with malformed id returns 500", async () => {
    // To bypass the if (req.params.id !== req.user!._id) check, 
    // we need a token where user._id matches the malformed id.
    const malformedToken = signToken({ _id: MALFORMED_ID });

    const res = await request(app)
      .delete("/user/" + MALFORMED_ID)
      .set("Authorization", `Bearer ${malformedToken}`);
    expect(res.statusCode).toBe(500);
  });

  test("GET /user/search returns 500 when DB throws", async () => {
    jest.spyOn(User, "find").mockImplementationOnce(() => {
      throw new Error('any error');
    });
    const res = await request(app).get("/user/search?q=anything");
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe(UNKNOWN_ERROR_MSG);
  });

  test("GET /user/search returns 500 with unknown error object", async () => {
    jest.spyOn(User, "find").mockImplementationOnce(() => {
      throw UNKNOWN_ERROR;
    });
    const res = await request(app).get("/user/search?q=test");
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe(UNKNOWN_ERROR_MSG);
  });
});
