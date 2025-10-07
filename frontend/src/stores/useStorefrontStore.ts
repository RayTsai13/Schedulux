import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Storefront Store - Manages currently selected storefront
 *
 * This store tracks which storefront the vendor is currently working with.
 * Persists to localStorage so selection survives page refreshes.
 *
 * Usage:
 * const { selectedStorefrontId, setSelectedStorefront } = useStorefrontStore();
 */

interface StorefrontStore {
  // Currently selected storefront ID (null if none selected)
  selectedStorefrontId: number | null;

  // Set the currently selected storefront
  setSelectedStorefront: (id: number | null) => void;

  // Clear the selection
  clearSelection: () => void;
}

export const useStorefrontStore = create<StorefrontStore>()(
  persist(
    (set) => ({
      selectedStorefrontId: null,

      setSelectedStorefront: (id) => set({ selectedStorefrontId: id }),

      clearSelection: () => set({ selectedStorefrontId: null }),
    }),
    {
      name: 'schedulux-storefront', // localStorage key
    }
  )
);
