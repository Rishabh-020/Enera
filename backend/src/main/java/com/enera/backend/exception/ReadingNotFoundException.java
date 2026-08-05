package com.enera.backend.exception;

public class ReadingNotFoundException extends RuntimeException{
    public ReadingNotFoundException(String str){
        super(str);
    }
}
