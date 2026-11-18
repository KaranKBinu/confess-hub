import type { Metadata } from "next";
import ProfileClient from "@/components/ProfileClient";

export const metadata: Metadata = {
  title: "Your profile — Confess-Hub",
  description: "Manage your username and how you appear in comments.",
};

export default function ProfilePage() {
  return <ProfileClient />;
}