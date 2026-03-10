import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { FiBriefcase, FiFileText, FiTrendingUp, FiBarChart2 } from "react-icons/fi";

export function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin");
  const isRootPage = location.pathname === "/";
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  return (
    <div className={`app-shell ${isAdminPage ? "admin-shell" : ""}`}>
      <aside className="sidebar">
        <div className="brand-block">
          <p className="brand-kicker">MERN Skill Test</p>
          <h1>Dasbor</h1>
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
          <NavLink to="/" end className={() => (isRootPage ? "side-link active" : "side-link")}>
            <span className="side-icon" aria-hidden="true">
              <FiBriefcase />
            </span>
            <span className="side-label">Manajemen Lowongan</span>
          </NavLink>
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
          <NavLink
            to="/applications/pipeline"
            className={({ isActive }) => (isActive ? "side-link active" : "side-link")}
          >
            <span className="side-icon" aria-hidden="true">
              <FiTrendingUp />
            </span>
            <span className="side-label">Pipeline Lamaran</span>
          </NavLink>
        </nav>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="topbar-title">
            <h2>{isAdminPage ? "Selamat datang, Admin" : `Selamat datang, ${user?.role}`}</h2>
            <p className="muted">
              {isAdminPage
                ? "Kelola performa rekrutmen dan pantau insight operasional."
                : "Kelola lowongan dan pantau proses rekrutmen."}
            </p>
          </div>
          <div className="topbar-actions">
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
                <span className="user-email">{user?.email}</span>
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

