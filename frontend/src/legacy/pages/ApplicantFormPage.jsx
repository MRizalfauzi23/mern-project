"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useToast } from "../../components/ToastProvider";
import { fetchJobs } from "../../features/jobs/jobsApi";
import { submitPublicApplication } from "../../features/applications/applicationsApi";
import { Loader } from "../../components/Loader";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";

const INITIAL_FORM = {
  fullName: "",
  email: "",
  phone: "",
  coverLetter: ""
};

export function ApplicantFormPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const [form, setForm] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [portfolioFile, setPortfolioFile] = useState(null);

  const jobsQuery = useQuery({
    queryKey: ["public-jobs"],
    queryFn: () => fetchJobs({ page: 1, limit: 50, search: "", status: "open" })
  });

  const availableJobs = jobsQuery.data?.jobs || [];
  const selectedJob = availableJobs.find((job) => job._id === selectedJobId);

  const submitMutation = useMutation({
    mutationFn: submitPublicApplication,
    onSuccess: () => {
      setIsSubmitting(false);
      setForm(INITIAL_FORM);
      setSelectedJobId("");
      setPortfolioFile(null);
      showToast("Lamaran berhasil dikirim");
      router.push("/apply/success");
    },
    onError: (error) => {
      setIsSubmitting(false);
      showToast(error?.response?.data?.message || "Gagal mengirim lamaran", "error");
    }
  });

  function handleSubmit(event) {
    event.preventDefault();
    if (!selectedJobId) return;
    setIsSubmitting(true);
    submitMutation.mutate({
      jobId: selectedJobId,
      candidateName: form.fullName,
      candidateEmail: form.email,
      phone: form.phone,
      coverLetter: form.coverLetter,
      resumeFile: portfolioFile
    });
  }

  return (
    <section className="applicant-page">
      <div className="applicant-shell">
        <div className="applicant-card">
        <div className="applicant-header">
          <p className="section-kicker">Form Pelamar</p>
          <h2>Ajukan Lamaran</h2>
          <p className="muted">
            Silahkan isi form di bawah untuk melamar ke salah satu lowongan yang tersedia. Pastikan data yang Anda masukkan benar dan lengkap. Tim rekrutmen akan menghubungi Anda jika ada kecocokan dengan lowongan yang dipilih.
          </p>
        </div>

        {jobsQuery.isLoading && <Loader label="Memuat lowongan..." />}
        {jobsQuery.isError && (
          <p className="muted">Gagal memuat lowongan. Coba refresh halaman.</p>
        )}

        {!jobsQuery.isLoading && !jobsQuery.isError && (
          <div className="applicant-jobs">
            <p className="muted">Pilih lowongan yang tersedia:</p>
            <div className="job-radio-grid">
              {availableJobs.length === 0 && <p className="muted">Belum ada lowongan aktif.</p>}
              {availableJobs.map((job) => (
                <label key={job._id} className="job-radio">
                  <input
                    type="radio"
                    name="jobId"
                    value={job._id}
                    checked={selectedJobId === job._id}
                    onChange={() => setSelectedJobId(job._id)}
                  />
                  <div>
                    <strong>{job.title}</strong>
                    <p className="muted">
                      {job.company} · {job.location}
                    </p>
                    <p className="job-desc">
                      {job.description?.length > 160
                        ? `${job.description.slice(0, 160)}...`
                        : job.description || "Deskripsi belum tersedia."}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {selectedJob && (
          <form className="applicant-form applicant-form--visible" onSubmit={handleSubmit}>
            <div className="selected-job">
              <span className="muted">Lowongan dipilih</span>
              <strong>
                {selectedJob.title} — {selectedJob.company}
              </strong>
            </div>
            <label className="field">
              <span>Nama Lengkap</span>
              <Input
                placeholder="Contoh: Rizal F."
                value={form.fullName}
                onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                required
              />
            </label>
            <label className="field">
              <span>Email</span>
              <Input
                type="email"
                placeholder="nama@email.com"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
            </label>
            <label className="field">
              <span>Nomor Telepon</span>
              <Input
                placeholder="08xxxxxx"
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                required
              />
            </label>
            <label className="field">
              <span>Upload Portfolio / CV</span>
              <Input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(event) => setPortfolioFile(event.target.files?.[0] || null)}
              />
            </label>
            <label className="field">
              <span>Cover Letter</span>
              <Textarea
                rows={5}
                placeholder="Tulis ringkasan pengalaman dan motivasi Anda."
                value={form.coverLetter}
                onChange={(event) => setForm((prev) => ({ ...prev, coverLetter: event.target.value }))}
              />
            </label>

            <Button type="submit" className="applicant-submit" disabled={isSubmitting}>
              {isSubmitting ? "Mengirim..." : "Kirim Lamaran"}
            </Button>
          </form>
        )}
        </div>
        <aside className="applicant-aside">
          <div className="applicant-aside-card">
            <h3>Tips singkat</h3>
            <ul className="plain-list">
              <li>Gunakan email aktif agar mudah dihubungi.</li>
              <li>CV PDF lebih rapi untuk recruiter.</li>
              <li>Cover letter singkat tapi spesifik.</li>
            </ul>
          </div>
          {/* <div className="applicant-aside-card soft">
            <h3>Status proses</h3>
            <p className="muted">Setelah submit, lamaran akan masuk tahap screening otomatis.</p>
          </div> */}
        </aside>
      </div>
    </section>
  );
}

