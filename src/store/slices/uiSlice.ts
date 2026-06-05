import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UIState {
  theme: "light" | "dark";
  mobileMenuOpen: boolean;
}

const initialState: UIState = {
  theme: "light",
  mobileMenuOpen: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<"light" | "dark">) => { state.theme = action.payload; },
    toggleTheme: (state) => { state.theme = state.theme === "light" ? "dark" : "light"; },
    setMobileMenuOpen: (state, action: PayloadAction<boolean>) => { state.mobileMenuOpen = action.payload; },
  },
});

export const { setTheme, toggleTheme, setMobileMenuOpen } = uiSlice.actions;
export default uiSlice.reducer;
