import { configureStore } from "@reduxjs/toolkit";
import filterReducer from "./slices/filterSlice";
import uiReducer from "./slices/uiSlice";
import chatReducer from "./slices/chatSlice";

export const store = configureStore({
  reducer: {
    filters: filterReducer,
    ui: uiReducer,
    chat: chatReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
