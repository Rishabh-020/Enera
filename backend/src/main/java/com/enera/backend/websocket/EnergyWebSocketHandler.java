package com.enera.backend.websocket;

import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NullMarked;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
@Slf4j
public class EnergyWebSocketHandler extends TextWebSocketHandler {
    private final List<WebSocketSession> sessions = new CopyOnWriteArrayList<>();

    private final List<WebSocketSession> activeSessions = new CopyOnWriteArrayList<>();

    @Override
    @NullMarked
    public void afterConnectionEstablished(WebSocketSession session){
        sessions.add(session);

        System.out.println("WebSocket connected: "+ session.getId());
    }

    @Override
    @NullMarked
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status){
        sessions.remove(session);

        activeSessions.remove(session);

        log.info("WebSocket disconnected: {}", session.getId());
    }

    @Override
    @NullMarked
    public void handleTextMessage(WebSocketSession session,TextMessage message){
        if(message.getPayload().equals("CONNECTION_REQUEST")){
            log.info("Connection request received from session: {}",session.getId());

            activeSessions.add(session);

            sendData(session);
        }
    }

    public void sendData(WebSocketSession session){
        try{
            session.sendMessage(new TextMessage("Energy data received"));
        }catch (IOException e){
            log.error("Failed to send data: {}",session.getId(),e);
        }
    }

    public void sendToAll(String message){
        for (WebSocketSession session : activeSessions){
            if(session.isOpen()){
                try{
                    session.sendMessage(
                            new TextMessage(message)
                    );
                }catch (IOException e){
                    e.printStackTrace();
                }
            }
        }
    }
    public boolean hasActiveSessions() {
        return !sessions.isEmpty();
    }
}
