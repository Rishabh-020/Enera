package com.enera.backend.exception;

public class CustomAccessDeniedException extends RuntimeException{
    public CustomAccessDeniedException(String str){
        super(str);
    }
}
