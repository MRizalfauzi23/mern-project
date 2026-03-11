"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { ErrorState } from "../components/ErrorState";
import { Loader } from "../components/Loader";
import { Pagination } from "../components/Pagination";
import { SearchBar } from "../components/SearchBar";
import { useToast } from "../components/ToastProvider";
import { useAuth } from "../features/auth/AuthContext";
import { createJob, deleteJob, fetchJobs, updateJob } from "../features/jobs/jobsApi";
import { useDebounce } from "../lib/useDebounce";
import { Button } from "../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "../components/ui/dropdown-menu";
import { FiMoreVertical } from "react-icons/fi";
import { Card, CardContent } from "../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
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
const DEFAULT_SCREENING_CONFIG = {
  passThreshold: 70,
  reviewThreshold: 40,
  resumeWeight: 25,
  coverLetterWeight: 20,
  phoneWeight: 10,
  emailWeight: 10,
  keywordWeight: 35
};
const INITIAL_FORM = {
  title: "",
  company: "",
  location: "",
  description: "",
  status: "open",
  screeningKeywords: "",
  passThreshold: String(DEFAULT_SCREENING_CONFIG.passThreshold),
  reviewThreshold: String(DEFAULT_SCREENING_CONFIG.reviewThreshold),
  resumeWeight: String(DEFAULT_SCREENING_CONFIG.resumeWeight),
  coverLetterWeight: String(DEFAULT_SCREENING_CONFIG.coverLetterWeight),
  phoneWeight: String(DEFAULT_SCREENING_CONFIG.phoneWeight),
  emailWeight: String(DEFAULT_SCREENING_CONFIG.emailWeight),
  keywordWeight: String(DEFAULT_SCREENING_CONFIG.keywordWeight)
};
const SCREENING_WEIGHT_FIELDS = [
  { key: "resumeWeight", label: "Bobot CV" },
  { key: "coverLetterWeight", label: "Bobot Cover Letter" },
  { key: "phoneWeight", label: "Bobot Telepon" },
  { key: "emailWeight", label: "Bobot Email" },
  { key: "keywordWeight", label: "Bobot Keyword" }
];

