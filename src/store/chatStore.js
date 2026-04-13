import { create } from 'zustand';

export const useChatStore = create((set) => ({
  conversations: [],
  hiddenConversations: [],
  activeMessages: [],
  activeConversationId: null,

  setActiveConversation: (id) => set({ activeConversationId: id }),

  setConversations: (convos) => {
    set({
      conversations: convos.filter((c) => !c.is_hidden),
      hiddenConversations: convos.filter((c) => c.is_hidden),
    });
  },

  setMessages: (messages) => set({ activeMessages: messages }),

  clearActiveMessages: () => set({ activeMessages: [], activeConversationId: null }),

  appendMessage: (msg) =>
    set((state) => ({ activeMessages: [...state.activeMessages, msg] })),

  markConversationHidden: (id) => {
    set((state) => {
      const convo = state.conversations.find((c) => c.id === id);
      if (!convo) return state;
      return {
        conversations: state.conversations.filter((c) => c.id !== id),
        hiddenConversations: [...state.hiddenConversations, { ...convo, is_hidden: true }],
      };
    });
  },
}));
