package com.enera.backend.controller;

import com.enera.backend.dto.reading.ReadingRequest;
import com.enera.backend.dto.reading.ReadingResponse;
import com.enera.backend.service.ReadingService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/reading")
public class ReadingController {
    private final ReadingService readingService;
    private final String iotApiKey;

    public ReadingController(ReadingService readingService,
                             @Value("${enera.iot.api-key:enera-iot-secure-key-2026}") String iotApiKey) {
        this.readingService = readingService;
        this.iotApiKey = iotApiKey;
    }

    @PostMapping
    public ResponseEntity<ReadingResponse> recordReading(
            @RequestHeader(value = "X-Device-Api-Key", required = false) String deviceApiKey,
            @Valid @RequestBody ReadingRequest request){
        if (iotApiKey != null && !iotApiKey.isBlank() && !iotApiKey.equals(deviceApiKey)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or missing X-Device-Api-Key header");
        }
        ReadingResponse response = readingService.saveAndBroadCastReading(request);

        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
}

