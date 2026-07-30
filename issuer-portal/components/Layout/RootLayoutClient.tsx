"use client";

import type { PropsWithChildren } from "react";

import { usePathname } from "next/navigation";

import IssuerChatbot from "@/components/chat-bot/IssuerChatbot";

import Layout from "./Layout";

const RootLayoutClient = ({ children }: PropsWithChildren) => {
  const pathname = usePathname();

  // Don't show navbar on login page
  const showNavBar = !pathname.startsWith("/login");

  return (
    <>
      <Layout navBar={showNavBar}>{children}</Layout>
      {showNavBar ? <IssuerChatbot /> : null}
    </>
  );
};

export default RootLayoutClient;
