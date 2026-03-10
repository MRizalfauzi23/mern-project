import api from "../../lib/api";

export async function fetchJobs({ page, limit, search, status }) {
  const params = { page, limit };
  if (search) params.search = search;
  if (status) params.status = status;

  const response = await api.get("/jobs", {
    params
  });
  return {
    jobs: response.data?.data?.jobs || [],
    meta: response.data?.meta
  };
}

export async function fetchJobById(id) {
  const response = await api.get(`/jobs/${id}`);
  return response.data?.data?.job;
}

export async function createJob(payload) {
  const response = await api.post("/jobs", payload);
  return response.data?.data?.job;
}

export async function updateJob({ id, payload }) {
  const response = await api.patch(`/jobs/${id}`, payload);
  return response.data?.data?.job;
}

export async function deleteJob(id) {
  await api.delete(`/jobs/${id}`);
}
