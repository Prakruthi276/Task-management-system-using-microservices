import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Alert from "../../components/Alert";
import { useAppDispatch } from "../../app/hooks";
import { toErrorInfo } from "../../utils/errors";
import { register } from "./authSlice";
import { FieldErrors, validateRegister } from "./validation";

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setServerError(null);

    const found = validateRegister(name, email, password);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      // unwrap() turns a rejected thunk into a thrown error, so we can use try/catch
      await dispatch(register({ name: name.trim(), email: email.trim(), password })).unwrap();
      // Register does not log the user in. Send them to the login page.
      navigate("/login", { replace: true, state: { registered: true, email: email.trim() } });
    } catch (err) {
      const info = toErrorInfo(err);
      setErrors(info.fieldErrors);
      setServerError(info.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={onSubmit} noValidate>
        <h1>Create your account</h1>
        <p className="muted">New accounts start as employees.</p>

        {serverError && <Alert kind="error">{serverError}</Alert>}

        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>

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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span className="hint">8 to 72 characters, with a letter and a number.</span>
          {errors.password && <span className="field-error">{errors.password}</span>}
        </div>

        <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
          {submitting ? "Creating account..." : "Create account"}
        </button>

        <p className="muted center">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
