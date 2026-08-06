package com.enera.backend.exception;

public class BadRequestException extends RuntimeException{
    public BadRequestException(String str){

        super(str);
    }
}
