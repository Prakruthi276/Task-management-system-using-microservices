import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAppDispatch } from "../app/hooks";
import { logout } from "../features/auth/authSlice";
import { useAuth } from "../features/auth/useAuth";
import { RoleBadge } from "./Badges";

export default function Layout() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const onLogout = async () => {
    setLoggingOut(true);
    await dispatch(logout());
    // The auth state is now empty, so ProtectedRoute sends the user to the login page
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <span className="brand">Task Manager</span>
          <nav>
            <NavLink to="/" end>
              Home
            </NavLink>
          </nav>
          <div className="topbar-user">
            <span>{user?.name}</span>
            {user && <RoleBadge role={user.role} />}
            <button className="btn btn-small" onClick={() => void onLogout()} disabled={loggingOut}>
              {loggingOut ? "Logging out..." : "Log out"}
            </button>
          </div>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
