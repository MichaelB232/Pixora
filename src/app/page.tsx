import type { Metadata } from "next";
import { HomeDashboard } from "@/components/home/HomeDashboard";

export const metadata: Metadata = {
  title: "PIXORA — Your Friendly Image Processing & Vision Studio",
  description:
    "A friendly, browser-based image studio guided by warm paper surfaces, soft terracotta actions, and accessible image processing tools.",
};

export default function HomePage() {
  return <HomeDashboard />;
}
