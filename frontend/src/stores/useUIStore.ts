import { create } from 'zustand';

/**
 * UI Store - Manages global UI state
 *
 * This store tracks ephemeral UI state like modals, sidebars, and dialogs.
 * Does NOT persist to localStorage (resets on page refresh).
 *
 * Usage:
 * const { isCreateModalOpen, openCreateModal } = useUIStore();
 */

type ModalType =
  | 'createAppointment'
  | 'editAppointment'
  | 'createStorefront'
  | 'editStorefront'
  | 'createService'
  | 'editService'
  | 'createClient'
  | null;

interface UIStore {
  // Active modal (null if no modal open)
  activeModal: ModalType;

  // Data passed to the modal (e.g., appointment ID for edit modal)
  modalData: any;

  // Sidebar state
  isSidebarOpen: boolean;

  // Loading overlay (for global operations)
  isGlobalLoading: boolean;
  globalLoadingMessage: string;

  // Actions
  openModal: (modal: ModalType, data?: any) => void;
  closeModal: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setGlobalLoading: (isLoading: boolean, message?: string) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  activeModal: null,
  modalData: null,
  isSidebarOpen: true,
  isGlobalLoading: false,
  globalLoadingMessage: '',

  openModal: (modal, data = null) =>
    set({ activeModal: modal, modalData: data }),

  closeModal: () => set({ activeModal: null, modalData: null }),

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),

  setGlobalLoading: (isLoading, message = 'Loading...') =>
    set({ isGlobalLoading: isLoading, globalLoadingMessage: message }),
}));
