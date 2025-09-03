import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { clearAddressMemoryCache } from "../hooks/useAccount";
import storage from "./storage";

export interface AppContextState {
  initialized: boolean;
  authed: boolean;
  walletId: string;
  accountId: string;
  networkId: string;
  appMode: AppMode;
  tabMode: TabMode;
  suiPrice: number;
  biometricDismissed: boolean;
}

export enum AppMode {
  GAMES = "games",
  WALLET = "wallet",
}

export enum TabMode {
  HOME = "home",
  PLAY = "play",
  SHOP = "shop",
  MARKET = "market",
  BAG = "bag",
}

const initialState: AppContextState = {
  initialized: false,
  authed: false,
  walletId: "",
  accountId: "",
  networkId: "mainnet",
  appMode: AppMode.GAMES,
  tabMode: TabMode.HOME,
  biometricDismissed: false,
  suiPrice: 0,
};

// thunks
export const resetAppContext = createAsyncThunk(
  "appContext/reset",
  async (_, thunkApi) => {
    // memory clear
    await thunkApi.dispatch(updateInitialized(false));
    await thunkApi.dispatch(updateAuthed(false));
    await thunkApi.dispatch(updateAccountId(""));
    await thunkApi.dispatch(updateWalletId(""));
    await thunkApi.dispatch(updateNetworkId("mainnet"));
    await thunkApi.dispatch(updateAppMode(AppMode.GAMES));
    await thunkApi.dispatch(updateTabMode(TabMode.HOME));
    await storage.clear();
    clearAddressMemoryCache();
  }
);

export const appContextSlice = createSlice({
  name: "appContext",
  initialState,
  reducers: {
    updateInitialized(state, action: PayloadAction<boolean>) {
      state.initialized = action.payload;
    },
    updateAuthed(state, action: PayloadAction<boolean>) {
      state.authed = action.payload;
    },
    updateWalletId(state, action: PayloadAction<string>) {
      state.walletId = action.payload;
    },
    updateAccountId(state, action: PayloadAction<string>) {
      state.accountId = action.payload;
    },
    updateNetworkId(state, action: PayloadAction<string>) {
      state.networkId = action.payload;
    },
    updateBiometricDismissed(state, action: PayloadAction<boolean>) {
      state.biometricDismissed = action.payload;
    },
    updateAppMode(state, action: PayloadAction<AppMode>) {
      state.appMode = action.payload;
    },
    updateTabMode(state, action: PayloadAction<TabMode>) {
      state.tabMode = action.payload;
    },
    updateSuiPrice(state, action: PayloadAction<number>) {
      state.suiPrice = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(resetAppContext.fulfilled, () => {});
  },
});

export const {
  updateInitialized,
  updateAuthed,
  updateWalletId,
  updateAccountId,
  updateNetworkId,
  updateBiometricDismissed,
  updateAppMode,
  updateTabMode,
  updateSuiPrice,
} = appContextSlice.actions;

export default appContextSlice.reducer;
