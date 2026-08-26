import { useEffect, useRef, useState } from "react";
import type { WebSocketReading } from "./types";

function getWebSocketUrl(): string {
  try {
    const envUrl = (import.meta as any)?.env?.VITE_WS_URL;
    if (envUrl) return envUrl;

    if (typeof window !== "undefined" && window && window.location) {
      const isSecure = window.location.protocol === "https:";
      const host = window.location.hostname || "localhost";
      return `${isSecure ? "wss" : "ws"}://${host}:8080/ws/energy`;
    }
  } catch (err) {
    console.warn("WebSocket URL detection fallback:", err);
  }
  return "ws://localhost:8080/ws/energy";
}

export function useEnergyWebSocket(enabled: boolean = true) {
  const [latestReading, setLatestReading] = useState<WebSocketReading | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) {
      setIsConnected(false);
      setLatestReading(null);
      return;
    }

    let shouldReconnect = true;
    let reconnectTimeout: any = null;

    function connect() {
      if (!shouldReconnect) return;

      try {
        const url = getWebSocketUrl();
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          retryCountRef.current = 0;
        };

        ws.onmessage = (event) => {
          try {
            const reading: WebSocketReading = JSON.parse(event.data);
            setLatestReading(reading);
          } catch (err) {
            console.error("Failed to parse WebSocket reading:", err);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          scheduleReconnect();
        };

        ws.onerror = () => {
          setIsConnected(false);
          try {
            ws.close();
          } catch (_) {}
        };
      } catch (err) {
        scheduleReconnect();
      }
    }

    function scheduleReconnect() {
      if (!shouldReconnect) return;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);

      // Exponential backoff: 1.5s, 3s, 6s, max 10s + jitter
      const baseDelay = Math.min(10000, 1500 * Math.pow(1.5, Math.min(retryCountRef.current, 5)));
      const jitter = Math.random() * 500;
      retryCountRef.current += 1;

      reconnectTimeout = setTimeout(connect, baseDelay + jitter);
    }

    // Reconnect immediately if tab becomes visible and socket is closed
    function handleVisibilityChange() {
      if (document.visibilityState === "visible" && shouldReconnect) {
        if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
          retryCountRef.current = 0;
          connect();
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    connect();

    return () => {
      shouldReconnect = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (_) {}
      }
    };
  }, [enabled]);

  return { latestReading, isConnected };
}