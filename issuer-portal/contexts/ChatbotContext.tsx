"use client";

import { useRouter } from "next/navigation";
import React, { createContext, useCallback, useContext } from "react";

import type { ChatbotAction } from "@/lib/chatbotActionsStore";

interface ChatbotContextValue {
  executeAction: (action: ChatbotAction) => Promise<void>;
  isEnabled: boolean;
  isOpen: boolean;
  openChatbot: () => void;
  closeChatbot: () => void;
}

const ChatbotContext = createContext<ChatbotContextValue | undefined>(
  undefined
);

const CHATBOT_OPEN_STORAGE_KEY = "issuer-chatbot-open";

export const ChatbotProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const router = useRouter();
  const isEnabled = true;
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const storedValue = window.sessionStorage.getItem(CHATBOT_OPEN_STORAGE_KEY);
    if (storedValue === "true") {
      setIsOpen(true);
    }
  }, []);

  React.useEffect(() => {
    window.sessionStorage.setItem(
      CHATBOT_OPEN_STORAGE_KEY,
      isOpen ? "true" : "false"
    );
  }, [isOpen]);

  const openChatbot = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeChatbot = useCallback(() => {
    setIsOpen(false);
  }, []);

  const executeAction = useCallback(
    (action: ChatbotAction) => {
      if (action.type === "NAVIGATE" && action.payload?.path) {
        router.push(action.payload.path);
        return Promise.resolve();
      }

      if (action.type === "OPEN_SUPPORT_CONTACTS") {
        window.dispatchEvent(new CustomEvent("chatbot:open-support-contacts"));
      }

      return Promise.resolve();
    },
    [router]
  );

  return (
    <ChatbotContext.Provider
      value={{ executeAction, isEnabled, isOpen, openChatbot, closeChatbot }}
    >
      {children}
    </ChatbotContext.Provider>
  );
};

export function useChatbotContext() {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error("useChatbotContext must be used within a ChatbotProvider");
  }

  return context;
}
