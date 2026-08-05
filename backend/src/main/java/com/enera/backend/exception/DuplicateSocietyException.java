package com.enera.backend.exception;

public class DuplicateSocietyException extends RuntimeException{
    public DuplicateSocietyException(String str){
        super(str);
    }
}
