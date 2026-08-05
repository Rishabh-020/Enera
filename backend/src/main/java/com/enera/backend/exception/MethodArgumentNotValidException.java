package com.enera.backend.exception;

public class MethodArgumentNotValidException extends RuntimeException{
    public MethodArgumentNotValidException(String str){
        super(str);
    }
}
