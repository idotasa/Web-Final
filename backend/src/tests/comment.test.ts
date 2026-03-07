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
  COMMENT_NO_AUTH_CONTENT,
  COMMENT_OTHER_DELETE_USER,
  COMMENT_OTHER_USER,
  COMMENT_POST_DATA,
  COMMENT_USER,
  FIRST_COMMENT_CONTENT,
  MALFORMED_ID,
  MALFORMED_POST_ID,
  UNKNOWN_ERROR,
  UNKNOWN_ERROR_MSG,
  UPDATED_COMMENT_CONTENT,
} from "./tests_conf";

let app: Express;
let user: Awaited<ReturnType<typeof createAndLoginTestUser>>;
let postId: string;

beforeAll(async () => {
  app = await initApp();
  await Promise.all([Post.deleteMany({}), Comment.deleteMany({}), User.deleteMany({})]);
  user = await createAndLoginTestUser(app, {
    email: COMMENT_USER.email,
    username: COMMENT_USER.username,
  });
  const postRes = await request(app)
    .post("/post")
    .set(authHeader(user.accessToken))
    .send(COMMENT_POST_DATA);
  expect(postRes.statusCode).toBe(201);
  postId = postRes.body._id;
});

afterAll(async () => {
  await closeMongooseConnection();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("Comment API", () => {
  let commentId: string;

  test("get all comments empty", async () => {
    const res = await request(app).get("/comment");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  test("create comment requires auth", async () => {
    const res = await request(app)
      .post("/comment")
      .send({ content: COMMENT_NO_AUTH_CONTENT, postId });
    expect(res.statusCode).toBe(401);
  });

  test("create comment", async () => {
    const res = await request(app)
      .post("/comment")
      .set(authHeader(user.accessToken))
      .send({ content: FIRST_COMMENT_CONTENT, postId });
    expect(res.statusCode).toBe(201);
    expect(res.body.content).toBe(FIRST_COMMENT_CONTENT);
    expect(res.body.owner).toBe(user._id);
    expect(res.body.postId).toBe(postId);
    commentId = res.body._id;
  });

  test("get comments by postId filter", async () => {
    const res = await request(app).get(`/comment?postId=${postId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0]._id).toBe(commentId);
  });

  test("get comments by owner filter", async () => {
    const res = await request(app).get(`/comment?owner=${user._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  test("get comment by id", async () => {
    const res = await request(app).get(`/comment/${commentId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(commentId);
  });

  test("GET /comment returns 500 with unknown error object", async () => {
    jest.spyOn(Comment, "find").mockImplementationOnce(() => {
      throw UNKNOWN_ERROR;
    });
    const res = await request(app).get("/comment");
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe(UNKNOWN_ERROR_MSG);
  });

  test("get non-existing comment returns 404", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/comment/${fakeId}`);
    expect(res.statusCode).toBe(404);
  });

  test("update comment as owner", async () => {
    const res = await request(app)
      .put(`/comment/${commentId}`)
      .set(authHeader(user.accessToken))
      .send({ content: UPDATED_COMMENT_CONTENT });
    expect(res.statusCode).toBe(200);
    expect(res.body.content).toBe(UPDATED_COMMENT_CONTENT);
  });

  test("update comment as another user is forbidden", async () => {
    const other = await createAndLoginTestUser(app, {
      email: COMMENT_OTHER_USER.email,
      username: COMMENT_OTHER_USER.username,
    });
    const res = await request(app)
      .put(`/comment/${commentId}`)
      .set(authHeader(other.accessToken))
      .send({ content: "not allowed" });
    expect(res.statusCode).toBe(403);
  });

  test("update non-existing comment returns 404", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .put(`/comment/${fakeId}`)
      .set(authHeader(user.accessToken))
      .send({ content: UPDATED_COMMENT_CONTENT });
    expect(res.statusCode).toBe(404);
  });

  test("delete comment as another user is forbidden", async () => {
    const other = await createAndLoginTestUser(app, {
      email: COMMENT_OTHER_DELETE_USER.email,
      username: COMMENT_OTHER_DELETE_USER.username,
    });
    const res = await request(app)
      .delete(`/comment/${commentId}`)
      .set(authHeader(other.accessToken));
    expect(res.statusCode).toBe(403);
  });

  test("delete comment as owner", async () => {
    const res = await request(app)
      .delete(`/comment/${commentId}`)
      .set(authHeader(user.accessToken));
    expect(res.statusCode).toBe(200);

    const getRes = await request(app).get(`/comment/${commentId}`);
    expect(getRes.statusCode).toBe(404);
  });

  test("delete non-existing comment returns 404", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .delete(`/comment/${fakeId}`)
      .set(authHeader(user.accessToken));
    expect(res.statusCode).toBe(404);
  });

  test("GET /comment/:id with malformed id returns 500", async () => {
    const res = await request(app).get("/comment/" + MALFORMED_ID);
    expect(res.statusCode).toBe(500);
  });

  test("PUT /comment/:id with malformed id returns 500", async () => {
    const res = await request(app)
      .put("/comment/" + MALFORMED_ID)
      .set(authHeader(user.accessToken))
      .send({ content: "fail" });
    expect(res.statusCode).toBe(500);
  });

  test("DELETE /comment/:id with malformed id returns 500", async () => {
    const res = await request(app)
      .delete("/comment/" + MALFORMED_ID)
      .set(authHeader(user.accessToken));
    expect(res.statusCode).toBe(500);
  });

  test("POST /comment with malformed postId target returns 500", async () => {
    const res = await request(app)
      .post("/comment")
      .set(authHeader(user.accessToken))
      .send({ content: "fail", postId: MALFORMED_POST_ID });
    expect(res.statusCode).toBe(500);
  });
});

