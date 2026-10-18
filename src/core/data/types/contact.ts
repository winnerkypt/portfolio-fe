export interface ContactLine {
  readonly id: "email" | "phone" | "github" | "linkedin";
  readonly label: string;
  readonly text: string;
  readonly href: string;
  readonly external: boolean;
  readonly copyable: boolean;
}
