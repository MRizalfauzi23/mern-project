import api from "../../lib/api";

export async function login(payload) {
  const response = await api.post("/auth/login", payload);
  return response.data?.data;
}

export async function getMe() {
  const response = await api.get("/auth/me");
  return response.data?.data?.user;
}

export async function logout() {
  await api.post("/auth/logout");
}
