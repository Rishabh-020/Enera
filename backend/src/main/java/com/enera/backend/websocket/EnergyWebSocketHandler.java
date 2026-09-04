package com.enera.backend.websocket;

import com.enera.backend.entity.Role;
import com.enera.backend.entity.User;
import com.enera.backend.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
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

    public static class SessionContext {
        public String email;
        public boolean isDemo;
        public Role role;
        public Long flatId;
        public Long societyId;
        public Long builderId;
    }

    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final List<WebSocketSession> sessions = new CopyOnWriteArrayList<>();
    private final Map<String, Boolean> sessionDemoStatus = new ConcurrentHashMap<>();
    private final Map<String, SessionContext> sessionContexts = new ConcurrentHashMap<>();

    public EnergyWebSocketHandler(UserRepository userRepository) {
        this.userRepository = userRepository;
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);

        SessionContext ctx = new SessionContext();
        Map<String, String> queryParams = parseQueryParams(session.getUri());
        String email = queryParams.get("email");
        boolean isDemo = "true".equalsIgnoreCase(queryParams.get("isDemo")) || isDemoSession(session);
        ctx.isDemo = isDemo;

        if (email != null && !email.isBlank()) {
            ctx.email = email;
            try {
                Optional<User> userOpt = userRepository.findByEmail(email);
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    ctx.role = user.getRole();
                    ctx.flatId = user.getFlat() != null ? user.getFlat().getId() : null;
                    ctx.societyId = user.getSociety() != null ? user.getSociety().getId() : null;
                    ctx.builderId = user.getBuilder() != null ? user.getBuilder().getId() : null;
                }
            } catch (Exception e) {
                log.warn("Failed to load user info for WebSocket session {}: {}", session.getId(), e.getMessage());
            }
        }

        sessionContexts.put(session.getId(), ctx);
        sessionDemoStatus.put(session.getId(), isDemo);

        log.info("WebSocket connected: {} (email: {}, role: {}, isDemo: {})", session.getId(), ctx.email, ctx.role, ctx.isDemo);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
        sessionDemoStatus.remove(session.getId());
        sessionContexts.remove(session.getId());
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
        Boolean msgIsDemo = null;
        Long msgFlatId = null;
        Long msgSocietyId = null;

        try {
            JsonNode node = objectMapper.readTree(message);
            if (node.has("isDemo")) {
                msgIsDemo = node.get("isDemo").asBoolean();
            }
            if (node.hasNonNull("flatId")) {
                msgFlatId = node.get("flatId").asLong();
            }
            if (node.hasNonNull("societyId")) {
                msgSocietyId = node.get("societyId").asLong();
            }
        } catch (Exception e) {
            broadcastRaw(message);
            return;
        }

        for (WebSocketSession session : sessions) {
            if (!session.isOpen()) {
                continue;
            }

            SessionContext ctx = sessionContexts.get(session.getId());
            if (ctx == null) {
                sendSafely(session, message);
                continue;
            }

            // 1. Demo isolation: do not leak demo spikes to real tenants or real readings to demo users
            if (msgIsDemo != null) {
                if (msgIsDemo && !ctx.isDemo) {
                    continue;
                }
                if (!msgIsDemo && ctx.isDemo) {
                    continue;
                }
            }

            // 2. Real tenant / role authorization filter
            if (msgIsDemo != null && !msgIsDemo && ctx.role != null) {
                if (ctx.role == Role.RESIDENT) {
                    if (msgFlatId != null && ctx.flatId != null && !msgFlatId.equals(ctx.flatId)) {
                        continue;
                    }
                    if (msgFlatId == null && msgSocietyId != null && ctx.societyId != null && !msgSocietyId.equals(ctx.societyId)) {
                        continue;
                    }
                } else if (ctx.role == Role.SOCIETY_ADMIN) {
                    if (msgSocietyId != null && ctx.societyId != null && !msgSocietyId.equals(ctx.societyId)) {
                        continue;
                    }
                }
            }

            sendSafely(session, message);
        }
    }

    private void broadcastRaw(String message) {
        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                sendSafely(session, message);
            }
        }
    }

    private void sendSafely(WebSocketSession session, String message) {
        try {
            session.sendMessage(new TextMessage(message));
        } catch (IOException e) {
            log.error("Failed to broadcast message to session {}: {}", session.getId(), e.getMessage());
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

    private Map<String, String> parseQueryParams(URI uri) {
        Map<String, String> params = new HashMap<>();
        if (uri == null || uri.getQuery() == null) {
            return params;
        }
        String[] pairs = uri.getQuery().split("&");
        for (String pair : pairs) {
            int idx = pair.indexOf("=");
            try {
                if (idx > 0 && idx < pair.length() - 1) {
                    String key = URLDecoder.decode(pair.substring(0, idx), StandardCharsets.UTF_8);
                    String value = URLDecoder.decode(pair.substring(idx + 1), StandardCharsets.UTF_8);
                    params.put(key, value);
                } else if (idx > 0) {
                    String key = URLDecoder.decode(pair.substring(0, idx), StandardCharsets.UTF_8);
                    params.put(key, "");
                }
            } catch (Exception e) {
                // ignore parsing failure for single pair
            }
        }
        return params;
    }
}


