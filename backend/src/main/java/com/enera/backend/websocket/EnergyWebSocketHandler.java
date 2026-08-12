package com.enera.backend.websocket;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class EnergyWebSocketHandler extends TextWebSocketHandler {
    private final List<WebSocketSession> sessions = new CopyOnWriteArrayList<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session){
        sessions.add(session);

        System.out.println("WebSocket connected: "+ session.getId());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status){
        sessions.remove(session);

        System.out.println("WebSocket disconnected: "+ session.getId());
    }

    public void sendToAll(String message){
        for (WebSocketSession session : sessions){
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
}
