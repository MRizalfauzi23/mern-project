"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import Link from "next/link";
import { ErrorState } from "../components/ErrorState";
import { Loader } from "../components/Loader";
import { fetchApplications, updateApplicationStatus } from "../features/applications/applicationsApi";
import { useToast } from "../components/ToastProvider";
import { Button } from "../components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "../components/ui/dropdown-menu";
import { FiMoreVertical } from "react-icons/fi";

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
          <Button
            key={status}
            type="button"
            variant="outline"
            className={`pipeline-tab clean-btn ${activeStatus === status ? "active" : ""}`}
            onClick={() => setActiveStatus(status)}
            role="tab"
            aria-selected={activeStatus === status}
          >
            {STATUS_LABELS[status]} ({statusCount[status] || 0})
          </Button>
        ))}
      </div>

      <article className="panel-card pipeline-table-card">
        <div className="jobs-toolbar">
          <h3>{STATUS_LABELS[activeStatus]}</h3>
          <span className="muted">{filteredItems.length} kandidat</span>
        </div>
        <div className="table-wrap">
          <Table className="saas-table">
            <TableHeader>
              <TableRow>
                <TableHead>Kandidat</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Lowongan</TableHead>
                <TableHead>Perusahaan</TableHead>
                <TableHead>Skor</TableHead>
                <TableHead>Update Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>{item.candidateName}</TableCell>
                  <TableCell>{item.candidateEmail}</TableCell>
                  <TableCell>{item.job?.title || "-"}</TableCell>
                  <TableCell>{item.job?.company || "-"}</TableCell>
                  <TableCell>
                    <span className="badge screening">{item.screeningScore ?? 0}</span>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={item.status}
                      onValueChange={(value) =>
                        mutation.mutate({
                          id: item._id,
                          status: value
                        })
                      }
                    >
                      <SelectTrigger className="input select-clean">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem value={s} key={s}>
                            {STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="action-ellipsis" type="button">
                        <FiMoreVertical />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/applications/${item._id}`}>Detail</Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="muted">
                    Belum ada kandidat di tahap {STATUS_LABELS[activeStatus]}.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </article>
    </section>
  );
}
