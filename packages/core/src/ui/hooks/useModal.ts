export interface UseModalState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export interface UseModalOptions {
  defaultOpen?: boolean;
}
