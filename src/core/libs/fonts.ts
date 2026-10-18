import { Anuphan, Ranchers } from "next/font/google";
import localFont from "next/font/local";

export const googleSans = localFont({
  src: "../fonts/GoogleSans-latin.woff2",
  weight: "400 700",
  style: "normal",
  display: "swap",
  variable: "--font-body",
});

export const ranchers = Ranchers({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-display",
});

export const anuphan = Anuphan({
  subsets: ["thai"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-thai",
});

export const fontFamilies = {
  body: googleSans.style.fontFamily,
  display: ranchers.style.fontFamily,
  thai: anuphan.style.fontFamily,
} as const;

export const fontClassNames = `${googleSans.variable} ${ranchers.variable} ${anuphan.variable}`;
