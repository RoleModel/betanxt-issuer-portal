"use client";

import { useChat } from "@ai-sdk/react";
import { SmartToy } from "@mui/icons-material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import {
  Avatar,
  Box,
  Button,
  Divider,
  Fab,
  IconButton,
  Paper,
  Popover,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DefaultChatTransport, type UIMessage } from "ai";
import { usePathname } from "next/navigation";
import React from "react";

import type { ChatbotAction } from "@/lib/chatbotActionsStore";

import { useChatbotContext } from "@/contexts/ChatbotContext";

import { FormattedMessage } from "./FormattedMessage";

interface StoredConversationMessage {
  id: string;
  role: UIMessage["role"];
  content: string;
  createdAt?: number;
}

interface StoredConversation {
  id: string;
  title: string;
  messages: StoredConversationMessage[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "chatbot-conversations";
const MAX_MESSAGES_PER_REQUEST = 10;

const toRequestMessage = (message: UIMessage): UIMessage => {
  const textContent = getMessageContent(message);

  return {
    id: message.id,
    role: message.role,
    parts: textContent
      ? [
          {
            type: "text",
            text: textContent,
          },
        ]
      : [],
  };
};

const getMessageContent = (message: UIMessage): string => {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
};

const toStoredMessages = (
  messages: UIMessage[],
  timestamps: Record<string, number>,
): StoredConversationMessage[] => {
  return messages.map((message) => ({
    id: message.id,
    role: message.role,
    content: getMessageContent(message),
    createdAt: timestamps[message.id],
  }));
};

const toUiMessages = (messages: StoredConversationMessage[]): UIMessage[] => {
  return messages.map((message) => ({
    id: message.id,
    role: message.role,
    parts: [
      {
        type: "text",
        text: message.content,
      },
    ],
  }));
};

export default function IssuerChatbot() {
  const [showConversations, setShowConversations] = React.useState(false);
  const [conversations, setConversations] = React.useState<StoredConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = React.useState<string | null>(null);
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const [input, setInput] = React.useState("");
  const [messageTimestamps, setMessageTimestamps] = React.useState<Record<string, number>>({});
  const [actionPollBudget, setActionPollBudget] = React.useState(0);
  const chatContainerRef = React.useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ messages: pendingMessages, body, headers, credentials }) => {
        return {
          body: {
            ...body,
            messages: pendingMessages.slice(-MAX_MESSAGES_PER_REQUEST).map(toRequestMessage),
          },
          headers,
          credentials,
        };
      },
    }),
  });
  const { executeAction, isEnabled, isOpen, closeChatbot } = useChatbotContext();

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const scrollToBottom = React.useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, []);

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, status, scrollToBottom]);

  React.useEffect(() => {
    setMessageTimestamps((prev) => {
      let changed = false;
      const next = { ...prev };

      messages.forEach((message) => {
        if (!next[message.id]) {
          next[message.id] = Date.now();
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [messages]);

  const pollForActions = React.useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/chatbot-actions");
      if (!response.ok) {
        return false;
      }

      const payload = (await response.json()) as {
        actions: { id: string; action: ChatbotAction }[];
      };

      for (const { action } of payload.actions) {
        await executeAction(action);
      }

      return payload.actions.length > 0;
    } catch (error) {
      console.error("Error polling for chatbot actions:", error);
      return false;
    }
  }, [executeAction]);

  React.useEffect(() => {
    if (!isOpen) {
      setActionPollBudget(0);
      return;
    }

    if (status === "submitted" || status === "streaming") {
      setActionPollBudget(12);
    }
  }, [isOpen, status]);

  React.useEffect(() => {
    if (!isOpen || actionPollBudget <= 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void pollForActions().then((handledActions) => {
        setActionPollBudget((previousBudget) => {
          if (previousBudget <= 0) {
            return 0;
          }

          if (handledActions) {
            return Math.max(previousBudget, 2);
          }

          return previousBudget - 1;
        });
      });
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [isOpen, actionPollBudget, pollForActions]);

  React.useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    try {
      const parsedConversations = JSON.parse(stored) as StoredConversation[];
      setConversations(parsedConversations);

      if (parsedConversations.length > 0) {
        const mostRecent = [...parsedConversations].sort((a, b) => b.updatedAt - a.updatedAt)[0];

        setCurrentConversationId(mostRecent.id);
        setMessages(toUiMessages(mostRecent.messages));
        setMessageTimestamps(
          mostRecent.messages.reduce<Record<string, number>>((acc, message) => {
            acc[message.id] = message.createdAt ?? Date.now();
            return acc;
          }, {}),
        );
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  }, [setMessages]);

  React.useEffect(() => {
    if (messages.length === 0) return;

    const saveConversation = () => {
      const sanitize = (text: string) => text.replaceAll("**", "").replaceAll("##", "");

      const firstMessageContent = getMessageContent(messages[0]);
      const conversationTitle = firstMessageContent
        ? `${sanitize(firstMessageContent).slice(0, 50)}${
            firstMessageContent.length > 50 ? "..." : ""
          }`
        : "New Conversation";
      const now = Date.now();

      const conversationData: StoredConversation = {
        id: currentConversationId || `conv_${now}`,
        title: conversationTitle,
        messages: toStoredMessages(messages, messageTimestamps),
        createdAt: currentConversationId
          ? conversations.find((conversation) => conversation.id === currentConversationId)
              ?.createdAt || now
          : now,
        updatedAt: now,
      };

      setConversations((prev) => {
        const existing = prev.find((conversation) => conversation.id === conversationData.id);
        const updated = existing
          ? prev.map((conversation) =>
              conversation.id === conversationData.id ? conversationData : conversation,
            )
          : [...prev, conversationData];

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });

      if (!currentConversationId) {
        setCurrentConversationId(conversationData.id);
      }
    };

    const timeoutId = window.setTimeout(saveConversation, 1000);
    return () => window.clearTimeout(timeoutId);
  }, [messages, currentConversationId, conversations, messageTimestamps]);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    const speedDialElement = document.querySelector('[aria-label="Support Contacts"]');
    const nextAnchor = speedDialElement instanceof HTMLElement ? speedDialElement : document.body;

    setAnchorEl(nextAnchor);
    setShowConversations(false);
    setActionPollBudget((budget) => Math.max(budget, 2));
  }, [isOpen, pathname]);

  if (!isEnabled) {
    return null;
  }

  const startNewConversation = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setShowConversations(false);
    setInput("");
  };

  const loadConversation = (conversation: StoredConversation) => {
    setCurrentConversationId(conversation.id);
    setMessages(toUiMessages(conversation.messages));
    setMessageTimestamps(
      conversation.messages.reduce<Record<string, number>>((acc, message) => {
        acc[message.id] = message.createdAt ?? Date.now();
        return acc;
      }, {}),
    );
    setShowConversations(false);
  };

  const handleClose = () => {
    closeChatbot();
  };

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const nextInput = input.trim();
    if (!nextInput || status === "streaming") {
      return;
    }

    setInput("");
    setActionPollBudget(12);
    await sendMessage({ text: nextInput });
  };

  return (
    <Popover
      open={isOpen}
      anchorEl={anchorEl}
      onClose={handleClose}
      anchorOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      slotProps={{
        paper: {
          elevation: 10,
          sx: {
            width: 440,
            maxWidth: "calc(100vw - 40px)",
            maxHeight: "700px",
            minHeight: "600px",
            borderRadius: 1,
            overflow: "hidden",
            p: 0,
            display: "flex",
            flexDirection: "column",
            transform: "translateY(24px)",
          },
        },
      }}
    >
      <Box
        sx={{
          bgcolor: "var(--mui-palette-primary-main)",
          color: "var(--mui-palette-primary-contrastText)",
          p: 3,
          backdropFilter: "blur(50px)",
          minHeight: 169,
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          sx={{ mb: 2.5 }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            {showConversations ? (
              <IconButton
                size="medium"
                onClick={() => setShowConversations(false)}
                sx={{
                  p: 1,
                  color: "primary.contrastText",
                  "&:hover": {
                    bgcolor: "rgba(255, 255, 255, 0.1)",
                  },
                }}
              >
                <ArrowBackIosNewIcon fontSize="medium" />
              </IconButton>
            ) : (
              conversations.length > 0 && (
                <IconButton
                  size="medium"
                  onClick={() => setShowConversations(true)}
                  sx={{
                    p: 1,
                    color: "white",
                    "&:hover": {
                      bgcolor: "rgba(255, 255, 255, 0.1)",
                    },
                  }}
                >
                  <ArrowBackIosNewIcon fontSize="medium" />
                </IconButton>
              )
            )}
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: "tertiary.main",
                color: "tertiary.contrastText",
              }}
            >
              <SmartToy />
            </Avatar>
          </Stack>
          <IconButton
            onClick={handleClose}
            sx={{
              p: 1,
              color: "white",
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Stack>

        <Stack spacing={0.625}>
          <Typography
            variant="h4"
            sx={{
              color: "white",
              fontFamily: "Roboto Condensed",
              fontWeight: 500,
              fontSize: 32,
              lineHeight: "36px",
              letterSpacing: "0.15px",
            }}
          >
            {showConversations ? "Conversations" : "Assistant"}
          </Typography>
          <Typography
            sx={{
              color: "white",
              fontFamily: "Roboto",
              fontWeight: 400,
              fontSize: 14,
              lineHeight: "20px",
              letterSpacing: "0.15px",
            }}
          >
            {showConversations
              ? "Your chat history"
              : "You can ask the Assistant anything about the portal."}
          </Typography>
        </Stack>
      </Box>

      {showConversations ? (
        <Box
          sx={{
            flex: 1,
            p: 3,
            display: "flex",
            flexDirection: "column",
            gap: 3,
            overflowY: "auto",
          }}
        >
          {conversations.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
                color: "text.secondary",
              }}
            >
              <Typography>No conversations yet</Typography>
            </Box>
          ) : (
            <Stack spacing={3} sx={{ flexGrow: 1 }}>
              <Box>
                <Typography variant="body2" fontWeight={500} color="text.primary" sx={{ mb: 0.5 }}>
                  Recent Conversations
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Just Now
                </Typography>
              </Box>

              <Stack spacing={3}>
                {[...conversations]
                  .sort((a, b) => b.updatedAt - a.updatedAt)
                  .map((conversation) => {
                    const sanitize = (text: string) =>
                      text.replaceAll("**", "").replaceAll("##", "");
                    const lastAssistantMessage = conversation.messages
                      .filter((message) => message.role === "assistant")
                      .pop();

                    return (
                      <Stack
                        key={conversation.id}
                        direction="row"
                        spacing={1.25}
                        alignItems="flex-start"
                        sx={{
                          cursor: "pointer",
                          transition: "opacity 0.2s ease-in-out",
                          "&:hover": {
                            opacity: 0.8,
                          },
                        }}
                        onClick={() => loadConversation(conversation)}
                      >
                        <Avatar
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: "tertiary.main",
                            color: "tertiary.contrastText",
                            mt: 0.5,
                          }}
                        >
                          <SmartToy />
                        </Avatar>
                        <Stack spacing={0.625} sx={{ flex: 1, maxWidth: 285 }}>
                          <Typography variant="body2" color="text.primary" fontWeight={500}>
                            Assistant
                          </Typography>
                          <Box
                            sx={{
                              p: "10px 0px",
                              borderRadius: "0px 10px 10px 10px",
                            }}
                          >
                            <Typography
                              variant="body2"
                              color="text.primary"
                              sx={{
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                lineHeight: 1.4,
                              }}
                            >
                              {sanitize(lastAssistantMessage?.content || conversation.title)}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary" textAlign="right">
                            {new Date(conversation.updatedAt).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}{" "}
                            {new Date(conversation.updatedAt).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </Typography>
                        </Stack>
                      </Stack>
                    );
                  })}
              </Stack>
            </Stack>
          )}
        </Box>
      ) : (
        <Box
          ref={chatContainerRef}
          sx={{
            flex: 1,
            overflow: "auto",
            p: 3,
            pb: 0,
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          {messages.length === 0 && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
                color: "text.secondary",
              }}
            >
              <Typography>Start a conversation with the Assistant</Typography>
            </Box>
          )}
          {messages.map((message) => {
            const messageContent = getMessageContent(message);
            const timestamp = messageTimestamps[message.id] ?? Date.now();

            return (
              <Box key={message.id}>
                {message.role === "user" ? (
                  <Stack alignItems="flex-end" spacing={0.625}>
                    <Paper
                      elevation={0}
                      sx={{
                        bgcolor: "primary.main",
                        color: "primary.contrastText",
                        p: "10px 15px",
                        borderRadius: "10px 0px 10px 10px",
                        maxWidth: "70%",
                        wordBreak: "break-word",
                      }}
                    >
                      <FormattedMessage content={messageContent} variant="body2" />
                    </Paper>
                    <Typography variant="caption" color="text.secondary" textAlign="right">
                      {formatTime(timestamp)}
                    </Typography>
                  </Stack>
                ) : (
                  <Stack direction="row" spacing={1.25} alignItems="flex-start">
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: "tertiary.main",
                        color: "tertiary.contrastText",
                        mt: 0.5,
                      }}
                    >
                      <SmartToy />
                    </Avatar>
                    <Stack spacing={0.625} sx={{ flex: 1, maxWidth: 285 }}>
                      <Typography variant="body2" color="text.primary" fontWeight={500}>
                        Assistant
                      </Typography>
                      <Paper
                        elevation={0}
                        sx={{
                          bgcolor: "info.main",
                          color: "info.contrastText",
                          p: "10px 15px",
                          borderRadius: "0px 10px 10px 10px",
                          wordBreak: "break-word",
                        }}
                      >
                        <FormattedMessage content={messageContent} variant="body2" />
                      </Paper>
                      <Typography variant="caption" color="text.secondary" textAlign="right">
                        {formatTime(timestamp)}
                      </Typography>
                    </Stack>
                  </Stack>
                )}
              </Box>
            );
          })}
          {status === "streaming" &&
            messages.length > 0 &&
            messages[messages.length - 1].role === "user" && (
              <Stack direction="row" spacing={1.25} alignItems="flex-start">
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: "tertiary.main",
                    color: "tertiary.contrastText",
                    mt: 0.5,
                  }}
                >
                  <SmartToy />
                </Avatar>
                <Stack spacing={0.625} sx={{ flex: 1, maxWidth: 285 }}>
                  <Typography variant="body2" color="text.primary" fontWeight={500}>
                    Assistant
                  </Typography>
                  <Paper
                    elevation={0}
                    sx={{
                      bgcolor: "info.main",
                      color: "info.contrastText",
                      p: "10px 15px",
                      borderRadius: "0px 10px 10px 10px",
                      display: "flex",
                      gap: 1,
                    }}
                  >
                    {[0, 1, 2].map((index) => (
                      <Box
                        key={index}
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          bgcolor: "currentColor",
                          animation: "pulse 1.4s infinite",
                          animationDelay: `${index * 0.2}s`,
                          "@keyframes pulse": {
                            "0%, 80%, 100%": { opacity: 0.3 },
                            "40%": { opacity: 1 },
                          },
                        }}
                      />
                    ))}
                  </Paper>
                </Stack>
              </Stack>
            )}
          <Box sx={{ pb: 3 }} />
        </Box>
      )}

      <Divider sx={{ borderColor: "rgba(31, 30, 28, 0.12)" }} />

      {showConversations ? (
        <Box
          sx={{
            bgcolor: "inputOutlinedEnabledFill",
            px: 2,
            py: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            borderRadius: "0px 0px 4px 4px",
          }}
        >
          <Button
            variant="text"
            onClick={startNewConversation}
            sx={{
              color: "primary.main",
              textTransform: "none",
              fontWeight: 500,
              fontSize: 14,
            }}
          >
            Begin a New Conversation
          </Button>
        </Box>
      ) : (
        <Box
          component="form"
          onSubmit={(event) => {
            void handleFormSubmit(event);
          }}
          sx={{
            bgcolor: "inputOutlinedEnabledFill",
            p: "20px 24px",
            display: "flex",
            alignItems: "center",
            gap: 3.125,
            borderRadius: "0px 0px 4px 4px",
          }}
        >
          <TextField
            fullWidth
            placeholder="Reply ..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={status === "streaming"}
            variant="standard"
            slotProps={{
              input: {
                disableUnderline: true,
                sx: {
                  fontSize: 15,
                  "&::placeholder": {
                    color: "text.secondary",
                    fontSize: 15,
                    fontWeight: 400,
                    lineHeight: "20px",
                    letterSpacing: "0.15px",
                  },
                },
              },
            }}
          />
          <Fab
            type="submit"
            size="small"
            color="primary"
            disabled={status === "streaming" || !input.trim()}
            sx={{
              minWidth: 40,
              minHeight: 40,
              height: 40,
              width: 40,
              boxShadow: "none",
              "&:hover": {
                boxShadow: "none",
              },
            }}
          >
            <ChevronRightIcon fontSize="small" />
          </Fab>
        </Box>
      )}
    </Popover>
  );
}
