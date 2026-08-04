package com.enera.backend.exception;

import com.enera.backend.dto.ErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Helper method
    private ResponseEntity<ErrorResponse> buildErrorResponse(HttpStatus status,String message){
        ErrorResponse error = new ErrorResponse(
                status.value(),
                message,
                LocalDateTime.now()
        );

        return new ResponseEntity<>(error,status);
    }
    // For 500 Server error
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception ex) {
        return buildErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Something went wrong"
        );
    }

    // For 401 unauthorized
    @ExceptionHandler({
            InvalidCredentialException.class,
            JwtAuthenticationException.class
    })
    public ResponseEntity<ErrorResponse> handleUnauthorized(Exception ex){
        return buildErrorResponse(HttpStatus.UNAUTHORIZED,ex.getMessage());
    }

    // For 403 forbidden access
    @ExceptionHandler({
            CustomAccessDeniedException.class
    })
    public ResponseEntity<ErrorResponse> handleAccess(CustomAccessDeniedException ex){
        return buildErrorResponse(HttpStatus.FORBIDDEN,ex.getMessage());
    }


    // For 404 not found
    @ExceptionHandler({
            BuilderNotFoundException.class,
            DeviceNotFoundException.class,
            ReadingNotFoundException.class,
            SocietyAdminNotFoundException.class,
            UserNotFoundException.class,
            FlatNotFoundException.class,
            FloorNotFoundException.class,
    })
    public ResponseEntity<ErrorResponse> handleNotFound(RuntimeException ex){
        return buildErrorResponse(HttpStatus.NOT_FOUND,ex.getMessage());
    }


    // For 409 conflict with duplicate
    @ExceptionHandler({
            DuplicateEmailException.class,
            DuplicateBuilderException.class,
            DuplicateDeviceException.class,
            DuplicateSocietyException.class,
    })
    public ResponseEntity<ErrorResponse> handleConflict(RuntimeException ex){
        return buildErrorResponse(HttpStatus.CONFLICT,ex.getMessage());
    }


    // For 400 Error
    @ExceptionHandler({
            IllegalArgumentException.class,
            MethodArgumentNotValidException.class
    })
    public ResponseEntity<ErrorResponse> handleBadRequest(Exception  ex){
        return buildErrorResponse(HttpStatus.BAD_REQUEST,ex.getMessage());
    }

}