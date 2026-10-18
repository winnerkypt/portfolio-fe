import type { ContactLine } from "./types/contact";

export const contactLines: readonly ContactLine[] = [
  {
    id: "email",
    label: "Email",
    text: "kanyapat.witta@gmail.com",
    href: "mailto:kanyapat.witta@gmail.com",
    external: false,
    copyable: true,
  },
  {
    id: "phone",
    label: "Phone",
    text: "090-595-3589",
    href: "tel:0905953589",
    external: false,
    copyable: false,
  },
  {
    id: "github",
    label: "GitHub",
    text: "winnerkypt",
    href: "https://github.com/winnerkypt",
    external: true,
    copyable: false,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    text: "Kanyapat Wittayamanitkul",
    href: "https://www.linkedin.com/in/kanyapat-wittayamanitkul-5935011a0/",
    external: true,
    copyable: false,
  },
];
