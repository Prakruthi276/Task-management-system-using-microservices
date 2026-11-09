import { useAuth } from "../features/auth/useAuth";
import SessionPanel from "../features/auth/SessionPanel";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Hello, {user?.name}</h1>
          <p className="muted">You are logged in. Tasks and users arrive in the next stages.</p>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2>Your profile</h2>
          <dl className="kv">
            <dt>Name</dt>
            <dd>{user?.name}</dd>
            <dt>Email</dt>
            <dd>{user?.email}</dd>
            <dt>Role</dt>
            <dd>{user?.role}</dd>
            <dt>Status</dt>
            <dd>{user?.status}</dd>
          </dl>
        </div>
        <SessionPanel />
      </div>
    </section>
  );
}
