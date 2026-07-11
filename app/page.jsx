"use client";
import dynamicImport from "next/dynamic";

const HomeClient = dynamicImport(() => import("./HomeClient"), { ssr: false });

export default function Page() {
  return <HomeClient />;
}
