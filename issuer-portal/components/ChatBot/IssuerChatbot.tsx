'use client'

import React from 'react'

import { SmartToy } from '@mui/icons-material'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import CloseIcon from '@mui/icons-material/Close'
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
} from '@mui/material'

import { FormattedMessage } from './FormattedMessage'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt?: Date
}

interface StoredConversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

interface IssuerChatbotProps {
  open?: boolean
  onClose?: () => void
}

export default function IssuerChatbot({ open = false, onClose }: IssuerChatbotProps) {
  const [showConversations, setShowConversations] = React.useState(false)
  const [conversations, setConversations] = React.useState<StoredConversation[]>([])
  const [currentConversationId, setCurrentConversationId] = React.useState<string | null>(
    null
  )
  const chatContainerRef = React.useRef<HTMLDivElement>(null)
  const [messages, setMessages] = React.useState<Message[]>([])
  const [input, setInput] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return

    // Add user message
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text,
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Send to chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      })

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.statusText}`)
      }

      const assistantMessage = await response.json()

      // Add assistant response
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)

      // Add error message
      setMessages(prev => [...prev, {
        id: `msg_error_${Date.now()}`,
        role: 'assistant',
        content: 'I encountered an error processing your request. Please try again.',
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = React.useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [])

  // Scroll to bottom when messages change
  React.useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  // Load conversations from localStorage on mount
  React.useEffect(() => {
    const stored = localStorage.getItem('chatbot-conversations')
    if (stored) {
      try {
        const parsedConversations = JSON.parse(stored)
        setConversations(parsedConversations)

        // Load the most recent conversation if it exists
        if (parsedConversations.length > 0) {
          const mostRecent = parsedConversations.sort(
            (a: StoredConversation, b: StoredConversation) => b.updatedAt - a.updatedAt
          )[0]
          setCurrentConversationId(mostRecent.id)
          setMessages(mostRecent.messages)
        }
      } catch (error) {
        console.error('Failed to load conversations:', error)
      }
    }
  }, [])

  // Save conversation when messages change
  React.useEffect(() => {
    if (messages.length === 0) return

    const saveConversation = () => {
      const firstUserMessage = messages.find(m => m.role === 'user')
      const conversationTitle = firstUserMessage
        ? (firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? '...' : ''))
        : 'New Conversation'
      const now = Date.now()

      const conversationData: StoredConversation = {
        id: currentConversationId || `conv_${now}`,
        title: conversationTitle,
        messages,
        createdAt: currentConversationId
          ? conversations.find((c) => c.id === currentConversationId)?.createdAt || now
          : now,
        updatedAt: now,
      }

      setConversations((prev) => {
        const existing = prev.find((c) => c.id === conversationData.id)
        const updated = existing
          ? prev.map((c) => (c.id === conversationData.id ? conversationData : c))
          : [...prev, conversationData]

        localStorage.setItem('chatbot-conversations', JSON.stringify(updated))
        return updated
      })

      if (!currentConversationId) {
        setCurrentConversationId(conversationData.id)
      }
    }

    const timeoutId = setTimeout(saveConversation, 1000) // Debounce saves
    return () => clearTimeout(timeoutId)
  }, [messages, currentConversationId, conversations])

  const startNewConversation = () => {
    setMessages([])
    setCurrentConversationId(null)
    setShowConversations(false)
  }

  const loadConversation = (conversation: StoredConversation) => {
    setCurrentConversationId(conversation.id)
    setMessages(conversation.messages)
    setShowConversations(false)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const deleteConversation = (conversationId: string) => {
    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== conversationId)
      localStorage.setItem('chatbot-conversations', JSON.stringify(updated))

      // If we're deleting the current conversation, start a new one
      if (conversationId === currentConversationId) {
        setMessages([])
        setCurrentConversationId(null)
      }

      return updated
    })
  }

  return (
    <>
      <Popover
        open={open}
        anchorEl={null}
        onClose={onClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            elevation: 10,
            sx: {
              width: 440,
              maxWidth: 'calc(100vw - 40px)',
              maxHeight: '700px',
              minHeight: '600px',
              borderRadius: 1,
              overflow: 'hidden',
              p: 0,
              display: 'flex',
              flexDirection: 'column',
              transform: 'translateY(24px)',
            },
          },
        }}
      >
        {/* Header - Always Present */}

        <Box
          sx={{
            bgcolor: 'var(--mui-palette-primary-main)',
            p: 3,
            backdropFilter: 'blur(50px)',
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
                /* Back button for conversations view */
                <IconButton
                  size="medium"
                  onClick={() => setShowConversations(false)}
                  sx={{
                    p: 1,
                    color: 'primary.contrastText',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  <ArrowBackIosNewIcon fontSize="medium" />
                </IconButton>
              ) : (
                /* Show conversations button if there are existing conversations */
                conversations.length > 0 && (
                  <IconButton
                    size="medium"
                    onClick={() => setShowConversations(true)}
                    sx={{
                      p: 1,
                      color: 'primary.contrastText',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
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
                  bgcolor: 'tertiary.main',
                  color: 'tertiary.contrastText',
                }}
              >
                <SmartToy />
              </Avatar>
            </Stack>
            <IconButton
              onClick={onClose}
              sx={{
                p: 1,
                color: 'primary.contrastText',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
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
                color: 'primary.contrastText',
                fontFamily: 'Roboto Condensed',
                fontWeight: 500,
                fontSize: 32,
                lineHeight: '36px',
                letterSpacing: '0.15px',
              }}
            >
              {showConversations ? 'Conversations' : 'Assistant'}
            </Typography>
            <Typography
              sx={{
                color: 'primary.contrastText',
                fontFamily: 'Roboto',
                fontWeight: 400,
                fontSize: 14,
                lineHeight: '20px',
                letterSpacing: '0.15px',
              }}
            >
              {showConversations
                ? 'Your chat history'
                : 'You can ask the Assistant anything about the portal.'}
            </Typography>
          </Stack>
        </Box>

        {/* Chat Content */}
        {showConversations ? (
          <Box
            sx={{
              flex: 1,
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              overflowY: 'auto',
            }}
          >
            {conversations.length === 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  color: 'text.secondary',
                }}
              >
                <Typography>No conversations yet</Typography>
              </Box>
            ) : (
              <Stack spacing={3} sx={{ flexGrow: 1 }}>
                {/* Recent Conversations Header */}
                <Box>
                  <Typography
                    variant="body2"
                    fontWeight={500}
                    color="text.primary"
                    sx={{ mb: 0.5 }}
                  >
                    Recent Conversations
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Just Now
                  </Typography>
                </Box>

                {/* Conversation List */}
                <Stack spacing={3}>
                  {conversations
                    .sort((a, b) => b.updatedAt - a.updatedAt)
                    .map((conversation) => {
                      // Get the last assistant message for preview
                      const lastAssistantMessage = conversation.messages
                        .filter((msg) => msg.role === 'assistant')
                        .pop()

                      return (
                        <Stack
                          key={conversation.id}
                          direction="row"
                          spacing={1.25}
                          alignItems="flex-start"
                          sx={{
                            cursor: 'pointer',
                            transition: 'opacity 0.2s ease-in-out',
                            '&:hover': {
                              opacity: 0.8,
                            },
                          }}
                          onClick={() => loadConversation(conversation)}
                        >
                          <Avatar
                            sx={{
                              width: 40,
                              height: 40,
                              bgcolor: 'tertiary.main',
                              color: 'tertiary.contrastText',
                              mt: 0.5,
                            }}
                          >
                            <SmartToy />
                          </Avatar>
                          <Stack spacing={0.625} sx={{ flex: 1, maxWidth: 285 }}>
                            <Typography
                              variant="body2"
                              color="text.primary"
                              fontWeight={500}
                            >
                              Assistant
                            </Typography>
                            <Box
                              sx={{
                                p: '10px 0px',
                                borderRadius: '0px 10px 10px 10px',
                              }}
                            >
                              <Typography
                                variant="body2"
                                color="text.primary"
                                sx={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  lineHeight: 1.4,
                                }}
                              >
                                {lastAssistantMessage?.content || conversation.title}
                              </Typography>
                            </Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              textAlign="right"
                            >
                              {new Date(conversation.updatedAt).toLocaleDateString(
                                'en-US',
                                {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                }
                              )}{' '}
                              {new Date(conversation.updatedAt).toLocaleTimeString(
                                'en-US',
                                {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true,
                                }
                              )}
                            </Typography>
                          </Stack>
                        </Stack>
                      )
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
              overflow: 'auto',
              p: 3,
              pb: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}
          >
            {messages.length === 0 && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  color: 'text.secondary',
                }}
              >
                <Typography>Start a conversation with the Assistant</Typography>
              </Box>
            )}
            {messages.map((message) => (
              <Box key={message.id}>
                {message.role === 'user' ? (
                  /* User Message */
                  <Stack alignItems="flex-end" spacing={0.625}>
                    <Paper
                      elevation={0}
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        p: '10px 15px',
                        borderRadius: '10px 0px 10px 10px',
                        maxWidth: '70%',
                        wordBreak: 'break-word',
                      }}
                    >
                      <FormattedMessage content={message.content} variant="body2" />
                    </Paper>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      textAlign="right"
                    >
                      {formatTime(Date.now())}
                    </Typography>
                  </Stack>
                ) : (
                  /* Assistant Message */
                  <Stack direction="row" spacing={1.25} alignItems="flex-start">
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: 'tertiary.main',
                        color: 'tertiary.contrastText',
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
                          bgcolor: 'info.main',
                          color: 'info.contrastText',
                          p: '10px 15px',
                          borderRadius: '0px 10px 10px 10px',
                          wordBreak: 'break-word',
                        }}
                      >
                        <FormattedMessage content={message.content} variant="body2" />
                      </Paper>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        textAlign="right"
                      >
                        {formatTime(Date.now())}
                      </Typography>
                    </Stack>
                  </Stack>
                )}
              </Box>
            ))}
            {isLoading && (
              <Stack direction="row" spacing={1.25} alignItems="flex-start">
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: 'tertiary.main',
                    color: 'tertiary.contrastText',
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
                      bgcolor: 'info.main',
                      color: 'info.contrastText',
                      p: '10px 15px',
                      borderRadius: '0px 10px 10px 10px',
                      display: 'flex',
                      gap: 1,
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <Box
                        key={i}
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: 'currentColor',
                          animation: 'pulse 1.4s infinite',
                          animationDelay: `${i * 0.2}s`,
                          '@keyframes pulse': {
                            '0%, 80%, 100%': { opacity: 0.3 },
                            '40%': { opacity: 1 },
                          },
                        }}
                      />
                    ))}
                  </Paper>
                </Stack>
              </Stack>
            )}
            <Box sx={{ pb: 3 }} /> {/* Bottom padding */}
          </Box>
        )}

        {/* Divider */}
        <Divider sx={{ borderColor: 'rgba(31, 30, 28, 0.12)' }} />

        {/* Input Area */}
        {showConversations ? (
          <Box
            sx={{
              bgcolor: 'inputOutlinedEnabledFill',
              px: 2,
              py: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              borderRadius: '0px 0px 4px 4px',
            }}
          >
            <Button
              variant="text"
              onClick={startNewConversation}
              sx={{
                color: 'primary.main',
                textTransform: 'none',
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
            onSubmit={handleFormSubmit}
            sx={{
              bgcolor: 'inputOutlinedEnabledFill',
              p: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 3.125,
              borderRadius: '0px 0px 4px 4px',
            }}
          >
            <TextField
              fullWidth
              placeholder="Reply ..."
              value={input}
              onChange={handleInputChange}
              disabled={isLoading}
              variant="standard"
              slotProps={{
                input: {
                  name: 'input',
                  disableUnderline: true,
                  sx: {
                    fontSize: 15,
                    '&::placeholder': {
                      color: 'text.secondary',
                      fontSize: 15,
                      fontWeight: 400,
                      lineHeight: '20px',
                      letterSpacing: '0.15px',
                    },
                  },
                },
              }}
            />
            <Fab
              type="submit"
              size="small"
              color="primary"
              disabled={isLoading || !input.trim()}
              sx={{
                minWidth: 40,
                minHeight: 40,
                height: 40,
                width: 40,
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: 'none',
                },
              }}
            >
              <ChevronRightIcon fontSize="small" />
            </Fab>
          </Box>
        )}
      </Popover>
    </>
  )
}
