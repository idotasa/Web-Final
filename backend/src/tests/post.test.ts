import { afterAll, afterEach, beforeAll, describe, expect, jest, test } from "@jest/globals";
import request from "supertest";
import { Express } from "express";
import mongoose from "mongoose";
import initApp from "../app";
import Post from "../models/postModel";
import Comment from "../models/commentModel";
import User from "../models/userModel";
import {
  authHeader,
  closeMongooseConnection,
  createAndLoginTestUser,
} from "./testUtils";
import {
  FEED_NOT_FOUND_USER,
  MALFORMED_ID,
  OWNER_POST_DATA,
  POST_FOLLOWER_USER,
  POST_NO_AUTH_TITLE,
  POST_OWNER_USER,
  UNKNOWN_ERROR,
  UNKNOWN_ERROR_MSG,
  UPDATED_POST_TITLE,
} from "./tests_conf";

let app: Express;
let owner: Awaited<ReturnType<typeof createAndLoginTestUser>>;
let follower: Awaited<ReturnType<typeof createAndLoginTestUser>>;

beforeAll(async () => {
  app = await initApp();
  await Promise.all([Post.deleteMany({}), Comment.deleteMany({}), User.deleteMany({})]);

  owner = await createAndLoginTestUser(app, {
    email: POST_OWNER_USER.email,
    username: POST_OWNER_USER.username,
  });

  follower = await createAndLoginTestUser(app, {
    email: POST_FOLLOWER_USER.email,
    username: POST_FOLLOWER_USER.username,
  });

  // follower follows owner so that feed has data
  const followRes = await request(app)
    .put(`/user/${owner._id}/follow`)
    .set(authHeader(follower.accessToken));
  expect(followRes.statusCode).toBe(200);
});

