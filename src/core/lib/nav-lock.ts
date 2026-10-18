export const SCROLL_IDLE_MS = 160;
export const CLICK_FALLBACK_MS = 900;

interface NavLockState {
  readonly id: string | null;
}

type NavLockAction = { readonly type: "click"; readonly id: string } | { readonly type: "release" };

export function navLockReducer(state: NavLockState, action: NavLockAction): NavLockState {
  return action.type === "click" ? { id: action.id } : { ...state, id: null };
}

export interface NavLock {
  click: (id: string) => void;
  scroll: () => void;
  id: () => string | null;
  dispose: () => void;
}

export function createNavLock(onRelease: () => void): NavLock {
  let state: NavLockState = { id: null };
  let timer: ReturnType<typeof setTimeout> | undefined;

  const arm = (ms: number) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      state = navLockReducer(state, { type: "release" });
      onRelease();
    }, ms);
  };

  return {
    click: (id) => {
      state = navLockReducer(state, { type: "click", id });
      arm(CLICK_FALLBACK_MS);
    },
    scroll: () => {
      if (state.id !== null) arm(SCROLL_IDLE_MS);
    },
    id: () => state.id,
    dispose: () => clearTimeout(timer),
  };
}
