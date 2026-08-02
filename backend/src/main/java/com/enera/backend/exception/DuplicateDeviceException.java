package com.enera.backend.exception;

public class DuplicateDeviceException extends RuntimeException{
    public DuplicateDeviceException(String str){
        super(str);
    }
}
