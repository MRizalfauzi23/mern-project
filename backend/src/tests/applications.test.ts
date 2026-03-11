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

async function loginRecruiter(email = "apply-recruiter@example.com") {
  await request(app).post("/api/v1/auth/register").send({
    name: "Recruiter",
    email,
    password: "password123",
    role: "recruiter"
  });

  const loginRes = await request(app).post("/api/v1/auth/login").send({
    email,
    password: "password123"
  });
  return loginRes.body.data.accessToken;
}

describe("Applications endpoints", () => {
  it("creates, lists and updates application status", async () => {
    const token = await loginRecruiter();

    const jobRes = await request(app)
      .post("/api/v1/jobs")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Backend Engineer",
        company: "Acme",
        location: "Bandung",
        description: "Build robust APIs and services",
        status: "open"
      });
    const jobId = jobRes.body.data.job._id;

    const createRes = await request(app)
      .post("/api/v1/applications")
      .set("Authorization", `Bearer ${token}`)
      .send({
        jobId,
        candidateName: "Budi",
        candidateEmail: "budi@example.com",
        phone: "0812345678",
        coverLetter: "Saya tertarik dengan posisi ini."
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.data.application.candidateName).toBe("Budi");
    expect(Array.isArray(createRes.body.data.application.screeningBreakdown)).toBe(true);
    expect(typeof createRes.body.data.application.screeningScore).toBe("number");

    const listRes = await request(app)
      .get("/api/v1/applications?page=1&limit=10&search=budi")
      .set("Authorization", `Bearer ${token}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.applications.length).toBe(1);

    const applicationId = listRes.body.data.applications[0]._id;
    const detailRes = await request(app)
      .get(`/api/v1/applications/${applicationId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data.application._id).toBe(applicationId);

    const updateRes = await request(app)
      .patch(`/api/v1/applications/${applicationId}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "interview" });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.application.status).toBe("interview");

    const noteRes = await request(app)
      .patch(`/api/v1/applications/${applicationId}/notes`)
      .set("Authorization", `Bearer ${token}`)
      .send({ note: "Kandidat cocok untuk tahap interview teknis." });
    expect(noteRes.status).toBe(200);
    expect(noteRes.body.data.application.recruiterNotes.length).toBe(1);

    const rerunRes = await request(app)
      .patch(`/api/v1/applications/${applicationId}/screening/rerun`)
      .set("Authorization", `Bearer ${token}`);
    expect(rerunRes.status).toBe(200);
    expect(typeof rerunRes.body.data.application.screeningScore).toBe("number");

    const exportRes = await request(app)
      .get("/api/v1/applications/export/excel")
      .set("Authorization", `Bearer ${token}`);
    expect(exportRes.status).toBe(200);
    expect(exportRes.header["content-type"]).toContain(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
  });

  it("blocks recruiter from accessing other recruiter's applications", async () => {
    const ownerToken = await loginRecruiter("owner@example.com");
    const otherToken = await loginRecruiter("other@example.com");

    const jobRes = await request(app)
      .post("/api/v1/jobs")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        title: "Frontend Engineer",
        company: "Beta",
        location: "Jakarta",
        description: "Develop responsive user interfaces",
        status: "open"
      });
    const jobId = jobRes.body.data.job._id;

    await request(app)
      .post("/api/v1/applications")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        jobId,
        candidateName: "Sinta",
        candidateEmail: "sinta@example.com"
      });

    const listRes = await request(app)
      .get("/api/v1/applications?page=1&limit=10")
      .set("Authorization", `Bearer ${otherToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.applications.length).toBe(0);
  });
});
