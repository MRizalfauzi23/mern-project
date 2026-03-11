"use client";

import { useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ErrorState } from "../../components/ErrorState";
import { Loader } from "../../components/Loader";
import { useToast } from "../../components/ToastProvider";
import { exportApplicationsExcel, fetchApplications } from "../../features/applications/applicationsApi";
import { fetchJobs } from "../../features/jobs/jobsApi";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../../components/ui/table";

export function AdminDashboardPage() {
  const { showToast } = useToast();
  const query = useQuery({
    queryKey: ["admin-dashboard-jobs"],
    queryFn: () => fetchJobs({ page: 1, limit: 50, search: "", status: "" })
  });
  const applicationsQuery = useQuery({
    queryKey: ["admin-dashboard-applications"],
    queryFn: () => fetchApplications({ page: 1, limit: 50, search: "", status: "" })
  });
  const exportMutation = useMutation({
    mutationFn: () => exportApplicationsExcel(),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `applications-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast("Report Excel berhasil diunduh");
    },
    onError: () => showToast("Gagal mengunduh report Excel", "error")
  });

  const { metrics, recentJobs, applicationStatusDistribution, pipelineSeries } = useMemo(() => {
    const jobs = query.data?.jobs || [];
    const applications = applicationsQuery.data?.applications || [];
    const openCount = jobs.filter((job) => job.status === "open").length;
    const closedCount = jobs.filter((job) => job.status === "closed").length;
    const companyCount = new Set(jobs.map((job) => job.company)).size;
    const lastWeekCount = jobs.filter((job) => {
      const createdAt = new Date(job.createdAt).getTime();
      return Date.now() - createdAt <= 7 * 24 * 60 * 60 * 1000;
    }).length;
    const hiredCount = applications.filter((item) => item.status === "hired").length;
    const rejectedCount = applications.filter((item) => item.status === "rejected").length;
    const hiredRate = applications.length ? Math.round((hiredCount / applications.length) * 100) : 0;
    const rejectedRate = applications.length
      ? Math.round((rejectedCount / applications.length) * 100)
      : 0;

    const byStatus = ["screening", "interview", "offer", "hired", "rejected"].map((status) => ({
      status,
      total: applications.filter((item) => item.status === status).length
    }));

    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const buckets = Array.from({ length: 6 }, (_, index) => {
      const start = now - (5 - index) * weekMs;
      const end = start + weekMs;
      const open = jobs.filter(
        (job) =>
          job.status === "open" &&
          new Date(job.createdAt).getTime() >= start &&
          new Date(job.createdAt).getTime() < end
      ).length;
      const closed = jobs.filter(
        (job) =>
          job.status === "closed" &&
          new Date(job.createdAt).getTime() >= start &&
          new Date(job.createdAt).getTime() < end
      ).length;
      return { open, closed, start, end };
    });

    return {
      metrics: [
        { label: "Total Lowongan", value: jobs.length, trend: "+12% bulan ini" },
        { label: "Posisi Terbuka", value: openCount, trend: `${closedCount} ditutup` },
        { label: "Total Lamaran", value: applications.length, trend: `${hiredRate}% hired rate` },
        { label: "Perusahaan Aktif", value: companyCount, trend: "Hiring multi-klien" },
        { label: "Posting 7 Hari", value: lastWeekCount, trend: "Pipeline terbaru" },
        { label: "Rejected Rate", value: `${rejectedRate}%`, trend: `${rejectedCount} kandidat` }
      ],
      recentJobs: jobs.slice(0, 6),
      applicationStatusDistribution: byStatus,
      pipelineSeries: buckets
    };
  }, [query.data, applicationsQuery.data]);

  if (query.isLoading) return <Loader label="Memuat dashboard admin..." />;
  if (query.isError) return <ErrorState message={query.error?.response?.data?.message} />;
  const applications = applicationsQuery.data?.applications || [];

  const chartWidth = 640;
  const chartHeight = 220;
  const chartPadding = { left: 40, right: 40, top: 30, bottom: 30 };
  const openSeries = pipelineSeries?.map((item) => item.open) || [];
  const closedSeries = pipelineSeries?.map((item) => item.closed) || [];
  const seriesMax = Math.max(1, ...openSeries, ...closedSeries);
  const pointCount = Math.max(openSeries.length, closedSeries.length, 2);
  const xStep =
    (chartWidth - chartPadding.left - chartPadding.right) / Math.max(pointCount - 1, 1);
  const usableHeight = chartHeight - chartPadding.top - chartPadding.bottom;

  function buildPoints(series) {
    return series.map((value, index) => {
      const x = chartPadding.left + index * xStep;
      const y = chartPadding.top + (1 - value / seriesMax) * usableHeight;
      return { x, y };
    });
  }

  function buildSmoothPath(points) {
    if (points.length === 0) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    const smoothing = 0.2;
    const path = [`M ${points[0].x} ${points[0].y}`];
    for (let i = 0; i < points.length - 1; i += 1) {
      const current = points[i];
      const next = points[i + 1];
      const prev = points[i - 1] || current;
      const after = points[i + 2] || next;
      const controlPoint = (point, previous, nextPoint, reverse = false) => {
        const dx = nextPoint.x - previous.x;
        const dy = nextPoint.y - previous.y;
        const angle = Math.atan2(dy, dx) + (reverse ? Math.PI : 0);
        const length = Math.hypot(dx, dy) * smoothing;
        return {
          x: point.x + Math.cos(angle) * length,
          y: point.y + Math.sin(angle) * length
        };
      };
      const cps = controlPoint(current, prev, next);
      const cpe = controlPoint(next, current, after, true);
      path.push(`C ${cps.x} ${cps.y} ${cpe.x} ${cpe.y} ${next.x} ${next.y}`);
    }
    return path.join(" ");
  }

  function buildAreaPath(points) {
    if (points.length === 0) return "";
    const linePath = buildSmoothPath(points);
    const last = points[points.length - 1];
    const first = points[0];
    const bottom = chartHeight - chartPadding.bottom;
    return `${linePath} L ${last.x} ${bottom} L ${first.x} ${bottom} Z`;
  }

  const openPoints = buildPoints(openSeries);
  const closedPoints = buildPoints(closedSeries);
  const openLinePath = buildSmoothPath(openPoints);
  const closedLinePath = buildSmoothPath(closedPoints);
  const openAreaPath = buildAreaPath(openPoints);
  const closedAreaPath = buildAreaPath(closedPoints);
  const weekLabels = pipelineSeries.map((bucket) => {
    const start = new Date(bucket.start);
    const end = new Date(bucket.end - 1);
    const startDay = start.toLocaleDateString("id-ID", { day: "2-digit" });
    const endDay = end.toLocaleDateString("id-ID", { day: "2-digit" });
    const startMonth = start.toLocaleDateString("id-ID", { month: "short" });
    const endMonth = end.toLocaleDateString("id-ID", { month: "short" });
    if (startMonth === endMonth) {
      return `${startDay}-${endDay} ${startMonth}`;
    }
    return `${startDay} ${startMonth}-${endDay} ${endMonth}`;
  });

  const statusPalette = {
    screening: "#4f7cff",
    interview: "#ff9f43",
    offer: "#8b6cff",
    hired: "#3bbf77",
    rejected: "#ff6b6b"
  };
  const totalStatusCount = applicationStatusDistribution.reduce(
    (sum, item) => sum + item.total,
    0
  );
  const donutSize = 180;
  const donutRadius = 68;
  const donutStroke = 14;
  const donutCirc = 2 * Math.PI * donutRadius;
  let donutOffset = 0;

  return (
    <section className="saas-dashboard admin-dashboard">
      <div className="jobs-toolbar admin-toolbar">
        {/* <div>
          <p className="section-kicker">Dashboard</p>
          <h2>Admin Analytics</h2>
          <p className="muted">Ringkasan performa rekrutmen dan pipeline operasional.</p>
        </div> */}
        {/* <div className="admin-hero-actions">
          <div className="admin-search">
            <input placeholder="Search keywords" />
          </div>
          <button
            type="button"
            className="primary-btn"
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
          >
            {exportMutation.isPending ? "Menyiapkan CSV..." : "Export Report"}
          </button>
        </div> */}
      </div>

      <div className="kpi-grid kpi-grid-4">
        {metrics.slice(0, 4).map((item) => (
          <Card key={item.label} className="kpi-card">
            <CardContent>
              <p>{item.label}</p>
              <h3>{item.value}</h3>
              <span>{item.trend}</span>
              <div className="kpi-spark" aria-hidden="true">
                <svg className="kpi-sparkline" viewBox="0 0 120 40" preserveAspectRatio="none">
                  <path
                    className="spark-area"
                    d="M2 28 C14 20, 26 18, 38 22 C50 26, 62 26, 74 20 C86 14, 98 14, 118 18 L118 40 L2 40 Z"
                  />
                  <path
                    className="spark-line"
                    d="M2 28 C14 20, 26 18, 38 22 C50 26, 62 26, 74 20 C86 14, 98 14, 118 18"
                  />
                </svg>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="admin-grid">
        <div className="admin-grid-main">
          <Card className="panel-card">
            <CardHeader className="panel-head">
              <div>
                <CardTitle>Distribusi Pipeline Lowongan</CardTitle>
                <p className="panel-subtitle">Per minggu (6 minggu terakhir)</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => exportMutation.mutate()}>
                Export Excel
              </Button>
            </CardHeader>
            <CardContent>
              <div className="pipeline-chart" aria-hidden="true">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="openFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#6a9cff" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#6a9cff" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="closedFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#4fd1c5" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#4fd1c5" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <g className="chart-grid">
                    <line x1="40" y1="50" x2="600" y2="50" />
                    <line x1="40" y1="95" x2="600" y2="95" />
                    <line x1="40" y1="140" x2="600" y2="140" />
                    <line x1="40" y1="185" x2="600" y2="185" />
                  </g>
                  <path className="chart-area open" fill="url(#openFill)" d={openAreaPath} />
                  <path className="chart-area closed" fill="url(#closedFill)" d={closedAreaPath} />
                  <path className="chart-line open" d={openLinePath} />
                  <path className="chart-line closed" d={closedLinePath} />
                  <g className="chart-dots">
                    {openPoints.slice(-3).map((point) => (
                      <circle key={`open-${point.x}`} cx={point.x} cy={point.y} r="4" className="open" />
                    ))}
                    {closedPoints.slice(-3).map((point) => (
                      <circle
                        key={`closed-${point.x}`}
                        cx={point.x}
                        cy={point.y}
                        r="4"
                        className="closed"
                      />
                    ))}
                  </g>
                </svg>
              </div>
              <div className="chart-axis-x">
                {weekLabels.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
              <div className="legend-row">
                <span className="dot-open">Terbuka</span>
                <span className="dot-closed">Ditutup</span>
              </div>
            </CardContent>
          </Card>

          <Card className="panel-card">
            <CardHeader>
              <CardTitle>Aktivitas Lowongan Terbaru</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="table-wrap">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Posisi</TableHead>
                      <TableHead>Perusahaan</TableHead>
                      <TableHead>Lokasi</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentJobs.map((job) => (
                      <TableRow key={job._id}>
                        <TableCell>{job.title}</TableCell>
                        <TableCell>{job.company}</TableCell>
                        <TableCell>{job.location}</TableCell>
                        <TableCell>
                          <span className={`badge ${job.status}`}>{job.status}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="admin-grid-side">
          <Card className="panel-card">
            <CardHeader>
              <CardTitle>Distribusi Status Lamaran</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="status-chart">
                <svg viewBox={`0 0 ${donutSize} ${donutSize}`} className="status-donut" aria-hidden="true">
                  <circle
                    className="donut-track"
                    cx={donutSize / 2}
                    cy={donutSize / 2}
                    r={donutRadius}
                    strokeWidth={donutStroke}
                  />
                  {applicationStatusDistribution.map((item) => {
                    const value = item.total;
                    const ratio = totalStatusCount ? value / totalStatusCount : 0;
                    const length = donutCirc * ratio;
                    const dashArray = `${length} ${donutCirc - length}`;
                    const offset = donutOffset;
                    donutOffset += length;
                    return (
                      <circle
                        key={item.status}
                        className="donut-segment"
                        cx={donutSize / 2}
                        cy={donutSize / 2}
                        r={donutRadius}
                        strokeWidth={donutStroke}
                        strokeDasharray={dashArray}
                        strokeDashoffset={-offset}
                        style={{ stroke: statusPalette[item.status] || "#8aa0b6" }}
                      />
                    );
                  })}
                  <text x="50%" y="48%" textAnchor="middle" className="donut-total">
                    {totalStatusCount}
                  </text>
                  <text x="50%" y="60%" textAnchor="middle" className="donut-label">
                    Total
                  </text>
                </svg>
                <div className="status-legend">
                  {applicationStatusDistribution.map((item) => (
                    <div className="legend-item" key={item.status}>
                      <span
                        className="legend-dot"
                        style={{ background: statusPalette[item.status] || "#8aa0b6" }}
                      />
                      <span className="legend-text">{item.status}</span>
                      <strong>{item.total}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* <article className="panel-card">
            <h3>Insight Operasional</h3>
            <ul className="plain-list">
              <li>Sinyal volume tertinggi: prioritaskan screening lebih cepat untuk role high-demand.</li>
              <li>Tren penutupan menunjukkan konversi funnel yang sehat dari terbuka ke ditutup.</li>
              <li>Pantau status hired dan rejected untuk mengoptimalkan quality funnel.</li>
            </ul>
          </article> */}
        </div>
      </div>
    </section>
  );
}

