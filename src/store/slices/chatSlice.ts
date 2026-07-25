import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  suggestions?: BusinessSuggestion[];
  quickReplies?: string[];
  intent?: string;
}

export interface BusinessSuggestion {
  id: string;
  name: string;
  category: string;
  rating: number;
  city: string;
  shortDescription: string;
  slug: string;
  packageName?: string;
  price?: number;
  pax?: number;
  atmosphere?: string;
  location?: string;
  dishesHy?: string;
  dishesEn?: string;
  dishesRu?: string;
}

interface ChatState {
  isOpen: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  sessionId: string | null;
}

const initialState: ChatState = {
  isOpen: false,
  messages: [],
  isLoading: false,
  sessionId: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    toggleChat: (state) => { state.isOpen = !state.isOpen; },
    setOpen: (state, action: PayloadAction<boolean>) => { state.isOpen = action.payload; },
    addMessage: (state, action: PayloadAction<ChatMessage>) => { state.messages.push(action.payload); },
    setLoading: (state, action: PayloadAction<boolean>) => { state.isLoading = action.payload; },
    setSessionId: (state, action: PayloadAction<string>) => { state.sessionId = action.payload; },
    clearChat: (state) => { state.messages = []; state.sessionId = null; },
  },
});

export const { toggleChat, setOpen, addMessage, setLoading, setSessionId, clearChat } = chatSlice.actions;
export default chatSlice.reducer;
