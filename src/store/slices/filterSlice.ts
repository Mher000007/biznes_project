import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface FilterState {
  query: string;
  category: string;
  city: string;
  employeeCount: string;
  ratingMin: number;
  verifiedOnly: boolean;
  sortBy: "rating" | "newest" | "name" | "popular";
  page: number;
  viewMode: "grid" | "map";
}

const initialState: FilterState = {
  query: "",
  category: "",
  city: "",
  employeeCount: "",
  ratingMin: 0,
  verifiedOnly: false,
  sortBy: "popular",
  page: 1,
  viewMode: "grid",
};

const filterSlice = createSlice({
  name: "filters",
  initialState,
  reducers: {
    setQuery: (state, action: PayloadAction<string>) => { state.query = action.payload; state.page = 1; },
    setCategory: (state, action: PayloadAction<string>) => { state.category = action.payload; state.page = 1; },
    setCity: (state, action: PayloadAction<string>) => { state.city = action.payload; state.page = 1; },
    setEmployeeCount: (state, action: PayloadAction<string>) => { state.employeeCount = action.payload; state.page = 1; },
    setRatingMin: (state, action: PayloadAction<number>) => { state.ratingMin = action.payload; state.page = 1; },
    setVerifiedOnly: (state, action: PayloadAction<boolean>) => { state.verifiedOnly = action.payload; state.page = 1; },
    setSortBy: (state, action: PayloadAction<FilterState["sortBy"]>) => { state.sortBy = action.payload; },
    setPage: (state, action: PayloadAction<number>) => { state.page = action.payload; },
    setViewMode: (state, action: PayloadAction<"grid" | "map">) => { state.viewMode = action.payload; },
    resetFilters: () => initialState,
  },
});

export const { setQuery, setCategory, setCity, setEmployeeCount, setRatingMin, setVerifiedOnly, setSortBy, setPage, setViewMode, resetFilters } = filterSlice.actions;
export default filterSlice.reducer;
