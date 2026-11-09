import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createAppThunk } from "../../app/thunk";
import { refreshSession, SessionPayload } from "../../api/http";
import { parseApiError } from "../../utils/errors";
import type { User } from "../../types";
import { authApi, LoginBody, RegisterBody } from "./authApi";

interface AuthState {
  user: User | null;
  accessToken: string | null; // kept in memory only, never in localStorage
  initialized: boolean; // true after the first refresh attempt when the page loads
  loading: boolean;
  error: string | null;
  notice: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  initialized: false,
  loading: false,
  error: null,
  notice: null,
};

// On page load the access token is gone from memory, but the httpOnly cookie is still there.
// Calling refresh brings the session back.
export const bootstrapSession = createAppThunk("auth/bootstrap", async (_: void, { rejectWithValue }) => {
  try {
    return await refreshSession();
  } catch (err) {
    return rejectWithValue(parseApiError(err));
  }
});

export const login = createAppThunk("auth/login", async (body: LoginBody, { rejectWithValue }) => {
  try {
    return await authApi.login(body);
  } catch (err) {
    return rejectWithValue(parseApiError(err));
  }
});

export const register = createAppThunk("auth/register", async (body: RegisterBody, { rejectWithValue }) => {
  try {
    return await authApi.register(body);
  } catch (err) {
    return rejectWithValue(parseApiError(err));
  }
});

export const logout = createAppThunk("auth/logout", async (_: void) => {
  try {
    await authApi.logout();
  } catch {
    // Even if the server can't be reached, the user is logged out on this device
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Dispatched after every successful refresh (page load, or the Refresh now button)
    sessionRefreshed(state, action: PayloadAction<SessionPayload>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
    },
    clearMessages(state) {
      state.error = null;
      state.notice = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapSession.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.initialized = true;
      })
      .addCase(bootstrapSession.rejected, (state) => {
        state.initialized = true;
      })
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.notice = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message ?? "Login failed. Please try again.";
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.notice = null;
      });
  },
});

export const { sessionRefreshed, clearMessages } = authSlice.actions;
export default authSlice.reducer;
