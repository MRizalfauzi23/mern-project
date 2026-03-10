import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ErrorState } from "../components/ErrorState";
import { Loader } from "../components/Loader";
import { fetchApplications, updateApplicationStatus } from "../features/applications/applicationsApi";
import { useToast } from "../components/ToastProvider";

const STATUSES = ["screening", "interview", "offer", "hired", "rejected"];
const STATUS_LABELS = {
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected"
};

export function ApplicationPipelinePage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [activeStatus, setActiveStatus] = useState("screening");
  const query = useQuery({
    queryKey: ["applications-pipeline"],
    queryFn: () => fetchApplications({ page: 1, limit: 50, search: "", status: "" })
  });

  const mutation = useMutation({
    mutationFn: updateApplicationStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications-pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      showToast("Status pipeline diperbarui");
    },
    onError: () => showToast("Gagal memperbarui status pipeline", "error")
  });

  const applications = query.data?.applications || [];
  const statusCount = useMemo(
    () =>
      STATUSES.reduce((acc, status) => {
        acc[status] = applications.filter((application) => application.status === status).length;
        return acc;
      }, {}),
    [applications]
  );
  const filteredItems = applications.filter((application) => application.status === activeStatus);

  if (query.isLoading) return <Loader label="Memuat pipeline lamaran..." />;
  if (query.isError) return <ErrorState message={query.error?.response?.data?.message} />;

  return (
    <section className="jobs-page pipeline-page">
      <div className="pipeline-hero">
        <div>
          <p className="section-kicker">Applicant Tracking</p>
          <h2>Pipeline Lamaran</h2>
          <p className="muted">Gunakan tab status untuk melihat kandidat per tahap dalam format tabel.</p>
        </div>
      </div>

      <div className="pipeline-tabs" role="tablist" aria-label="Status Pipeline">
        {STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            className={`pipeline-tab ${activeStatus === status ? "active" : ""}`}
            onClick={() => setActiveStatus(status)}
            role="tab"
            aria-selected={activeStatus === status}
          >
            {STATUS_LABELS[status]} ({statusCount[status] || 0})
          </button>
        ))}
      </div>

      <article className="panel-card pipeline-table-card">
        <div className="jobs-toolbar">
          <h3>{STATUS_LABELS[activeStatus]}</h3>
          <span className="muted">{filteredItems.length} kandidat</span>
        </div>
        <div className="table-wrap">
          <table className="saas-table">
            <thead>
              <tr>
                <th>Kandidat</th>
                <th>Email</th>
                <th>Lowongan</th>
                <th>Perusahaan</th>
                <th>Skor</th>
                <th>Update Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item._id}>
                  <td>{item.candidateName}</td>
                  <td>{item.candidateEmail}</td>
                  <td>{item.job?.title || "-"}</td>
                  <td>{item.job?.company || "-"}</td>
                  <td>
                    <span className="badge screening">{item.screeningScore ?? 0}</span>
                  </td>
                  <td>
                    <select
                      className="input"
                      value={item.status}
                      onChange={(event) =>
                        mutation.mutate({
                          id: item._id,
                          status: event.target.value
                        })
                      }
                    >
                      {STATUSES.map((s) => (
                        <option value={s} key={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <Link to={`/applications/${item._id}`} className="link-btn">
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="muted">
                    Belum ada kandidat di tahap {STATUS_LABELS[activeStatus]}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
