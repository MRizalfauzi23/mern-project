import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ErrorState } from "../components/ErrorState";
import { Loader } from "../components/Loader";
import {
  addApplicationNote,
  fetchApplicationById,
  rerunApplicationScreening,
  updateApplicationStatus
} from "../features/applications/applicationsApi";
import { useToast } from "../components/ToastProvider";

export function ApplicationDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [note, setNote] = useState("");
  const query = useQuery({
    queryKey: ["application-detail", id],
    queryFn: () => fetchApplicationById(id),
    enabled: Boolean(id)
  });

  const statusMutation = useMutation({
    mutationFn: updateApplicationStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      showToast("Status lamaran diperbarui");
    },
    onError: () => showToast("Gagal memperbarui status", "error")
  });

  const noteMutation = useMutation({
    mutationFn: addApplicationNote,
    onSuccess: () => {
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["application-detail", id] });
      showToast("Catatan recruiter tersimpan");
    },
    onError: () => showToast("Gagal menyimpan catatan", "error")
  });

  const rerunMutation = useMutation({
    mutationFn: rerunApplicationScreening,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      showToast("Screening otomatis berhasil dijalankan ulang");
    },
    onError: () => showToast("Gagal menjalankan ulang screening", "error")
  });

  if (query.isLoading) return <Loader label="Memuat detail lamaran..." />;
  if (query.isError) return <ErrorState message={query.error?.response?.data?.message} />;

  const item = query.data;
  if (!item) return <ErrorState message="Lamaran tidak ditemukan." />;
  const score = Number(item.screeningScore || 0);
  const scorePercent = Math.max(0, Math.min(100, score));

  return (
    <section className="jobs-page application-detail-page">
      <div className="application-detail-hero">
        <div>
          <p className="section-kicker">Application Review</p>
          <h2>Detail Lamaran</h2>
          <p className="muted">
            {item.candidateName} • {item.job?.title || "-"} • {item.job?.company || "-"}
          </p>
        </div>
        <div className="actions">
          <Link to="/applications" className="link-btn">
            Kembali
          </Link>
          <button type="button" onClick={() => rerunMutation.mutate(item._id)} disabled={rerunMutation.isPending}>
            {rerunMutation.isPending ? "Memproses..." : "Jalankan Ulang Screening"}
          </button>
        </div>
      </div>

      <section className="application-overview-grid">
        <article className="panel-card">
          <h3>Profil Kandidat</h3>
          <div className="detail-meta-grid">
            <div>
              <span>Nama</span>
              <strong>{item.candidateName}</strong>
            </div>
            <div>
              <span>Email</span>
              <strong>{item.candidateEmail}</strong>
            </div>
            <div>
              <span>Telepon</span>
              <strong>{item.phone || "-"}</strong>
            </div>
            <div>
              <span>Status Saat Ini</span>
              <strong>
                <span className={`badge ${item.status}`}>{item.status}</span>
              </strong>
            </div>
            <div>
              <span>Lowongan</span>
              <strong>{item.job?.title || "-"}</strong>
            </div>
            <div>
              <span>Perusahaan</span>
              <strong>{item.job?.company || "-"}</strong>
            </div>
          </div>
          <label className="field">
            <span>Ubah status</span>
            <select
              className="input"
              value={item.status}
              onChange={(event) => statusMutation.mutate({ id: item._id, status: event.target.value })}
            >
              <option value="screening">screening</option>
              <option value="interview">interview</option>
              <option value="offer">offer</option>
              <option value="hired">hired</option>
              <option value="rejected">rejected</option>
            </select>
          </label>
          <div>
            <p>
              <strong>CV:</strong>{" "}
              {item.resumeUrl ? (
                <a
                  href={item.resumeUrl.startsWith("http") ? item.resumeUrl : `http://localhost:5000${item.resumeUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="link-btn"
                >
                  Lihat CV
                </a>
              ) : (
                "-"
              )}
            </p>
          </div>
        </article>

        <article className="panel-card screening-summary-panel">
          <h3>Ringkasan Screening</h3>
          <div className="screening-score-row">
            <div>
              <p className="muted">Skor Screening</p>
              <h2>{score}</h2>
            </div>
            <div className="screening-badges">
              <span className="badge screening">{item.screeningResult}</span>
              <span className={`badge ${item.screeningRecommendedStatus}`}>{item.screeningRecommendedStatus}</span>
            </div>
          </div>
          <div className="screening-progress-track">
            <div className="screening-progress-fill" style={{ width: `${scorePercent}%` }} />
          </div>
          <p className="muted">
            Waktu screening: {item.screenedAt ? new Date(item.screenedAt).toLocaleString("id-ID") : "-"}
          </p>
          <h4>Alasan Screening</h4>
          <ul className="plain-list">
            {(item.screeningReasons || []).map((reason, index) => (
              <li key={`${reason}-${index}`}>{reason}</li>
            ))}
            {(item.screeningReasons || []).length === 0 && <li>-</li>}
          </ul>
        </article>
      </section>

      <article className="panel-card">
        <div className="jobs-toolbar">
          <h3>Explainability Score Breakdown</h3>
          <span className="muted">Per rule</span>
        </div>
        <div className="table-wrap">
          <table className="saas-table explain-table">
            <thead>
              <tr>
                <th>Rule</th>
                <th>Skor</th>
                <th>Bobot Max</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {(item.screeningBreakdown || []).map((entry) => (
                <tr key={entry.ruleKey}>
                  <td>{entry.label}</td>
                  <td>{entry.score}</td>
                  <td>{entry.maxScore}</td>
                  <td>
                    {entry.detail}
                    {entry.matchedCount > 0
                      ? ` (match ${entry.matchedCount}/${entry.targetCount})`
                      : entry.targetCount
                        ? ` (match 0/${entry.targetCount})`
                        : ""}
                  </td>
                </tr>
              ))}
              {(item.screeningBreakdown || []).length === 0 && (
                <tr>
                  <td colSpan={4}>Belum ada breakdown scoring.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>

      <article className="panel-card">
        <h3>Cover Letter</h3>
        <p className="application-cover-letter">{item.coverLetter || "-"}</p>
      </article>

      <section className="saas-main-grid">
        <article className="panel-card">
          <h3>Timeline Status</h3>
          <div className="timeline-list">
            {(item.statusHistory || []).map((entry, index) => (
              <div className="timeline-item" key={`${entry.status}-${entry.changedAt}-${index}`}>
                <span className={`badge ${entry.status}`}>{entry.status}</span>
                <small className="muted">{new Date(entry.changedAt).toLocaleString("id-ID")}</small>
              </div>
            ))}
            {(item.statusHistory || []).length === 0 && <p className="muted">Belum ada riwayat status.</p>}
          </div>
        </article>

        <article className="panel-card">
          <h3>Catatan Recruiter</h3>
          <form
            className="form-grid"
            onSubmit={(event) => {
              event.preventDefault();
              if (!note.trim()) return;
              noteMutation.mutate({ id: item._id, note: note.trim() });
            }}
          >
            <textarea
              className="input"
              rows={3}
              value={note}
              placeholder="Tambahkan catatan review kandidat..."
              onChange={(event) => setNote(event.target.value)}
            />
            <div className="actions">
              <button type="submit" disabled={noteMutation.isPending}>
                {noteMutation.isPending ? "Menyimpan..." : "Simpan Catatan"}
              </button>
            </div>
          </form>
          <div className="timeline-list">
            {(item.recruiterNotes || []).map((entry, index) => (
              <div className="timeline-item" key={`${entry.authorEmail}-${entry.createdAt}-${index}`}>
                <p>{entry.note}</p>
                <small className="muted">
                  {entry.authorEmail} - {new Date(entry.createdAt).toLocaleString("id-ID")}
                </small>
              </div>
            ))}
            {(item.recruiterNotes || []).length === 0 && <p className="muted">Belum ada catatan.</p>}
          </div>
        </article>
      </section>
    </section>
  );
}