afterAll(async () => {
  await closeMongooseConnection();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("Post API", () => {
  let postId: string;

  test("get all posts on empty DB returns []", async () => {
    const res = await request(app).get("/post");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body) || Array.isArray(res.body.data)).toBe(true);
  });

  test("GET /post with non-numeric page/limit falls back to defaults", async () => {
    const res = await request(app).get("/post?page=abc&limit=xyz");
    expect(res.statusCode).toBe(200);
    expect(res.body).toBeDefined();
  });

  test("GET /post with page & limit returns paginated response", async () => {
    const res = await request(app).get("/post?page=1&limit=5");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("totalPages");
    expect(res.body).toHaveProperty("total");
    expect(res.body).toHaveProperty("page");
  });

  test("create post requires auth", async () => {
    const res = await request(app)
      .post("/post")
      .send({ title: POST_NO_AUTH_TITLE });
    expect(res.statusCode).toBe(401);
  });

  test("create post as owner", async () => {
    const res = await request(app)
      .post("/post")
      .set(authHeader(owner.accessToken))
      .send(OWNER_POST_DATA);
    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe(OWNER_POST_DATA.title);
    expect(res.body.owner).toBe(owner._id);
    postId = res.body._id;
  });

  test("get post by id", async () => {
    const res = await request(app).get(`/post/${postId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(postId);
  });

  test("get non-existing post returns 404", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/post/${fakeId}`);
    expect(res.statusCode).toBe(404);
  });

  test("get posts filtered by owner", async () => {
    const res = await request(app).get(`/post?owner=${owner._id}`);
    expect(res.statusCode).toBe(200);
    const list = Array.isArray(res.body) ? res.body : res.body.data;
    expect(list.length).toBeGreaterThanOrEqual(1);
    expect(list[0].owner.toString()).toBe(owner._id);
  });

  test("update post as owner", async () => {
    const res = await request(app)
      .put(`/post/${postId}`)
      .set(authHeader(owner.accessToken))
      .send({ title: UPDATED_POST_TITLE });
    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe(UPDATED_POST_TITLE);
  });

  test("update post as other user is forbidden", async () => {
    const res = await request(app)
      .put(`/post/${postId}`)
      .set(authHeader(follower.accessToken))
      .send({ title: "Hacked title" });
    expect(res.statusCode).toBe(403);
  });

  test("update non-existing post returns 404", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .put(`/post/${fakeId}`)
      .set(authHeader(owner.accessToken))
      .send({ title: UPDATED_POST_TITLE });
    expect(res.statusCode).toBe(404);
  });

  test("like and unlike post", async () => {
    const likeRes = await request(app)
      .put(`/post/${postId}/like`)
      .set(authHeader(follower.accessToken));
    expect(likeRes.statusCode).toBe(200);
    expect(likeRes.body.isLiked).toBe(true);
    expect(typeof likeRes.body.likes).toBe("number");

    const unlikeRes = await request(app)
      .put(`/post/${postId}/like`)
      .set(authHeader(follower.accessToken));
    expect(unlikeRes.statusCode).toBe(200);
    expect(unlikeRes.body.isLiked).toBe(false);
  });

  test("like non-existing post returns 404", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .put(`/post/${fakeId}/like`)
      .set(authHeader(follower.accessToken));
    expect(res.statusCode).toBe(404);
  });

  test("feed returns followed user posts", async () => {
    // Like the post as follower to trigger coverage for isLiked logic
    await request(app)
      .put(`/post/${postId}/like`)
      .set(authHeader(follower.accessToken));

    const res = await request(app)
      .get("/post/feed")
      .set(authHeader(follower.accessToken));
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toBeDefined();
    const ids = res.body.data.map((p: any) => p._id);
    expect(ids).toContain(postId);
    expect(res.body.data[0].isLiked).toBe(true);
  });

  test("delete post as other user is forbidden", async () => {
    const res = await request(app)
      .delete(`/post/${postId}`)
      .set(authHeader(follower.accessToken));
    expect(res.statusCode).toBe(403);
  });

  test("delete post as owner", async () => {
    // add a comment to verify cascade delete
    const commentRes = await request(app)
      .post("/comment")
      .set(authHeader(owner.accessToken))
      .send({ content: "to be removed", postId });
    expect(commentRes.statusCode).toBe(201);

    const res = await request(app)
      .delete(`/post/${postId}`)
      .set(authHeader(owner.accessToken));
    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(postId);

    const getRes = await request(app).get(`/post/${postId}`);
    expect(getRes.statusCode).toBe(404);

    const commentsAfter = await request(app).get(`/comment?postId=${postId}`);
    expect(commentsAfter.statusCode).toBe(200);
    expect(commentsAfter.body.length).toBe(0);
  });

  test("delete non-existing post returns 404", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .delete(`/post/${fakeId}`)
      .set(authHeader(owner.accessToken));
    expect(res.statusCode).toBe(404);
  });

  test("feed returns 404 when user not found", async () => {
    const tempUser = await createAndLoginTestUser(app, {
      email: FEED_NOT_FOUND_USER.email,
      username: FEED_NOT_FOUND_USER.username,
    });
    await User.deleteMany({ _id: tempUser._id });

    const res = await request(app)
      .get("/post/feed")
      .set(authHeader(tempUser.accessToken));
    expect(res.statusCode).toBe(404);
  });

  test("feed() hasMore=true when posts exceed limit", async () => {
    // create 3 posts as owner
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post("/post")
        .set(authHeader(owner.accessToken))
        .send({ title: `feed post ${i}`, content: "x" });
    }

    const res = await request(app)
      .get("/post/feed?page=1&limit=2")
      .set(authHeader(follower.accessToken));
    expect(res.statusCode).toBe(200);
    expect(res.body.hasMore).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  test("DELETE /post/:id with malformed id returns 500", async () => {
    const res = await request(app)
      .delete("/post/" + MALFORMED_ID)
      .set(authHeader(owner.accessToken));
    expect(res.statusCode).toBe(500);
  });

  test("PUT /post/:id/like with malformed id returns 500", async () => {
    const res = await request(app)
      .put("/post/" + MALFORMED_ID + "/like")
      .set(authHeader(owner.accessToken));
    expect(res.statusCode).toBe(500);
  });

  test("GET /post returns 500 when DB throws", async () => {
    jest.spyOn(Post, "find").mockImplementationOnce(() => {
      throw new Error("any error");
    });
    const res = await request(app).get("/post");
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe(UNKNOWN_ERROR_MSG);
  });

  test("GET /post/feed returns 500 when DB throws", async () => {
    jest.spyOn(User, "findById").mockImplementationOnce(() => {
      throw new Error("any error");
    });
    const res = await request(app)
      .get("/post/feed")
      .set(authHeader(owner.accessToken));
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe(UNKNOWN_ERROR_MSG);
  });

  test("GET /post returns 500 with unknown error object", async () => {
    jest.spyOn(Post, "find").mockImplementationOnce(() => {
      throw UNKNOWN_ERROR;
    });
    const res = await request(app).get("/post");
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe(UNKNOWN_ERROR_MSG);
  });

  test("GET /post/feed returns 500 with unknown error object", async () => {
    jest.spyOn(User, "findById").mockImplementationOnce(() => {
      throw UNKNOWN_ERROR;
    });
    const res = await request(app)
      .get("/post/feed")
      .set(authHeader(owner.accessToken));
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe(UNKNOWN_ERROR_MSG);
  });
});

