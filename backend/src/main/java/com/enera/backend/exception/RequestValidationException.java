package com.enera.backend.exception;

public class RequestValidationException extends RuntimeException{
    public RequestValidationException(String str){
        super(str);
    }
}
