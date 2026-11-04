import { create } from 'zustand';

// Ephemeral UI state survives role/shared-route layout remounts. It is scoped to
// the signed-in account and role, and is never written to browser storage.
export const EMPTY_NAV_GROUPS = Object.freeze({});
export const useWorkspaceNavigationStore = create(set => ({
  workspaces: {},
  rememberScroll: (scope, mode, top) => set(state => {
    const current = state.workspaces[scope] || {};
    const value = Math.max(0, Number(top) || 0);
    if (current.scroll?.[mode] === value) return state;
    return { workspaces: { ...state.workspaces, [scope]: { ...current, scroll: { ...current.scroll, [mode]: value } } } };
  }),
  setGroupClosed: (scope, label, closed) => set(state => {
    const current = state.workspaces[scope] || {};
    return { workspaces: { ...state.workspaces, [scope]: { ...current, closedGroups: { ...current.closedGroups, [label]: closed } } } };
  }),
}));
