import { FormEvent, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Alert from "../../components/Alert";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { login } from "./authSlice";
import { FieldErrors, validateLogin } from "./validation";

interface LoginLocationState {
  registered?: boolean;
  email?: string;
}

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const state = location.state as LoginLocationState | null;
  const { loading, error, notice } = useAppSelector((s) => s.auth);

  const [email, setEmail] = useState(state?.email ?? "");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const found = validateLogin(email, password);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    // On success the auth state changes, and PublicOnlyRoute redirects to the right page
    void dispatch(login({ email: email.trim(), password }));
  };

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={onSubmit} noValidate>
        <h1>Welcome back</h1>
        <p className="muted">Log in to manage your tasks.</p>

        {state?.registered && <Alert kind="success">Account created. Please log in.</Alert>}
        {notice && <Alert kind="info">{notice}</Alert>}
        {error && <Alert kind="error">{error}</Alert>}

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errors.password && <span className="field-error">{errors.password}</span>}
        </div>

        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </button>

        <p className="muted center">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </div>
  );
}
