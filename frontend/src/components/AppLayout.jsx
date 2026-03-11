import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { FiBriefcase, FiFileText, FiTrendingUp, FiBarChart2, FiUsers } from "react-icons/fi";

export function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin");
  const isRootPage = location.pathname === "/";
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
            <NavLink
              to="/admin"
              className={({ isActive }) => (isActive ? "side-link active" : "side-link")}
            >
              <span className="side-icon" aria-hidden="true">
                <FiBarChart2 />
              </span>
              Analitik Admin
            </NavLink>
          )}
          <NavLink
            to="/applications"
            end
            className={({ isActive }) => (isActive ? "side-link active" : "side-link")}
          >
            <span className="side-icon" aria-hidden="true">
              <FiFileText />
            </span>
            <span className="side-label">Manajemen Lamaran</span>
          </NavLink>
          <NavLink to="/" end className={() => (isRootPage ? "side-link active" : "side-link")}>
            <span className="side-icon" aria-hidden="true">
              <FiBriefcase />
            </span>
            <span className="side-label">Manajemen Lowongan</span>
          </NavLink>
          <NavLink
            to="/applications/pipeline"
            className={({ isActive }) => (isActive ? "side-link active" : "side-link")}
          >
            <span className="side-icon" aria-hidden="true">
              <FiTrendingUp />
            </span>
            <span className="side-label">Pipeline Lamaran</span>
          </NavLink>
          {user?.role === "admin" && (
            <NavLink
              to="/admin/users"
              className={({ isActive }) => (isActive ? "side-link active" : "side-link")}
            >
              <span className="side-icon" aria-hidden="true">
                <FiUsers />
              </span>
              Manajemen Users
            </NavLink>
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
            <button
              type="button"
              className="sidebar-toggle"
              aria-label="Toggle menu"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
            >
              <span />
              <span />
              <span />
            </button>
            <div
              className={`user-menu ${isUserMenuOpen ? "open" : ""}`}
              tabIndex={0}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setIsUserMenuOpen(false);
                }
              }}
            >
              <button
                type="button"
                className="user-trigger"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
              >
                <span className="user-avatar" aria-hidden="true">
                  {user?.name?.trim()?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                </span>
                <span className="user-meta">
                  <span className="user-name">{user?.name || "User"}</span>
                  <span className="user-email">{user?.email}</span>
                </span>
                <span className="user-caret" aria-hidden="true">
                  v
                </span>
              </button>
              <div className="user-dropdown" role="menu">
                <button
                  type="button"
                  className="user-dropdown-item"
                  onClick={() => void logout()}
                >
                  Keluar
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="content-wrap">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
