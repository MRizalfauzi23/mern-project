"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ErrorState } from "../components/ErrorState";
import { Loader } from "../components/Loader";
import {
  addApplicationNote,
  fetchApplicationById,
  rerunApplicationScreening,
  updateApplicationStatus
} from "../features/applications/applicationsApi";
import { useToast } from "../components/ToastProvider";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
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

export function ApplicationDetailPage() {
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
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
          <Link href="/applications" className="link-btn">
            Kembali
          </Link>
          <Button type="button" onClick={() => rerunMutation.mutate(item._id)} disabled={rerunMutation.isPending}>
            {rerunMutation.isPending ? "Memproses..." : "Jalankan Ulang Screening"}
          </Button>
        </div>
      </div>

      <section className="application-overview-grid">
        <Card className="panel-card">
          <CardHeader>
            <CardTitle>Profil Kandidat</CardTitle>
          </CardHeader>
          <CardContent>
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
              <Select
                value={item.status}
                onValueChange={(value) => statusMutation.mutate({ id: item._id, status: value })}
              >
              <SelectTrigger className="input">
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>
                <SelectContent>
                  <SelectItem value="screening">screening</SelectItem>
                  <SelectItem value="interview">interview</SelectItem>
                  <SelectItem value="offer">offer</SelectItem>
                  <SelectItem value="hired">hired</SelectItem>
                  <SelectItem value="rejected">rejected</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <div className="cv-row">
              <strong>CV:</strong>
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
                <span className="muted">-</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="panel-card screening-summary-panel">
          <CardHeader>
            <CardTitle>Ringkasan Screening</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </section>

      <Card className="panel-card">
        <CardHeader className="jobs-toolbar">
          <CardTitle>Explainability Score Breakdown</CardTitle>
          <span className="muted">Per rule</span>
        </CardHeader>
        <CardContent>
          <div className="table-wrap">
            <Table className="explain-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Rule</TableHead>
                  <TableHead>Skor</TableHead>
                  <TableHead>Bobot Max</TableHead>
                  <TableHead>Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(item.screeningBreakdown || []).map((entry) => (
                  <TableRow key={entry.ruleKey}>
                    <TableCell>{entry.label}</TableCell>
                    <TableCell>{entry.score}</TableCell>
                    <TableCell>{entry.maxScore}</TableCell>
                    <TableCell>
                      {entry.detail}
                      {entry.matchedCount > 0
                        ? ` (match ${entry.matchedCount}/${entry.targetCount})`
                        : entry.targetCount
                          ? ` (match 0/${entry.targetCount})`
                          : ""}
                    </TableCell>
                  </TableRow>
                ))}
                {(item.screeningBreakdown || []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4}>Belum ada breakdown scoring.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="panel-card">
        <CardHeader>
          <CardTitle>Cover Letter</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="application-cover-letter">{item.coverLetter || "-"}</p>
        </CardContent>
      </Card>

      <section className="saas-main-grid">
        <Card className="panel-card">
          <CardHeader>
            <CardTitle>Timeline Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="timeline-list">
              {(item.statusHistory || []).map((entry, index) => (
                <div className="timeline-item" key={`${entry.status}-${entry.changedAt}-${index}`}>
                  <span className={`badge ${entry.status}`}>{entry.status}</span>
                  <small className="muted">{new Date(entry.changedAt).toLocaleString("id-ID")}</small>
                </div>
              ))}
              {(item.statusHistory || []).length === 0 && <p className="muted">Belum ada riwayat status.</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="panel-card">
          <CardHeader>
            <CardTitle>Catatan Recruiter</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="form-grid"
              onSubmit={(event) => {
                event.preventDefault();
                if (!note.trim()) return;
                noteMutation.mutate({ id: item._id, note: note.trim() });
              }}
            >
            <Textarea
              rows={3}
              value={note}
              placeholder="Tambahkan catatan review kandidat..."
              onChange={(event) => setNote(event.target.value)}
            />
              <div className="actions">
                <Button type="submit" disabled={noteMutation.isPending}>
                  {noteMutation.isPending ? "Menyimpan..." : "Simpan Catatan"}
                </Button>
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
          </CardContent>
        </Card>
      </section>
    </section>
  );
}
