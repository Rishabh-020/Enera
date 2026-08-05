package com.enera.backend.exception;

public class InvalidCredentialException extends Throwable {
    public InvalidCredentialException(String str){
        super(str);
    }
}
