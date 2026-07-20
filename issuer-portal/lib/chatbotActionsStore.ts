export interface ChatbotAction {
  type: "NAVIGATE" | "OPEN_SUPPORT_CONTACTS";
  payload?: {
    path?: string;
  };
}

interface PendingChatbotAction {
  id: string;
  action: ChatbotAction;
  timestamp: number;
}

let pendingActions: PendingChatbotAction[] = [];

export const enqueueChatbotAction = (action: ChatbotAction): string => {
  const actionId = `action_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  pendingActions.push({
    id: actionId,
    action,
    timestamp: Date.now(),
  });

  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  pendingActions = pendingActions.filter(
    (item) => item.timestamp > fiveMinutesAgo
  );

  return actionId;
};

export const drainChatbotActions = (): PendingChatbotAction[] => {
  const actions = [...pendingActions];
  pendingActions = [];
  return actions;
};
