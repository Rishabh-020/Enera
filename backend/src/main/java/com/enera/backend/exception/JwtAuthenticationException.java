package com.enera.backend.exception;

public class JwtAuthenticationException extends RuntimeException{
    public JwtAuthenticationException(String str){
        super(str);
    }
}
