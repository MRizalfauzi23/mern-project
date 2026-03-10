import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ErrorState } from "../components/ErrorState";
import { Loader } from "../components/Loader";
import { Pagination } from "../components/Pagination";
import { SearchBar } from "../components/SearchBar";
import {
  createApplication,
  fetchApplications,
  updateApplicationStatus
} from "../features/applications/applicationsApi";
import { fetchJobs } from "../features/jobs/jobsApi";
import { useDebounce } from "../lib/useDebounce";
import { useToast } from "../components/ToastProvider";

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
        <button type="button" onClick={() => setIsModalOpen(true)}>
          + Tambah Lamaran
        </button>
      </div>

      <div className="jobs-filters card">
        <SearchBar
          value={search}
          onChange={(value) => {
            setPage(1);
            setSearch(value);
          }}
        />
        <div className="filter-row">
          <select
            className="input"
            value={status}
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value);
            }}
          >
            <option value="">Semua status</option>
            <option value="screening">screening</option>
            <option value="interview">interview</option>
            <option value="offer">offer</option>
            <option value="hired">hired</option>
            <option value="rejected">rejected</option>
          </select>
        </div>
      </div>

      {appsQuery.isLoading && <Loader label="Memuat data lamaran..." />}
      {appsQuery.isError && <ErrorState message={appsQuery.error?.response?.data?.message} />}

      {!appsQuery.isLoading && !appsQuery.isError && applications.length > 0 && (
        <div className="card table-wrap">
          <table className="saas-table jobs-table applications-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Kandidat</th>
                <th>Email</th>
                <th>Lowongan</th>
                <th>CV</th>
                <th>Screening</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application, index) => (
                <tr key={application._id}>
                  <td>{(currentPage - 1) * LIMIT + index + 1}</td>
                  <td>{application.candidateName}</td>
                  <td>{application.candidateEmail}</td>
                  <td>{application.job?.title || "-"}</td>
                  <td>
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
                  </td>
                  <td>
                    <span className="badge screening">{application.screeningScore || 0}</span>
                    <div>
                      <small className="muted">{application.screeningResult || "review"}</small>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${application.status}`}>{application.status}</span>
                  </td>
                  <td>
                    <div className="actions">
                      <Link to={`/applications/${application._id}`} className="link-btn">
                        Detail
                      </Link>
                      <select
                        className="input"
                        value={application.status}
                        onChange={(event) =>
                          updateStatusMutation.mutate({
                            id: application._id,
                            status: event.target.value
                          })
                        }
                      >
                        <option value="screening">screening</option>
                        <option value="interview">interview</option>
                        <option value="offer">offer</option>
                        <option value="hired">hired</option>
                        <option value="rejected">rejected</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!appsQuery.isLoading && !appsQuery.isError && applications.length === 0 && (
        <p className="muted">Belum ada lamaran.</p>
      )}

      <Pagination page={meta.page || 1} totalPages={meta.totalPages || 1} onPageChange={setPage} />

      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
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
              <div className="jobs-toolbar">
                <h3>Tambah Lamaran</h3>
                <button type="button" className="secondary-btn" onClick={() => setIsModalOpen(false)}>
                  Tutup
                </button>
              </div>
              <label className="field">
                <span>Lowongan</span>
                <select
                  className="input"
                  value={form.jobId}
                  onChange={(event) => setForm((prev) => ({ ...prev, jobId: event.target.value }))}
                >
                  <option value="">
                    {jobsQuery.isLoading
                      ? "Memuat lowongan..."
                      : jobsQuery.isError
                        ? "Gagal memuat lowongan"
                        : "Pilih lowongan"}
                  </option>
                  {!jobsQuery.isLoading &&
                    !jobsQuery.isError &&
                    jobs.map((job) => (
                      <option key={job._id} value={job._id}>
                        {job.title} - {job.company}
                      </option>
                    ))}
                </select>
              </label>
              <div className="field-grid-two">
                <label className="field">
                  <span>Nama kandidat</span>
                  <input
                    className="input"
                    placeholder="Masukkan nama kandidat"
                    value={form.candidateName}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, candidateName: event.target.value }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Email kandidat</span>
                  <input
                    className="input"
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
                <input
                  className="input"
                  placeholder="08xxxxxxxxxx"
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>Upload CV (PDF/DOC/DOCX, max 5MB)</span>
                <input
                  className="input"
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
                <textarea
                  className="input"
                  rows={4}
                  placeholder="Tulis ringkasan singkat kandidat"
                  value={form.coverLetter}
                  onChange={(event) => setForm((prev) => ({ ...prev, coverLetter: event.target.value }))}
                />
              </label>
              <div className="actions">
                <button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Menyimpan..." : "Simpan Lamaran"}
                </button>
              </div>
              {actionError && <ErrorState message={actionError} />}
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
