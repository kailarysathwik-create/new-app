import { create } from 'zustand';

export const useVoiceStore = create((set) => ({
  isSignalActive: false,
  activeVoiceId: null, // conversationId
  
  startSignal: (conversationId) => set({
    isSignalActive: true,
    activeVoiceId: conversationId
  }),
  
  endSignal: () => set({
    isSignalActive: false,
    activeVoiceId: null
  }),
}));
