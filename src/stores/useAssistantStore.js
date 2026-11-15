import { create } from "zustand";

// Conversación con el asistente. El store solo guarda estado: la llamada al
// backend vive en un servicio (M5), que usa estas acciones.
//
// Forma de cada mensaje:
// { id, role: 'user' | 'assistant', content, kind: 'ai' | null, sources: [], createdAt }
export const useAssistantStore = create((set) => ({
  messages: [],
  status: "idle", // 'idle' | 'thinking' | 'error'
  error: null,

  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        { id: crypto.randomUUID(), createdAt: new Date().toISOString(), sources: [], ...message },
      ],
    })),

  setThinking: () => set({ status: "thinking", error: null }),

  setIdle: () => set({ status: "idle" }),

  setError: (error) => set({ status: "error", error }),

  clear: () => set({ messages: [], status: "idle", error: null }),
}));
