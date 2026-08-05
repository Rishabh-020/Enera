package com.enera.backend.exception;

public class FloorNotFoundException extends RuntimeException{
    public FloorNotFoundException(String str){
        super(str);
    }
}
