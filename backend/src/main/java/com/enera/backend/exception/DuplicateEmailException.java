package com.enera.backend.exception;

public class DuplicateEmailException extends RuntimeException{
    public DuplicateEmailException(String str){
        super(str);
    }
}
