import api from "../../lib/api";

export async function fetchApplications({ page, limit, search, status, jobId }) {
  const params = { page, limit };
  if (search) params.search = search;
  if (status) params.status = status;
  if (jobId) params.jobId = jobId;

  const response = await api.get("/applications", { params });
  return {
    applications: response.data?.data?.applications || [],
    meta: response.data?.meta
  };
}

export async function createApplication(payload) {
  const formData = new FormData();
  formData.append("jobId", payload.jobId);
  formData.append("candidateName", payload.candidateName);
  formData.append("candidateEmail", payload.candidateEmail);
  if (payload.phone) formData.append("phone", payload.phone);
  if (payload.coverLetter) formData.append("coverLetter", payload.coverLetter);
  if (payload.resumeUrl) formData.append("resumeUrl", payload.resumeUrl);
  if (payload.resumeFile) formData.append("resume", payload.resumeFile);

  const response = await api.post("/applications", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data?.data?.application;
}

export async function submitPublicApplication(payload) {
  const formData = new FormData();
  formData.append("jobId", payload.jobId);
  formData.append("candidateName", payload.candidateName);
  formData.append("candidateEmail", payload.candidateEmail);
  if (payload.phone) formData.append("phone", payload.phone);
  if (payload.coverLetter) formData.append("coverLetter", payload.coverLetter);
  if (payload.resumeFile) formData.append("resume", payload.resumeFile);

  const response = await api.post("/applications/public", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data?.data?.application;
}

export async function fetchApplicationById(id) {
  const response = await api.get(`/applications/${id}`);
  return response.data?.data?.application;
}

export async function updateApplicationStatus({ id, status }) {
  const response = await api.patch(`/applications/${id}/status`, { status });
  return response.data?.data?.application;
}

export async function addApplicationNote({ id, note }) {
  const response = await api.patch(`/applications/${id}/notes`, { note });
  return response.data?.data?.application;
}

export async function rerunApplicationScreening(id) {
  const response = await api.patch(`/applications/${id}/screening/rerun`);
  return response.data?.data?.application;
}

export async function exportApplicationsExcel(params = {}) {
  const response = await api.get("/applications/export/excel", {
    params,
    responseType: "blob"
  });
  return response.data;
}