export function JobsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionError, setActionError] = useState("");
  const debouncedSearch = useDebounce(search);
  const canManageJobs = user?.role === "admin" || user?.role === "recruiter";

  const query = useQuery({
    queryKey: ["jobs", page, debouncedSearch, status],
    queryFn: () => fetchJobs({ page, limit: LIMIT, search: debouncedSearch, status })
  });

  const createMutation = useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      showToast("Job created successfully");
    },
    onError: (error) => {
      setActionError(error?.response?.data?.message || "Failed to create job");
      showToast("Failed to create job", "error");
    }
  });

  const updateMutation = useMutation({
    mutationFn: updateJob,
    onSuccess: () => {
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      showToast("Job updated successfully");
    },
    onError: (error) => {
      setActionError(error?.response?.data?.message || "Failed to update job");
      showToast("Failed to update job", "error");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteJob,
    onSuccess: () => {
      setActionError("");
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      showToast("Job deleted successfully");
    },
    onError: (error) => {
      setActionError(error?.response?.data?.message || "Failed to delete job");
      showToast("Failed to delete job", "error");
    }
  });

  const jobs = query.data?.jobs || [];
  const meta = query.data?.meta || {};
  const formBusy = createMutation.isPending || updateMutation.isPending;
  const currentPage = meta.page || 1;
  const openCount = jobs.filter((job) => job.status === "open").length;
  const closedCount = jobs.filter((job) => job.status === "closed").length;
  const uniqueCompanies = new Set(jobs.map((job) => job.company)).size;
  const screeningNumericFields = [
    "passThreshold",
    "reviewThreshold",
    "resumeWeight",
    "coverLetterWeight",
    "phoneWeight",
    "emailWeight",
    "keywordWeight"
  ];
  const screeningTotalFields = [
    "passThreshold",
    "reviewThreshold",
    ...SCREENING_WEIGHT_FIELDS.map((entry) => entry.key)
  ];
  const screeningTotal = screeningTotalFields.reduce(
    (sum, key) => sum + Number(form[key] || 0),
    0
  );

  function validateForm(payload) {
    if (!payload.title?.trim()) return "Title wajib diisi";
    if (!payload.company?.trim()) return "Company wajib diisi";
    if (!payload.location?.trim()) return "Location wajib diisi";
    if (!payload.description?.trim()) return "Description wajib diisi";
    if (payload.description.trim().length < 10) return "Description minimal 10 karakter";
    for (const field of screeningNumericFields) {
      const value = Number(payload[field]);
      if (!Number.isFinite(value) || value < 0 || value > 100) {
        return `Nilai ${field} harus di antara 0 sampai 100`;
      }
    }
    if (Number(payload.reviewThreshold) >= Number(payload.passThreshold)) {
      return "Review threshold harus lebih kecil dari pass threshold";
    }
    const total = screeningTotalFields.reduce(
      (sum, key) => sum + Number(payload[key] || 0),
      0
    );
    if (total > 100) {
      return `Total nilai screening tidak boleh lebih dari 100. Saat ini ${total}.`;
    }
    return null;
  }

  function getFormPayload(payload) {
    return {
      title: payload.title,
      company: payload.company,
      location: payload.location,
      description: payload.description,
      status: payload.status,
      screeningConfig: {
        passThreshold: Number(payload.passThreshold),
        reviewThreshold: Number(payload.reviewThreshold),
        resumeWeight: Number(payload.resumeWeight),
        coverLetterWeight: Number(payload.coverLetterWeight),
        phoneWeight: Number(payload.phoneWeight),
        emailWeight: Number(payload.emailWeight),
        keywordWeight: Number(payload.keywordWeight),
        keywordList: payload.screeningKeywords
          .split(",")
          .map((item) => item.trim().toLowerCase())
          .filter(Boolean)
      }
    };
  }

  function startEdit(job) {
    const screeningConfig = job.screeningConfig || DEFAULT_SCREENING_CONFIG;
    setEditingId(job._id);
    setForm({
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      status: job.status,
      screeningKeywords: (screeningConfig.keywordList || []).join(", "),
      passThreshold: String(screeningConfig.passThreshold ?? DEFAULT_SCREENING_CONFIG.passThreshold),
      reviewThreshold: String(screeningConfig.reviewThreshold ?? DEFAULT_SCREENING_CONFIG.reviewThreshold),
      resumeWeight: String(screeningConfig.resumeWeight ?? DEFAULT_SCREENING_CONFIG.resumeWeight),
      coverLetterWeight: String(
        screeningConfig.coverLetterWeight ?? DEFAULT_SCREENING_CONFIG.coverLetterWeight
      ),
      phoneWeight: String(screeningConfig.phoneWeight ?? DEFAULT_SCREENING_CONFIG.phoneWeight),
      emailWeight: String(screeningConfig.emailWeight ?? DEFAULT_SCREENING_CONFIG.emailWeight),
      keywordWeight: String(screeningConfig.keywordWeight ?? DEFAULT_SCREENING_CONFIG.keywordWeight)
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

  return (
    <section className="jobs-page">
      <div className="jobs-toolbar">
        <div>
          <p className="section-kicker">Job Management</p>
          <h2>Jobs</h2>
        </div>
        {canManageJobs && (
          <Button
            type="button"
            variant="outline"
            className="clean-btn"
            onClick={openCreateModal}
            disabled={formBusy}
          >
            + New Job
          </Button>
        )}
      </div>

      <div className="jobs-stats">
        <article className="stat-tile">
          <p>Total (page)</p>
          <h3>{jobs.length}</h3>
        </article>
        <article className="stat-tile">
          <p>Open</p>
          <h3>{openCount}</h3>
        </article>
        <article className="stat-tile">
          <p>Closed</p>
          <h3>{closedCount}</h3>
        </article>
        <article className="stat-tile">
          <p>Companies</p>
          <h3>{uniqueCompanies}</h3>
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
              value={status || "all"}
              onValueChange={(value) => {
                setPage(1);
                setStatus(value === "all" ? "" : value);
              }}
            >
              <SelectTrigger className="input select-clean">
                <SelectValue placeholder="All status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="open">open</SelectItem>
                <SelectItem value="closed">closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {query.isLoading && <Loader />}
      {query.isError && <ErrorState message={query.error?.response?.data?.message} />}

      {!query.isLoading && !query.isError && jobs.length === 0 && <p className="muted">No jobs found.</p>}

      {!query.isLoading && !query.isError && jobs.length > 0 && (
        <Card className="table-wrap">
          <Table className="jobs-table">
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job, index) => (
                <TableRow key={job._id}>
                  <TableCell>{(currentPage - 1) * LIMIT + index + 1}</TableCell>
                  <TableCell>{job.title}</TableCell>
                  <TableCell>{job.company}</TableCell>
                  <TableCell>{job.location}</TableCell>
                  <TableCell>
                    <span className={`badge ${job.status}`}>{job.status}</span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="action-ellipsis" type="button">
                        <FiMoreVertical />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/jobs/${job._id}`}>Detail</Link>
                        </DropdownMenuItem>
                        {canManageJobs && (
                          <>
                        <DropdownMenuItem onClick={() => startEdit(job)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => deleteMutation.mutate(job._id)}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending ? "Deleting..." : "Delete"}
                        </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
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
            <DialogTitle>{editingId ? "Edit Job" : "Create New Job"}</DialogTitle>
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
              const payload = getFormPayload(form);
              if (editingId) {
                updateMutation.mutate({ id: editingId, payload });
                return;
              }
              createMutation.mutate(payload);
            }}
          >
            <article className="job-form-section">
              <h4>Informasi Job</h4>
              <div className="field-grid-two">
                <label className="field">
                  <span>Job Title</span>
                  <Input
                    placeholder="Contoh: Senior Backend Engineer"
                    value={form.title}
                    onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  />
                </label>
                <label className="field">
                  <span>Company</span>
                  <Input
                    placeholder="Nama perusahaan"
                    value={form.company}
                    onChange={(event) => setForm((prev) => ({ ...prev, company: event.target.value }))}
                  />
                </label>
                <label className="field">
                  <span>Location</span>
                  <Input
                    placeholder="Kota / Remote / Hybrid"
                    value={form.location}
                    onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
                  />
                </label>
                <label className="field">
                  <span>Status</span>
                  <Select
                    value={form.status}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, status: value }))}
                  >
                  <SelectTrigger className="input select-clean">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">open</SelectItem>
                      <SelectItem value="closed">closed</SelectItem>
                    </SelectContent>
                  </Select>
                </label>
              </div>
                <label className="field">
                <span>Description</span>
                <Textarea
                  rows={5}
                  placeholder="Deskripsikan role, tanggung jawab, dan kualifikasi utama"
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                />
              </label>
            </article>

            <article className="job-form-section">
              <h4>Aturan Screening</h4>
              <label className="field">
                <span>Keyword Prioritas</span>
                <Input
                  placeholder="Pisahkan dengan koma, contoh: nodejs, react, mongodb"
                  value={form.screeningKeywords}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, screeningKeywords: event.target.value }))
                  }
                />
              </label>
              <div className="field-grid-two">
                <label className="field">
                  <span>Pass Threshold</span>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={form.passThreshold}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, passThreshold: event.target.value }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Review Threshold</span>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={form.reviewThreshold}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, reviewThreshold: event.target.value }))
                    }
                  />
                </label>
              </div>
              <div className="field-grid-two">
                {SCREENING_WEIGHT_FIELDS.map((entry) => (
                  <label className="field" key={entry.key}>
                    <span>{entry.label}</span>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={form[entry.key]}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, [entry.key]: event.target.value }))
                      }
                    />
                  </label>
                ))}
              </div>
              <p className={screeningTotal <= 100 ? "muted" : "error"}>
                Total nilai: {screeningTotal}/100
              </p>
            </article>
            <div className="actions">
              <Button disabled={formBusy} type="submit">
                {formBusy ? "Saving..." : editingId ? "Update Job" : "Create Job"}
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
