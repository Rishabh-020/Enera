package com.enera.backend.exception;

public class FlatNotFoundException extends RuntimeException{
    public FlatNotFoundException(String str){
        super(str);
    }
}
