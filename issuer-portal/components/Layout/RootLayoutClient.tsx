"use client";

import type { PropsWithChildren } from "react";

import { usePathname } from "next/navigation";

import IssuerChatbot from "@/components/chat-bot/IssuerChatbot";
import { GlossaryProvider } from "@/contexts/GlossaryContext";

import Layout from "./Layout";

const RootLayoutClient = ({ children }: PropsWithChildren) => {
  const pathname = usePathname();

  // Don't show navbar on login page
  const showNavBar = !pathname.startsWith("/login");

  // Above Layout so the glossary drawer is a single instance the whole tree can
  // open — Layout itself consumes it for the support speed dial.
  return (
    <GlossaryProvider>
      <Layout navBar={showNavBar}>{children}</Layout>
      {showNavBar ? <IssuerChatbot /> : null}
    </GlossaryProvider>
  );
};

export default RootLayoutClient;
