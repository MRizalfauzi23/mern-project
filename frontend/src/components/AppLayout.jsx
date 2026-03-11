"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../features/auth/AuthContext";
import { FiBriefcase, FiFileText, FiTrendingUp, FiBarChart2, FiUsers } from "react-icons/fi";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";

export function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith("/admin");
  const isRootPage = pathname === "/";
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const linkClass = (active) => (active ? "side-link active" : "side-link");
  const isActivePath = (target) => pathname === target;
  const isActivePrefix = (target) => pathname.startsWith(target);
  const isApplicationsActive =
    pathname === "/applications" ||
    (pathname.startsWith("/applications/") && !pathname.startsWith("/applications/pipeline"));
  const isJobsActive = isRootPage || pathname.startsWith("/jobs/");
  return (
    <div
      className={`app-shell ${isAdminPage ? "admin-shell" : ""} ${
        isSidebarOpen ? "sidebar-open" : ""
      }`}
    >
      {isSidebarOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Tutup menu"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <aside className="sidebar">
        <div className="brand-block">
          <p className="brand-kicker">Pantau Lowongan Kerja</p>
          <h1>Admin Panel</h1>
        </div>
        <nav className="side-nav">
          {user?.role === "admin" && (
            <Link href="/admin" className={linkClass(isActivePath("/admin"))}>
              <span className="side-icon" aria-hidden="true">
                <FiBarChart2 />
              </span>
              Analitik Admin
            </Link>
          )}
          <Link href="/applications" className={linkClass(isApplicationsActive)}>
            <span className="side-icon" aria-hidden="true">
              <FiFileText />
            </span>
            <span className="side-label">Manajemen Lamaran</span>
          </Link>
          <Link href="/" className={linkClass(isJobsActive)}>
            <span className="side-icon" aria-hidden="true">
              <FiBriefcase />
            </span>
            <span className="side-label">Manajemen Lowongan</span>
          </Link>
          <Link
            href="/applications/pipeline"
            className={linkClass(isActivePrefix("/applications/pipeline"))}
          >
            <span className="side-icon" aria-hidden="true">
              <FiTrendingUp />
            </span>
            <span className="side-label">Pipeline Lamaran</span>
          </Link>
          {user?.role === "admin" && (
            <Link href="/admin/users" className={linkClass(isActivePrefix("/admin/users"))}>
              <span className="side-icon" aria-hidden="true">
                <FiUsers />
              </span>
              Manajemen Users
            </Link>
          )}
        </nav>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="topbar-title">
            {/* <h2>{isAdminPage ? "Selamat datang, Admin" : `Selamat datang, ${user?.role}`}</h2>
            <p className="muted">
              {isAdminPage
                ? "Kelola performa rekrutmen dan pantau insight operasional."
                : "Kelola lowongan dan pantau proses rekrutmen."}
            </p> */}
          </div>
          <div className="topbar-actions">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="sidebar-toggle"
              aria-label="Toggle menu"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
            >
              <span />
              <span />
              <span />
            </Button>
            <DropdownMenu>
            <DropdownMenuTrigger className="user-trigger clean-btn" type="button">
                <Avatar className="user-avatar">
                  <AvatarFallback>
                    {user?.name?.trim()?.[0]?.toUpperCase() ||
                      user?.email?.[0]?.toUpperCase() ||
                      "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="user-meta">
                  <span className="user-name">{user?.name || "User"}</span>
                  <span className="user-email">{user?.email}</span>
                </span>
                <span className="user-caret" aria-hidden="true">
                  v
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => void logout()}>Keluar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="content-wrap">
          {children}
        </main>
      </div>
    </div>
  );
}
