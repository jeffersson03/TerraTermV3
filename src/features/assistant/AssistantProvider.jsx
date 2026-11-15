import { AssistantRuntimeProvider, useLocalRuntime } from "@assistant-ui/react";
import { chatAdapter } from "./services/chatAdapter";

// Envuelve la app para que el asistente tenga su "motor" (runtime) disponible.
function AssistantProvider({ children }) {
  const runtime = useLocalRuntime(chatAdapter);
  return <AssistantRuntimeProvider runtime={runtime}>{children}</AssistantRuntimeProvider>;
}

export default AssistantProvider;
