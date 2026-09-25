import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { loadPersisted } from "../../lib/persist";
import type { User } from "../../types/user";

interface AuthState {
  user: User | null;
}

const initialState: AuthState = { user: loadPersisted<User | null>("session", null) };

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    updateProfile: (state, action: PayloadAction<Partial<Pick<User, "fullName" | "email">>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    clearSession: (state) => {
      state.user = null;
    },
  },
});

export const { setSession, updateProfile, clearSession } = authSlice.actions;
export default authSlice.reducer;

export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.user !== null;
