import { useEffect, useRef, useState } from "react";
import type { WebSocketReading } from "./types";

const WS_URL = "ws://localhost:8080/ws/energy";

export function useEnergyWebSocket(enabled: boolean = true) {
    const [latestReading, setLatestReading] = useState<WebSocketReading | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!enabled) {
            setIsConnected(false);
            setLatestReading(null);
            return;
        }

        let shouldReconnect = true;
        let reconnectTimeout: any = null;

        function connect() {
            try {
                const ws = new WebSocket(WS_URL);
                wsRef.current = ws;

                ws.onopen = () => {
                    console.log("Connected to Energy WebSocket");
                    setIsConnected(true);
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
                    if (shouldReconnect) {
                        reconnectTimeout = setTimeout(connect, 3000);
                    }
                };

                ws.onerror = () => {
                    setIsConnected(false);
                    ws.close();
                };
            } catch (err) {
                if (shouldReconnect) {
                    reconnectTimeout = setTimeout(connect, 3000);
                }
            }
        }

        connect();

        return () => {
            shouldReconnect = false;
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
            if (wsRef.current) wsRef.current.close();
        };
    }, [enabled]);

    return { latestReading, isConnected };
}