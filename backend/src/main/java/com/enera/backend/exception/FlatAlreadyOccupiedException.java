package com.enera.backend.exception;

public class FlatAlreadyOccupiedException extends RuntimeException {
    public FlatAlreadyOccupiedException(String message) {
        super(message);
    }
}
