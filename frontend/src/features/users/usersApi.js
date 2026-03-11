import api from "../../lib/api";

export async function fetchUsers({ page, limit, search, role }) {
  const params = { page, limit };
  if (search) params.search = search;
  if (role) params.role = role;
  const response = await api.get("/users", { params });
  return {
    users: response.data?.data?.users || [],
    meta: response.data?.meta
  };
}

export async function createUser(payload) {
  const response = await api.post("/users", payload);
  return response.data?.data?.user;
}

export async function updateUser({ id, payload }) {
  const response = await api.patch(`/users/${id}`, payload);
  return response.data?.data?.user;
}

export async function deleteUser(id) {
  await api.delete(`/users/${id}`);
}
