import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  role: string;
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
  phone_number?: string | null;
  can_manage_users?: boolean;
  ai_provider?: string;
  ai_model?: string;
  openai_key?: string | null;
  gemini_api_key?: string | null;
  heygen_api_key?: string | null;
  synthesia_api_key?: string | null;
  runway_api_key?: string | null;
  google_video_api_key?: string | null;
  client_can_generate_ads?: boolean;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
