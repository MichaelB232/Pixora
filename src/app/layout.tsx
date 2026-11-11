import type { Metadata } from "next";
import "./globals.css";
import { StudioProvider } from "@/lib/image-processing/context";

export const metadata: Metadata = {
  title: "PIXORA",
  description: "Advanced Image Processing & Computer Vision Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#FAF7F2] text-[#2D2623] min-h-screen selection:bg-[#F4D4CD] selection:text-[#863422]">
        <StudioProvider>{children}</StudioProvider>
      </body>
    </html>
  );
}
