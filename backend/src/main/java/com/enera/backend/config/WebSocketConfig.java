package com.enera.backend.config;

import com.enera.backend.websocket.EnergyWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final EnergyWebSocketHandler handler;

    public WebSocketConfig(EnergyWebSocketHandler handler){
        this.handler = handler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry){
        registry
                .addHandler(handler,"/ws/energy")
                .setAllowedOrigins("*")
                .setAllowedOriginPatterns("*");
    }
}
