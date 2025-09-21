'use client'

import { useRouter } from 'next/navigation'
import React, { ReactNode, createContext, useCallback, useContext, useState } from 'react'

interface SecurityInfo {
  ticker?: string
  symbol?: string
  company?: string
  name?: string
  price?: number
  currentPrice?: number
}

interface AccountInfo {
  id?: string
  accountName?: string
  [key: string]: unknown // For additional account properties
}

type ChatbotActionPayload =
  | {
      security?: SecurityInfo
      account?: AccountInfo
      mode?: 'security-details' | 'trade'
    } // OPEN_TRADE_DRAWER
  | { path?: string; clientId?: string; householdId?: string } // NAVIGATE
  | undefined // OPEN_CLIENT_DRAWER
  | { accountId: string } // SHOW_ACCOUNT_DETAILS

interface ChatbotAction {
  type: 'OPEN_TRADE_DRAWER' | 'NAVIGATE' | 'OPEN_CLIENT_DRAWER' | 'SHOW_ACCOUNT_DETAILS'
  payload?: ChatbotActionPayload
}

interface ChatbotContextType {
  executeAction: (
    action: ChatbotAction
  ) => Promise<{ success: boolean; message?: string }>
  tradeDrawerOpen: boolean
  setTradeDrawerOpen: (open: boolean) => void
  tradeDrawerMode: 'security-details' | 'trade'
  setTradeDrawerMode: (mode: 'security-details' | 'trade') => void
  selectedSecurity: { ticker: string; company: string; currentPrice?: number } | null
  setSelectedSecurity: (
    security: { ticker: string; company: string; currentPrice?: number } | null
  ) => void
  selectedAccount: AccountInfo | null
  setSelectedAccount: (account: AccountInfo | null) => void
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined)

export const useChatbotContext = () => {
  const context = useContext(ChatbotContext)
  if (!context) {
    throw new Error('useChatbotContext must be used within a ChatbotProvider')
  }
  return context
}

interface ChatbotProviderProps {
  children: ReactNode
}

export const ChatbotProvider: React.FC<ChatbotProviderProps> = ({ children }) => {
  const router = useRouter()
  const [tradeDrawerOpen, setTradeDrawerOpen] = useState(false)
  const [tradeDrawerMode, setTradeDrawerMode] = useState<'security-details' | 'trade'>(
    'trade'
  )
  const [selectedSecurity, setSelectedSecurity] = useState<{
    ticker: string
    company: string
    currentPrice?: number
  } | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<AccountInfo | null>(null)

  const executeAction = useCallback(
    async (action: ChatbotAction): Promise<{ success: boolean; message?: string }> => {
      try {
        switch (action.type) {
          case 'OPEN_TRADE_DRAWER':
            const payload = action.payload as {
              security?: SecurityInfo
              account?: AccountInfo
              mode?: 'security-details' | 'trade'
            }
            const { security, account, mode = 'trade' } = payload || {}

            // Close drawer first
            setTradeDrawerOpen(false)

            // Set the new data after a brief delay
            setTimeout(() => {
              if (security) {
                setSelectedSecurity({
                  ticker: security.ticker || security.symbol || '',
                  company: security.company || security.name || '',
                  currentPrice: security.price || security.currentPrice,
                })
              }

              if (account) {
                setSelectedAccount(account)
              }

              setTradeDrawerMode(mode)
              setTradeDrawerOpen(true)
            }, 50)

            return {
              success: true,
              message: `Opening trade drawer${security ? ` for ${security.ticker || security.symbol}` : ''}${account ? ` with account ${account.accountName || account.id}` : ''}`,
            }

          case 'NAVIGATE':
            const navPayload = action.payload as {
              path?: string
              clientId?: string
              householdId?: string
            }
            const { path, clientId, householdId } = navPayload || {}

            if (path) {
              router.push(path)
              return { success: true, message: `Navigating to ${path}` }
            } else if (clientId) {
              router.push(`/clients/${clientId}`)
              return { success: true, message: `Navigating to client details` }
            } else if (householdId) {
              router.push(`/households/${householdId}`)
              return { success: true, message: `Navigating to household details` }
            }

            return { success: false, message: 'Invalid navigation parameters' }

          case 'OPEN_CLIENT_DRAWER':
            // This would open a client details drawer if you have one
            return {
              success: true,
              message: 'Client drawer functionality not implemented yet',
            }

          case 'SHOW_ACCOUNT_DETAILS':
            const accountPayload = action.payload as { accountId: string }
            const { accountId } = accountPayload || {}
            if (accountId) {
              router.push(`/accounts/${accountId}`)
              return {
                success: true,
                message: `Showing account details for ${accountId}`,
              }
            }
            return { success: false, message: 'Account ID required' }

          default:
            return { success: false, message: 'Unknown action type' }
        }
      } catch (error) {
        console.error('Error executing chatbot action:', error)
        return {
          success: false,
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }
      }
    },
    [router]
  )

  const value: ChatbotContextType = {
    executeAction,
    tradeDrawerOpen,
    setTradeDrawerOpen,
    tradeDrawerMode,
    setTradeDrawerMode,
    selectedSecurity,
    setSelectedSecurity,
    selectedAccount,
    setSelectedAccount,
  }

  return <ChatbotContext.Provider value={value}>{children}</ChatbotContext.Provider>
}
