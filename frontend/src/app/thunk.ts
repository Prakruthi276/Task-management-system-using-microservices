import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "./store";
import type { ApiErrorInfo } from "../utils/errors";

// One typed version of createAsyncThunk for the whole app:
// every thunk can read the state, and every rejection carries an ApiErrorInfo.
export const createAppThunk = createAsyncThunk.withTypes<{
  state: RootState;
  rejectValue: ApiErrorInfo;
}>();
