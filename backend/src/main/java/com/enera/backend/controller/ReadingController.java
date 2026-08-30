package com.enera.backend.controller;

import com.enera.backend.dto.reading.ReadingRequest;
import com.enera.backend.dto.reading.ReadingResponse;
import com.enera.backend.repository.DeviceRepository;
import com.enera.backend.repository.ReadingRepository;
import com.enera.backend.service.ReadingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/reading")
@RequiredArgsConstructor
public class ReadingController {
    private final ReadingService readingService;

    @PostMapping
    public ResponseEntity<ReadingResponse> recordReading(@Valid @RequestBody ReadingRequest request){
        ReadingResponse response = readingService.saveAndBroadCastReading(request);

        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
}
