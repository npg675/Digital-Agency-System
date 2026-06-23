import { create } from 'zustand';

export interface Section {
  id: string;
  type: string;
  config: any;
  order: number;
}

export interface PageSettings {
  gtm_id?: string | null;
  fb_pixel_id?: string | null;
  tiktok_pixel_id?: string | null;
  ga4_id?: string | null;
  webhook_url?: string | null;
  mailchimp_api_key?: string | null;
  mailchimp_server_prefix?: string | null;
  mailchimp_list_id?: string | null;
  custom_domain?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  meta_keywords?: string | null;
  target_keyword?: string | null;
  client_id?: string | null;
  campaign_id?: string | null;
  client_phone?: string | null;
  enable_cookie_consent?: boolean;
  privacy_policy_url?: string;
  tos_url?: string;
  autoresponder_subject?: string | null;
  autoresponder_body?: string | null;
  default_sequence_id?: string | null;
}

interface EditorState {
  pageId: string | null;
  pageName: string;
  pageSlug: string;
  pageStatus: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'PENDING_APPROVAL';
  pageSettings: PageSettings;
  sections: Section[];
  activeSectionId: string | null;
  isSaving: boolean;
  setPageId: (id: string | null) => void;
  setPageMeta: (name: string, slug: string, status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'PENDING_APPROVAL') => void;
  setPageSettings: (settings: PageSettings) => void;
  setSections: (sections: Section[]) => void;
  addSection: (section: Section) => void;
  duplicateSection: (id: string) => void;
  updateSection: (id: string, config: any) => void;
  removeSection: (id: string) => void;
  reorderSections: (startIndex: number, endIndex: number) => void;
  setActiveSection: (id: string | null) => void;
  setPageStatus: (status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'PENDING_APPROVAL') => void;
  setIsSaving: (v: boolean) => void;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (v: boolean) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  pageId: null,
  pageName: '',
  pageSlug: '',
  pageStatus: 'DRAFT',
  pageSettings: {},
  sections: [],
  activeSectionId: null,
  isSaving: false,
  hasUnsavedChanges: false,

  setPageId: (id) => set({ pageId: id }),
  setPageMeta: (name, slug, status) => set({ pageName: name, pageSlug: slug, pageStatus: status }),
  setPageSettings: (settings) => set({ pageSettings: settings, hasUnsavedChanges: true }),
  setSections: (sections) => set({ sections: sections.sort((a, b) => a.order - b.order) }),

  addSection: (section) => set((state) => ({
    sections: [...state.sections, section].map((s, i) => ({ ...s, order: i })),
    hasUnsavedChanges: true
  })),

  duplicateSection: (id) => set((state) => {
    const idx = state.sections.findIndex((s) => s.id === id);
    if (idx === -1) return state;
    const original = state.sections[idx];
    const copy: Section = {
      ...original,
      id: crypto.randomUUID(),
      config: JSON.parse(JSON.stringify(original.config)),
    };
    const newSections = [...state.sections];
    newSections.splice(idx + 1, 0, copy);
    return { sections: newSections.map((s, i) => ({ ...s, order: i })), hasUnsavedChanges: true };
  }),

  updateSection: (id, config) => set((state) => ({
    sections: state.sections.map((s) => s.id === id ? { ...s, config } : s),
    hasUnsavedChanges: true
  })),

  removeSection: (id) => set((state) => ({
    sections: state.sections.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i })),
    activeSectionId: state.activeSectionId === id ? null : state.activeSectionId,
    hasUnsavedChanges: true
  })),

  reorderSections: (startIndex, endIndex) => set((state) => {
    const result = Array.from(state.sections);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return { sections: result.map((s, i) => ({ ...s, order: i })), hasUnsavedChanges: true };
  }),

  setActiveSection: (id) => set({ activeSectionId: id }),
  setPageStatus: (status) => set({ pageStatus: status }),
  setIsSaving: (v) => set({ isSaving: v }),
  setHasUnsavedChanges: (v) => set({ hasUnsavedChanges: v }),
}));
