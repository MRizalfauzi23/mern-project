import api from "../../lib/api";

type FetchJobsParams = {
  page: number;
  limit: number;
  search?: string;
  status?: string;
};

export async function fetchJobs({ page, limit, search, status }: FetchJobsParams) {
  const params: Record<string, any> = { page, limit };
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

export async function fetchJobById(id: string) {
  const response = await api.get(`/jobs/${id}`);
  return response.data?.data?.job;
}

export async function createJob(payload: any) {
  const response = await api.post("/jobs", payload);
  return response.data?.data?.job;
}

export async function updateJob({ id, payload }: { id: string; payload: any }) {
  const response = await api.patch(`/jobs/${id}`, payload);
  return response.data?.data?.job;
}

export async function deleteJob(id: string) {
  await api.delete(`/jobs/${id}`);
}
