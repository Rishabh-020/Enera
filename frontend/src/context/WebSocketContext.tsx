import { createContext, useContext, type ReactNode } from "react";
import { useEnergyWebSocket } from "../lib/useEnergyWebSocket";
import { useAuth } from "./AuthContext";
import type { WebSocketReading } from "../lib/types";

interface WebSocketContextType {
  latestReading: WebSocketReading | null;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType>({
  latestReading: null,
  isConnected: false,
});

export function EnergyWebSocketProvider({ children }: { children: ReactNode }) {
  const { user, isDemoMode } = useAuth();

  const isEnabled = Boolean(user) || isDemoMode;
  const { latestReading, isConnected } = useEnergyWebSocket(isEnabled, user?.email, isDemoMode);

  return (
    <WebSocketContext.Provider value={{
      latestReading, isConnected
    }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketReading() {
  return useContext(WebSocketContext);
}