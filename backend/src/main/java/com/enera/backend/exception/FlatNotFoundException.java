package com.enera.backend.exception;

import com.enera.backend.entity.Flat;

public class FlatNotFoundException extends RuntimeException{
    public FlatNotFoundException(String str){
        super(str);
    }
}
