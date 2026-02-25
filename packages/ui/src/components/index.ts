export type ControlTier = "p0" | "p0_5" | "p1" | "p2";

export type ControlName =
  | "alert"
  | "button"
  | "checkbox"
  | "combobox"
  | "empty-state"
  | "form-field"
  | "input"
  | "modal"
  | "otp-pin-input"
  | "password-input"
  | "progress"
  | "radio"
  | "search-input"
  | "select"
  | "skeleton"
  | "spinner"
  | "switch"
  | "textarea"
  | "toast";

export interface ControlDescriptor {
  name: ControlName;
  tier: ControlTier;
  ready: boolean;
}

export const CONTROL_DESCRIPTORS: ControlDescriptor[] = [
  { name: "button", tier: "p0", ready: false },
  { name: "input", tier: "p0", ready: false },
  { name: "select", tier: "p0", ready: false },
  { name: "combobox", tier: "p0", ready: false },
  { name: "checkbox", tier: "p0", ready: false },
  { name: "radio", tier: "p0", ready: false },
  { name: "switch", tier: "p0", ready: false },
  { name: "modal", tier: "p0", ready: false },
  { name: "form-field", tier: "p0", ready: false },
  { name: "alert", tier: "p0", ready: false },
  { name: "progress", tier: "p0", ready: false },
  { name: "textarea", tier: "p0_5", ready: false },
  { name: "password-input", tier: "p0_5", ready: false },
  { name: "otp-pin-input", tier: "p0_5", ready: false },
  { name: "search-input", tier: "p0_5", ready: false },
  { name: "spinner", tier: "p0_5", ready: false },
  { name: "toast", tier: "p0_5", ready: false },
  { name: "empty-state", tier: "p0_5", ready: false },
  { name: "skeleton", tier: "p0_5", ready: false }
];
