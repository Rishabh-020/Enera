package com.enera.backend.exception;

public class MethodArgumentNotValidException extends Throwable{
    public MethodArgumentNotValidException(String str){
        super(str);
    }
}
