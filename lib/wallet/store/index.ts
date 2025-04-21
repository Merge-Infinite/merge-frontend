"use client";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
} from "redux-persist/es/constants";
import appContextReducer from "./app-context";
import biometricContextReducer from "./biometric-context";
import featureFlagReducer from "./feature-flag";
import { ChromeStorage } from "./storage";
import userReducer from "./user";
const isClient = typeof window !== "undefined";

const persistConfig = {
  key: "root",
  storage: new ChromeStorage(),
  whitelist: ["appContext", "featureFlag", "user"],
};

const allReducers = combineReducers({
  appContext: appContextReducer,
  biometricContext: biometricContextReducer,
  featureFlag: featureFlagReducer,
  user: userReducer,
});

function createStore() {
  const reducer = isClient
    ? persistReducer(persistConfig, allReducers)
    : allReducers;
  const store = configureStore({
    reducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }),
  });
  const persistorStore = persistStore(store);
  return { store, persistorStore };
}

let storeInstance: ReturnType<typeof createStore> | undefined = undefined;

export function getStore() {
  if (typeof window === "undefined" && !storeInstance) {
    // Server-side, always create a fresh store
    return createStore();
  }

  // Client-side, create the store once and reuse it
  if (!storeInstance) {
    storeInstance = createStore();
  }

  return storeInstance;
}

export const { store, persistorStore } = getStore();
window.persistorStore = persistorStore;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
