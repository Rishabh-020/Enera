package com.enera.backend.exception;

public class DeviceNotFoundException extends RuntimeException{
    public DeviceNotFoundException(String str){
        super(str);
    }
}
