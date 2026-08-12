package com.enera.backend.exception;

public class SocietyNotFoundException extends RuntimeException{
    public SocietyNotFoundException(String str){
        super(str);
    }
}
