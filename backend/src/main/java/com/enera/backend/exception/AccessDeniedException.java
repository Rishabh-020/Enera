package com.enera.backend.exception;

public class AccessDeniedException extends RuntimeException{
    public AccessDeniedException(String str){
        super(str);
    }
}
