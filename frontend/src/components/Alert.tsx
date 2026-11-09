import type { ReactNode } from "react";

interface AlertProps {
  kind: "error" | "success" | "info";
  children: ReactNode;
  onClose?: () => void;
}

export default function Alert({ kind, children, onClose }: AlertProps) {
  return (
    <div className={`alert alert-${kind}`} role={kind === "error" ? "alert" : "status"}>
      <span>{children}</span>
      {onClose && (
        <button type="button" className="alert-close" onClick={onClose} aria-label="Dismiss">
          ×
        </button>
      )}
    </div>
  );
}
