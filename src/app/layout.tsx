import type { Metadata } from "next";
import "./globals.css";
import { profileImage } from "@/core/data/profile-image";
import { fontClassNames } from "@/core/libs/fonts";

const siteUrl = "https://kanyapat-portfolio.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Kanyapat Wittayamanitkul — Full Stack Engineer",
    template: "%s · Kanyapat Wittayamanitkul",
  },
  description:
    "Portfolio of Kanyapat Wittayamanitkul, a full stack engineer building web platforms end to end: Next.js front ends, Go and Laravel APIs, and CMS platforms.",
  keywords: [
    "Full Stack Engineer",
    "Software Engineer",
    "Next.js",
    "Golang",
    "Laravel",
    "Portfolio",
  ],
  authors: [{ name: "Kanyapat Wittayamanitkul" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Kanyapat Wittayamanitkul",
    title: "Kanyapat Wittayamanitkul — Full Stack Engineer",
    description:
      "Full stack engineer building web platforms end to end: Next.js, Go, Laravel, and CMS platforms.",
    images: [{ url: profileImage.src, width: profileImage.width, height: profileImage.height }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kanyapat Wittayamanitkul — Full Stack Engineer",
    description:
      "Full stack engineer building web platforms end to end: Next.js, Go, Laravel, and CMS platforms.",
    images: [profileImage.src],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={fontClassNames}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
