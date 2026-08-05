package com.enera.backend.exception;

public class BuilderNotFoundException extends RuntimeException{
    public BuilderNotFoundException(String str){
        super(str);
    }
}
