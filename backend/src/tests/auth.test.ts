import request from "supertest";
import { clearTestDB, setupTestDB, teardownTestDB } from "./setup.js";

let app;

beforeAll(async () => {
  process.env.JWT_ACCESS_SECRET = "test-access-secret";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
  const appModule = await import("../app.js");
  app = appModule.app;
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await clearTestDB();
});

describe("Auth endpoints", () => {
  it("registers, logs in, and returns current user", async () => {
    const registerRes = await request(app).post("/api/v1/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      role: "recruiter"
    });

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.success).toBe(true);

    const loginRes = await request(app).post("/api/v1/auth/login").send({
      email: "test@example.com",
      password: "password123"
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.accessToken).toBeTruthy();

    const meRes = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${loginRes.body.data.accessToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.email).toBe("test@example.com");
  });

  it("revokes refresh token on logout", async () => {
    await request(app).post("/api/v1/auth/register").send({
      name: "Test User",
      email: "logout@example.com",
      password: "password123",
      role: "recruiter"
    });

    const loginRes = await request(app).post("/api/v1/auth/login").send({
      email: "logout@example.com",
      password: "password123"
    });

    const accessToken = loginRes.body.data.accessToken;
    const cookie = loginRes.headers["set-cookie"];
    expect(cookie).toBeTruthy();

    const logoutRes = await request(app)
      .post("/api/v1/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(logoutRes.status).toBe(200);

    const refreshRes = await request(app).post("/api/v1/auth/refresh").set("Cookie", cookie);
    expect(refreshRes.status).toBe(401);
  });
});
