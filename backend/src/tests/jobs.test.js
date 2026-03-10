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

async function loginRecruiter() {
  await request(app).post("/api/v1/auth/register").send({
    name: "Recruiter",
    email: "recruiter@example.com",
    password: "password123",
    role: "recruiter"
  });

  const loginRes = await request(app).post("/api/v1/auth/login").send({
    email: "recruiter@example.com",
    password: "password123"
  });
  return loginRes.body.data.accessToken;
}

describe("Jobs endpoints", () => {
  it("creates, lists with filters, and gets detail by id", async () => {
    const token = await loginRecruiter();

    const createRes = await request(app)
      .post("/api/v1/jobs")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Frontend Engineer",
        company: "Acme",
        location: "Remote",
        description: "Build and maintain web applications",
        status: "open",
        screeningConfig: {
          passThreshold: 40,
          reviewThreshold: 20,
          resumeWeight: 10,
          coverLetterWeight: 10,
          phoneWeight: 5,
          emailWeight: 5,
          keywordWeight: 10,
          keywordList: ["react", "frontend", "javascript"]
        }
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.job.title).toBe("Frontend Engineer");
    expect(createRes.body.data.job.screeningConfig.passThreshold).toBe(40);
    const createdId = createRes.body.data.job._id;

    const listRes = await request(app).get("/api/v1/jobs?page=1&limit=5&search=Frontend&status=open");

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.jobs.length).toBe(1);
    expect(listRes.body.meta.page).toBe(1);

    const detailRes = await request(app).get(`/api/v1/jobs/${createdId}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data.job._id).toBe(createdId);
    expect(detailRes.body.data.job.screeningConfig.keywordList.length).toBe(3);
  });
});
