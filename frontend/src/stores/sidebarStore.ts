import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  isCollapsed: boolean;
  expandedHubs: string[];
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
  toggleHub: (hubId: string) => void;
  expandHub: (hubId: string) => void;
  collapseHub: (hubId: string) => void;
  collapseAllHubs: () => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isCollapsed: false,
      expandedHubs: ['intelligence'], // Default expanded hub
      
      setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
      
      toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
      
      toggleHub: (hubId) => set((state) => ({
        expandedHubs: state.expandedHubs.includes(hubId)
          ? state.expandedHubs.filter((id) => id !== hubId)
          : [...state.expandedHubs, hubId],
      })),
      
      expandHub: (hubId) => set((state) => ({
        expandedHubs: state.expandedHubs.includes(hubId)
          ? state.expandedHubs
          : [...state.expandedHubs, hubId],
      })),
      
      collapseHub: (hubId) => set((state) => ({
        expandedHubs: state.expandedHubs.filter((id) => id !== hubId),
      })),
      
      collapseAllHubs: () => set({ expandedHubs: [] }),
    }),
    {
      name: 'sidebar-storage',
    }
  )
);
