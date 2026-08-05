package com.enera.backend.exception;

public class InvalidCredentialException extends RuntimeException {
    public InvalidCredentialException(String str){
        super(str);
    }
}
