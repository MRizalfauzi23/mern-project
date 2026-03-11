"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ErrorState } from "../../components/ErrorState";
import { Loader } from "../../components/Loader";
import { fetchJobById } from "../../features/jobs/jobsApi";
import { buttonVariants } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

export function JobDetailPage() {
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const query = useQuery({
    queryKey: ["job-detail", id],
    queryFn: () => fetchJobById(id),
    enabled: Boolean(id)
  });

  if (query.isLoading) return <Loader label="Loading job detail..." />;
  if (query.isError) return <ErrorState message={query.error?.response?.data?.message || "Failed to load job"} />;

  const job = query.data;
  if (!job) return <ErrorState message="Job not found" />;
  const screeningConfig = job.screeningConfig || {};

  return (
    <section className="jobs-page job-detail-page">
      <div className="job-detail-hero">
        <div>
          <p className="section-kicker">Job Profile</p>
          <h2>{job.title}</h2>
          <p className="muted">
            {job.company} • {job.location}
          </p>
        </div>
        <div className="actions">
          <span className={`badge ${job.status}`}>{job.status}</span>
          <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Back to Jobs
          </Link>
        </div>
      </div>

      <section className="job-detail-grid">
        <Card className="panel-card">
          <CardHeader>
            <CardTitle>Deskripsi Posisi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="job-description">{job.description}</p>
          </CardContent>
        </Card>

        <Card className="panel-card">
          <CardHeader>
            <CardTitle>Konfigurasi Screening</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="detail-meta-grid">
              <div>
                <span>Pass Threshold</span>
                <strong>{screeningConfig.passThreshold ?? 70}</strong>
              </div>
              <div>
                <span>Review Threshold</span>
                <strong>{screeningConfig.reviewThreshold ?? 40}</strong>
              </div>
              <div>
                <span>Bobot CV</span>
                <strong>{screeningConfig.resumeWeight ?? 25}</strong>
              </div>
              <div>
                <span>Bobot Cover Letter</span>
                <strong>{screeningConfig.coverLetterWeight ?? 20}</strong>
              </div>
              <div>
                <span>Bobot Telepon</span>
                <strong>{screeningConfig.phoneWeight ?? 10}</strong>
              </div>
              <div>
                <span>Bobot Email</span>
                <strong>{screeningConfig.emailWeight ?? 10}</strong>
              </div>
              <div>
                <span>Bobot Keyword</span>
                <strong>{screeningConfig.keywordWeight ?? 35}</strong>
              </div>
            </div>
            <p className="muted">
              <strong>Keyword:</strong>{" "}
              {(screeningConfig.keywordList || []).length
                ? screeningConfig.keywordList.join(", ")
                : "otomatis dari deskripsi"}
            </p>
          </CardContent>
        </Card>
      </section>
    </section>
  );
}

