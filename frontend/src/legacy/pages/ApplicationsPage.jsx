"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import Link from "next/link";
import { ErrorState } from "../../components/ErrorState";
import { Loader } from "../../components/Loader";
import { Pagination } from "../../components/Pagination";
import { SearchBar } from "../../components/SearchBar";
import {
  createApplication,
  fetchApplications,
  updateApplicationStatus
} from "../../features/applications/applicationsApi";
import { fetchJobs } from "../../features/jobs/jobsApi";
import { useDebounce } from "../../lib/useDebounce";
import { useToast } from "../../components/ToastProvider";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "../../components/ui/dropdown-menu";
import { FiMoreVertical } from "react-icons/fi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../../components/ui/table";

const LIMIT = 8;
const INITIAL_FORM = {
  jobId: "",
  candidateName: "",
  candidateEmail: "",
  phone: "",
  resumeUrl: "",
  resumeFile: null,
  coverLetter: ""
};

export function ApplicationsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [actionError, setActionError] = useState("");
  const debouncedSearch = useDebounce(search);

  const appsQuery = useQuery({
    queryKey: ["applications", page, debouncedSearch, status],
    queryFn: () => fetchApplications({ page, limit: LIMIT, search: debouncedSearch, status })
  });

  const jobsQuery = useQuery({
    queryKey: ["jobs-options"],
    queryFn: () => fetchJobs({ page: 1, limit: 50, search: "", status: "" })
  });

  const createMutation = useMutation({
    mutationFn: createApplication,
    onSuccess: () => {
      setIsModalOpen(false);
      setForm(INITIAL_FORM);
      setActionError("");
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      showToast("Lamaran berhasil ditambahkan");
    },
    onError: (error) => {
      const message = error?.response?.data?.message || "Gagal membuat lamaran";
      setActionError(message);
      showToast(message, "error");
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: updateApplicationStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      showToast("Status lamaran diperbarui");
    },
    onError: () => {
      showToast("Gagal memperbarui status lamaran", "error");
    }
  });

  const applications = appsQuery.data?.applications || [];
  const meta = appsQuery.data?.meta || {};
  const jobs = jobsQuery.data?.jobs || [];
  const currentPage = meta.page || 1;
  const apiBaseUrl = "http://localhost:5000";

  return (
    <section className="jobs-page">
      <div className="jobs-toolbar">
        <div>
          <p className="section-kicker">Applicant Tracking</p>
          <h2>Lamaran</h2>
        </div>
        <Button
          type="button"
          variant="outline"
          className="clean-btn"
          onClick={() => setIsModalOpen(true)}
          disabled={createMutation.isPending}
        >
          + Tambah Lamaran
        </Button>
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
                <SelectValue placeholder="Semua status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua status</SelectItem>
                <SelectItem value="screening">screening</SelectItem>
                <SelectItem value="interview">interview</SelectItem>
                <SelectItem value="offer">offer</SelectItem>
                <SelectItem value="hired">hired</SelectItem>
                <SelectItem value="rejected">rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {appsQuery.isLoading && <Loader label="Memuat data lamaran..." />}
      {appsQuery.isError && <ErrorState message={appsQuery.error?.response?.data?.message} />}

      {!appsQuery.isLoading && !appsQuery.isError && applications.length > 0 && (
        <Card className="table-wrap">
          <Table className="jobs-table applications-table">
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Kandidat</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Lowongan</TableHead>
                <TableHead>CV</TableHead>
                <TableHead>Screening</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((application, index) => (
                <TableRow key={application._id}>
                  <TableCell>{(currentPage - 1) * LIMIT + index + 1}</TableCell>
                  <TableCell>{application.candidateName}</TableCell>
                  <TableCell>{application.candidateEmail}</TableCell>
                  <TableCell>{application.job?.title || "-"}</TableCell>
                  <TableCell>
                    {application.resumeUrl ? (
                      <a
                        href={
                          application.resumeUrl.startsWith("http")
                            ? application.resumeUrl
                            : `${apiBaseUrl}${application.resumeUrl}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="link-btn"
                      >
                        Lihat CV
                      </a>
                    ) : (
                      <span className="muted">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="badge screening">{application.screeningScore || 0}</span>
                    <div>
                      <small className="muted">{application.screeningResult || "review"}</small>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`badge ${application.status}`}>{application.status}</span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="action-ellipsis" type="button">
                        <FiMoreVertical />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/applications/${application._id}`}>Detail</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={updateStatusMutation.isPending}
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: application._id,
                              status: "screening"
                            })
                          }
                        >
                          Set Screening
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={updateStatusMutation.isPending}
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: application._id,
                              status: "interview"
                            })
                          }
                        >
                          Set Interview
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={updateStatusMutation.isPending}
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: application._id,
                              status: "offer"
                            })
                          }
                        >
                          Set Offer
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={updateStatusMutation.isPending}
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: application._id,
                              status: "hired"
                            })
                          }
                        >
                          Set Hired
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={updateStatusMutation.isPending}
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: application._id,
                              status: "rejected"
                            })
                          }
                        >
                          Set Rejected
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {!appsQuery.isLoading && !appsQuery.isError && applications.length === 0 && (
        <p className="muted">Belum ada lamaran.</p>
      )}

      <Pagination page={meta.page || 1} totalPages={meta.totalPages || 1} onPageChange={setPage} />

      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsModalOpen(false);
            return;
          }
          setIsModalOpen(true);
        }}
      >
        <DialogContent className="modal-card">
          <DialogHeader>
            <DialogTitle>Tambah Lamaran</DialogTitle>
          </DialogHeader>
          <form
            className="form-grid modal-form"
            onSubmit={(event) => {
              event.preventDefault();
              setActionError("");
              if (!form.jobId) {
                setActionError("Pilih lowongan terlebih dahulu");
                return;
              }
              createMutation.mutate(form);
            }}
          >
            <label className="field">
              <span>Lowongan</span>
              <Select
                value={form.jobId || "none"}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, jobId: value === "none" ? "" : value }))
                }
              >
                <SelectTrigger className="input">
                  <SelectValue
                    placeholder={
                      jobsQuery.isLoading
                        ? "Memuat lowongan..."
                        : jobsQuery.isError
                          ? "Gagal memuat lowongan"
                          : "Pilih lowongan"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Pilih lowongan</SelectItem>
                  {!jobsQuery.isLoading &&
                    !jobsQuery.isError &&
                    jobs.map((job) => (
                      <SelectItem key={job._id} value={job._id}>
                        {job.title} - {job.company}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </label>
            <div className="field-grid-two">
              <label className="field">
                <span>Nama kandidat</span>
                <Input
                  placeholder="Masukkan nama kandidat"
                  value={form.candidateName}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, candidateName: event.target.value }))
                  }
                />
              </label>
              <label className="field">
                <span>Email kandidat</span>
                <Input
                  placeholder="nama@email.com"
                  type="email"
                  value={form.candidateEmail}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, candidateEmail: event.target.value }))
                  }
                />
              </label>
            </div>
            <label className="field">
              <span>Nomor telepon</span>
              <Input
                placeholder="08xxxxxxxxxx"
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              />
            </label>
            <label className="field">
              <span>Upload CV (PDF/DOC/DOCX, max 5MB)</span>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, resumeFile: event.target.files?.[0] || null }))
                }
              />
            </label>
            {form.resumeFile && <p className="muted">File dipilih: {form.resumeFile.name}</p>}
            <label className="field">
              <span>Cover letter (opsional)</span>
              <Textarea
                rows={4}
                placeholder="Tulis ringkasan singkat kandidat"
                value={form.coverLetter}
                onChange={(event) => setForm((prev) => ({ ...prev, coverLetter: event.target.value }))}
              />
            </label>
            <div className="actions">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Menyimpan..." : "Simpan Lamaran"}
              </Button>
            </div>
            {actionError && <ErrorState message={actionError} />}
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

