import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import request from "supertest";
import { Express } from "express";
import fs from "fs";
import path from "path";
import initApp from "../app";
import { closeMongooseConnection } from "./testUtils";

let app: Express;
const testFilePath = path.join(__dirname, "test-image.png");

beforeAll(async () => {
  app = await initApp();
  // Create a dummy file for testing
  fs.writeFileSync(testFilePath, "test content");
});

afterAll(async () => {
  await closeMongooseConnection();
  if (fs.existsSync(testFilePath)) {
    fs.unlinkSync(testFilePath);
  }
  
  // Clean up uploaded files in public/uploads during test
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    for (const file of files) {
      if (file !== ".gitkeep") {
        fs.unlinkSync(path.join(uploadsDir, file));
      }
    }
  }
});

describe("Upload Middleware / File API", () => {
  test("POST /file - success with valid file", async () => {
    const res = await request(app)
      .post("/file")
      .attach("file", testFilePath);

    expect(res.statusCode).toBe(200);
    expect(res.body.url).toBeDefined();
    expect(res.body.url).toContain("/uploads/");
    
    // Verify file actually exists on disk
    const filename = res.body.url.split("/").pop();
    const uploadedPath = path.join(process.cwd(), "public", "uploads", filename);
    expect(fs.existsSync(uploadedPath)).toBe(true);
  });

  test("POST /file - fails if no file attached", async () => {
    const res = await request(app)
      .post("/file");

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("No file uploaded");
  });

  test("POST /file - fails if field name is wrong", async () => {
    const res = await request(app)
      .post("/file")
      .attach("wrongname", testFilePath);

    // Multer throws error on unexpected field, usually handled by global error handler
    expect(res.statusCode).toBe(500);
  });
});
