package com.enera.backend.exception;

public class DuplicateBuilderException extends  RuntimeException{
    public DuplicateBuilderException(String str){
        super(str);
    }
}
