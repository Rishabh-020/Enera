package com.enera.backend.websocket;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.Set;   
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
@Slf4j
public class EnergyWebSocketHandler extends TextWebSocketHandler {

    public static final Set<String> DEMO_EMAILS = Set.of(
        "demoOwner@enera.com",
        "demoSociety@enera.com",
        "demoBuilder@enera.com"
    );

    private final List<WebSocketSession> sessions = new CopyOnWriteArrayList<>();
    private final Map<String, Boolean> sessionDemoStatus = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);

        boolean isDemo = isDemoSession(session);
        sessionDemoStatus.put(session.getId(), isDemo);

        log.info("WebSocket connected: {} (isDemo: {})", session.getId(), isDemo);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
        sessionDemoStatus.remove(session.getId());
        log.info("WebSocket disconnected: {}", session.getId());
    }

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) {
        if ("CONNECTION_REQUEST".equals(message.getPayload())) {
            log.info("Connection handshake received from session: {}", session.getId());
            sendData(session);
        }
    }

    public void sendData(WebSocketSession session) {
        try {
            session.sendMessage(new TextMessage("{\"type\":\"CONNECTED\",\"status\":\"OK\"}"));
        } catch (IOException e) {
            log.error("Failed to send data to session {}: {}", session.getId(), e.getMessage());
        }
    }

    public void sendToAll(String message) {
        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                try {
                    session.sendMessage(new TextMessage(message));
                } catch (IOException e) {
                    log.error("Failed to broadcast message to session {}: {}", session.getId(), e.getMessage());
                }
            }
        }
    }

    public boolean hasActiveSessions() {
        return !sessions.isEmpty();
    }

    public boolean hasActiveDemoSessions() {
        return sessionDemoStatus.values().stream().anyMatch(Boolean.TRUE::equals);
    }

    private boolean isDemoSession(WebSocketSession session) {
        URI uri = session.getUri();
        if (uri == null || uri.getQuery() == null) {
            return false;
        }
        String query = uri.getQuery();
        if (query.contains("isDemo=true")) {
            return true;
        }
        for (String email : DEMO_EMAILS) {
            if (query.contains("email=" + email)) {
                return true;
            }
        }
        return false;
    }
}

