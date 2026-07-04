import type { Metadata } from "next";
import AboutClient from "./AboutClient";

export const metadata: Metadata = {
  title: "About Findy — Armenia's HoReCa Platform",
  description:
    "Findy is Armenia's first specialized platform that unites all HoReCa businesses in one place.",
};

export default function AboutPage() {
  return <AboutClient />;
}
