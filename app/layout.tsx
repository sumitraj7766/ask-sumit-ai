import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AskSumit AI",
  description: "Personal AI Agent of Sumit Kumar",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}