import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UIState {
  theme: "light" | "dark";
  mobileMenuOpen: boolean;
  showStories: boolean;
}

const initialState: UIState = {
  theme: "light",
  mobileMenuOpen: false,
  showStories: true,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<"light" | "dark">) => { state.theme = action.payload; },
    toggleTheme: (state) => { state.theme = state.theme === "light" ? "dark" : "light"; },
    setMobileMenuOpen: (state, action: PayloadAction<boolean>) => { state.mobileMenuOpen = action.payload; },
    toggleStories: (state) => { state.showStories = !state.showStories; },
    setShowStories: (state, action: PayloadAction<boolean>) => { state.showStories = action.payload; },
  },
});

export const { setTheme, toggleTheme, setMobileMenuOpen, toggleStories, setShowStories } = uiSlice.actions;
export default uiSlice.reducer;
