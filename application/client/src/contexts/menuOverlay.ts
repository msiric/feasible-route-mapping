import create, { GetState, SetState } from "zustand";

export interface MenuOverlayState {
  visible: boolean;
}

export interface MenuOverlayActions {
  showMenuOverlay: () => void;
  hideMenuOverlay: () => void;
  toggleMenuOverlay: () => void;
  resetMenuOverlay: () => void;
}

export type MenuOverlayContext = MenuOverlayState & MenuOverlayActions;

export const AUTO_HIDE_MENU_WIDTH = 750;

const initialState: MenuOverlayState = {
  visible: true,
};

const initState = () => ({
  ...initialState,
});

const initActions = (
  set: SetState<MenuOverlayContext>,
  get: GetState<MenuOverlayContext>
) => ({
  showMenuOverlay: () => {
    set({ visible: true });
  },
  hideMenuOverlay: () => {
    set({ visible: false });
  },
  toggleMenuOverlay: () => {
    const isVisible = get().visible;
    set({ visible: !isVisible });
  },
  resetMenuOverlay: () => {
    set({ ...initialState });
  },
});

export const useMenuOverlay = create<MenuOverlayContext>((set, get) => ({
  ...initState(),
  ...initActions(set, get),
}));
