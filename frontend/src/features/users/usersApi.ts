import api from "../../lib/api";

type FetchUsersParams = {
  page: number;
  limit: number;
  search?: string;
  role?: string;
};

export async function fetchUsers({ page, limit, search, role }: FetchUsersParams) {
  const params: Record<string, any> = { page, limit };
  if (search) params.search = search;
  if (role) params.role = role;
  const response = await api.get("/users", { params });
  return {
    users: response.data?.data?.users || [],
    meta: response.data?.meta
  };
}

export async function createUser(payload: any) {
  const response = await api.post("/users", payload);
  return response.data?.data?.user;
}

export async function updateUser({ id, payload }: { id: string; payload: any }) {
  const response = await api.patch(`/users/${id}`, payload);
  return response.data?.data?.user;
}

export async function deleteUser(id: string) {
  await api.delete(`/users/${id}`);
}
