import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UserProfile {
  id: string;
  telegramId: string;
  username: string;
  firstName: string;
  lastName: string;
  walletAddress: string | null;
  kiosk: any;
  m3rBalance: any;
  userBalance: any;
  createdAt: string;
  updatedAt: string;
}

export interface UserState {
  isLoading: boolean;
  error: string | null;
  profile: UserProfile | null;
  inventory: any[] | null;
}

const initialState: UserState = {
  isLoading: false,
  error: null,
  profile: null,
  inventory: null,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearUser: (state) => {
      state.profile = null;
      state.inventory = null;
      state.error = null;
    },
    updateUserProfile: (state, action: PayloadAction<any>) => {
      state.profile = action.payload;
    },
    updateUserInventory: (state, action: PayloadAction<any[]>) => {
      state.inventory = action.payload;
    },
  },
});

export const { clearUser, updateUserProfile, updateUserInventory } =
  userSlice.actions;

export default userSlice.reducer;
