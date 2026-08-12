package com.enera.backend.mock;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;



@Slf4j // This is used to log information that what is happening
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.demo.enabled", havingValue = "true", matchIfMissing = true)
public class DemoDataGenerator {

    private final DemoReadingService demoReadingService;

    @Scheduled(fixedRateString = "${app.demo.interval-ms:5000}")
    public void generateDemoReadings() {
        demoReadingService.generateAndBroadcastReading();
    }
}
