import { useAppSelector } from "../../app/hooks";

// A small custom hook: components ask "who is logged in?" without knowing about Redux
export function useAuth() {
  const user = useAppSelector((state) => state.auth.user);
  const initialized = useAppSelector((state) => state.auth.initialized);
  return {
    user,
    initialized,
    isAuthenticated: user !== null,
    isAdmin: user?.role === "ADMIN",
  };
}
