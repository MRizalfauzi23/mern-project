"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ErrorState } from "../components/ErrorState";
import { Loader } from "../components/Loader";
import { Pagination } from "../components/Pagination";
import { SearchBar } from "../components/SearchBar";
import { useToast } from "../components/ToastProvider";
import { useAuth } from "../features/auth/AuthContext";
import { createUser, deleteUser, fetchUsers, updateUser } from "../features/users/usersApi";
import { useDebounce } from "../lib/useDebounce";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "../components/ui/dropdown-menu";
import { FiMoreVertical } from "react-icons/fi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../components/ui/table";

const LIMIT = 8;
const INITIAL_FORM = {
  name: "",
  email: "",
  password: "",
  role: "candidate"
};

export function UsersPage() {
  const queryClient = useQueryClient();
  const { user: currentUser, setSession } = useAuth();
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionError, setActionError] = useState("");
  const debouncedSearch = useDebounce(search);

  const query = useQuery({
    queryKey: ["users", page, debouncedSearch, roleFilter],
    queryFn: () => fetchUsers({ page, limit: LIMIT, search: debouncedSearch, role: roleFilter })
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["users"] });
      showToast("User created successfully");
    },
    onError: (error) => {
      setActionError(error?.response?.data?.message || "Failed to create user");
      showToast("Failed to create user", "error");
    }
  });

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: (updated) => {
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["users"] });
      showToast("User updated successfully");
      if (updated && currentUser?.id === updated._id) {
        const accessToken = localStorage.getItem("accessToken");
        if (accessToken) {
          setSession({ accessToken, user: { ...currentUser, ...updated, id: updated._id } });
        }
      }
    },
    onError: (error) => {
      setActionError(error?.response?.data?.message || "Failed to update user");
      showToast("Failed to update user", "error");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      setActionError("");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      showToast("User deleted successfully");
    },
    onError: (error) => {
      setActionError(error?.response?.data?.message || "Failed to delete user");
      showToast("Failed to delete user", "error");
    }
  });

  const users = query.data?.users || [];
  const meta = query.data?.meta || {};
  const formBusy = createMutation.isPending || updateMutation.isPending;
  const currentPage = meta.page || 1;
  const adminCount = users.filter((item) => item.role === "admin").length;
  const recruiterCount = users.filter((item) => item.role === "recruiter").length;
  const candidateCount = users.filter((item) => item.role === "candidate").length;

  function validateForm(payload) {
    if (!payload.name?.trim()) return "Nama wajib diisi";
    if (!payload.email?.trim()) return "Email wajib diisi";
    if (!editingId && (!payload.password || payload.password.length < 6)) {
      return "Password minimal 6 karakter";
    }
    if (payload.password && payload.password.length < 6) {
      return "Password minimal 6 karakter";
    }
    return null;
  }

  function startEdit(item) {
    setEditingId(item._id);
    setForm({
      name: item.name || "",
      email: item.email || "",
      password: "",
      role: item.role || "candidate"
    });
    setActionError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(INITIAL_FORM);
    setActionError("");
  }

  function openCreateModal() {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setActionError("");
    setIsModalOpen(true);
  }

  function buildPayload() {
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role
    };
    if (form.password) {
      payload.password = form.password;
    }
    return payload;
  }

  return (
    <section className="jobs-page">
      <div className="jobs-toolbar">
        <div>
          <p className="section-kicker">User Management</p>
          <h2>Users</h2>
        </div>
        <Button
          type="button"
          variant="outline"
          className="clean-btn"
          onClick={openCreateModal}
          disabled={formBusy}
        >
          + New User
        </Button>
      </div>

      <div className="jobs-stats">
        <article className="stat-tile">
          <p>Total (page)</p>
          <h3>{users.length}</h3>
        </article>
        <article className="stat-tile">
          <p>Admin</p>
          <h3>{adminCount}</h3>
        </article>
        <article className="stat-tile">
          <p>Recruiter</p>
          <h3>{recruiterCount}</h3>
        </article>
        <article className="stat-tile">
          <p>Candidate</p>
          <h3>{candidateCount}</h3>
        </article>
      </div>

      <Card className="jobs-filters">
        <CardContent>
          <SearchBar
            value={search}
            onChange={(value) => {
              setPage(1);
              setSearch(value);
            }}
          />
          <div className="filter-row">
            <Select
              value={roleFilter || "all"}
              onValueChange={(value) => {
                setPage(1);
                setRoleFilter(value === "all" ? "" : value);
              }}
            >
              <SelectTrigger className="input select-clean">
                <SelectValue placeholder="All role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All role</SelectItem>
                <SelectItem value="admin">admin</SelectItem>
                <SelectItem value="recruiter">recruiter</SelectItem>
                <SelectItem value="candidate">candidate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {query.isLoading && <Loader />}
      {query.isError && <ErrorState message={query.error?.response?.data?.message} />}

      {!query.isLoading && !query.isError && users.length === 0 && (
        <p className="muted">No users found.</p>
      )}

      {!query.isLoading && !query.isError && users.length > 0 && (
        <Card className="table-wrap">
          <Table className="jobs-table">
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((item, index) => {
                const isSelf = currentUser?.id === item._id;
                return (
                  <TableRow key={item._id}>
                    <TableCell>{(currentPage - 1) * LIMIT + index + 1}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.email}</TableCell>
                    <TableCell>{item.role}</TableCell>
                    <TableCell>{new Date(item.createdAt).toLocaleDateString("id-ID")}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="action-ellipsis" type="button">
                          <FiMoreVertical />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => startEdit(item)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            disabled={deleteMutation.isPending || isSelf}
                            onClick={() => deleteMutation.mutate(item._id)}
                          >
                            {deleteMutation.isPending ? "Deleting..." : "Delete"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <Pagination page={meta.page || 1} totalPages={meta.totalPages || 1} onPageChange={setPage} />

      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeModal();
            return;
          }
          setIsModalOpen(true);
        }}
      >
        <DialogContent className="modal-card">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit User" : "Create New User"}</DialogTitle>
          </DialogHeader>
          <form
            className="form-grid job-form-grid"
            onSubmit={(event) => {
              event.preventDefault();
              setActionError("");
              const validationMessage = validateForm(form);
              if (validationMessage) {
                setActionError(validationMessage);
                showToast(validationMessage, "error");
                return;
              }
              const payload = buildPayload();
              if (editingId) {
                updateMutation.mutate({ id: editingId, payload });
                return;
              }
              createMutation.mutate(payload);
            }}
          >
            <div className="field-grid-two">
              <label className="field">
                <span>Nama</span>
                <Input
                  placeholder="Nama lengkap"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>Email</span>
                <Input
                  type="email"
                  placeholder="user@email.com"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                />
              </label>
            </div>
            <div className="field-grid-two">
              <label className="field">
                <span>Role</span>
                <Select
                  value={form.role}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, role: value }))}
                >
                  <SelectTrigger className="input select-clean">
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">admin</SelectItem>
                    <SelectItem value="recruiter">recruiter</SelectItem>
                    <SelectItem value="candidate">candidate</SelectItem>
                  </SelectContent>
                </Select>
              </label>
              <label className="field">
                <span>{editingId ? "Password baru (opsional)" : "Password"}</span>
                <Input
                  type="password"
                  placeholder={editingId ? "Biarkan kosong jika tidak diubah" : "Minimal 6 karakter"}
                  value={form.password}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, password: event.target.value }))
                  }
                />
              </label>
            </div>
            <div className="actions">
              <Button disabled={formBusy} type="submit">
                {formBusy ? "Saving..." : editingId ? "Update User" : "Create User"}
              </Button>
              <Button type="button" variant="secondary" onClick={closeModal}>
                Cancel
              </Button>
            </div>
            {actionError && <ErrorState message={actionError} />}
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
