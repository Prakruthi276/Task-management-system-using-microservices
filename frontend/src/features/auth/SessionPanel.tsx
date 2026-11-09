import { useEffect, useState } from "react";
import Alert from "../../components/Alert";
import { refreshSession } from "../../api/http";
import { useAppSelector } from "../../app/hooks";
import { toErrorInfo } from "../../utils/errors";
import { decodeJwt } from "../../utils/jwt";

// A testing aid: shows what is inside the access token, counts down to its expiry,
// and lets you trigger a refresh by hand to watch the refresh cookie rotate.
export default function SessionPanel() {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const claims = accessToken ? decodeJwt(accessToken) : null;

  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  // A timer that ticks every second. The cleanup stops it when the component goes away.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const secondsLeft = claims?.exp ? Math.max(0, Math.round(claims.exp - now / 1000)) : null;

  const onRefresh = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await refreshSession();
      setMessage({ kind: "success", text: "Refreshed. You have a new access token and a new refresh cookie." });
    } catch (err) {
      setMessage({ kind: "error", text: toErrorInfo(err).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h2>Session</h2>
      <p className="muted small">
        The access token lives only in memory. The refresh token is in an httpOnly cookie that
        JavaScript cannot read.
      </p>

      {message && <Alert kind={message.kind}>{message.text}</Alert>}

      <dl className="kv">
        <dt>User id (sub)</dt>
        <dd>{claims?.sub ?? "-"}</dd>
        <dt>Role</dt>
        <dd>{claims?.role ?? "-"}</dd>
        <dt>Session id (sid)</dt>
        <dd>{claims?.sid ?? "-"}</dd>
        <dt>Access token expires in</dt>
        <dd>{secondsLeft === null ? "-" : secondsLeft > 0 ? `${secondsLeft} seconds` : "Expired"}</dd>
      </dl>

      <button className="btn" onClick={() => void onRefresh()} disabled={busy}>
        {busy ? "Refreshing..." : "Refresh now"}
      </button>
    </div>
  );
}
