package com.enera.backend.mock;

import com.enera.backend.entity.Device;
import com.enera.backend.entity.Reading;
import com.enera.backend.repository.DeviceRepository;
import com.enera.backend.repository.ReadingRepository;
import com.enera.backend.websocket.EnergyWebSocketHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class DemoReadingService {

    private final EnergyWebSocketHandler webSocketHandler;
    private final DeviceRepository deviceRepository;
    private final ReadingRepository readingRepository;
    private final Random random = new Random();

    @Transactional
    public void generateAndBroadcastReading() {
        if (!webSocketHandler.hasActiveDemoSessions()) {
            return;
        }

        List<Device> devices = deviceRepository.findAll();
        if (devices.isEmpty()) {
            return;
        }

        int count = Math.min(devices.size(), 2 + random.nextInt(3));
        for (int i = 0; i < count; i++) {
            Device device = devices.get(random.nextInt(devices.size()));

            boolean isCommon = "COMMON_AREA_METER".equals(device.getDeviceType());
            double baseKw = isCommon ? (3.5 + random.nextDouble() * 7.5) : (0.8 + random.nextDouble() * 2.5);
            double jitter = 0.85 + (random.nextDouble() * 0.30);
            double kw = Math.round((baseKw * jitter) * 100.0) / 100.0;
            double kwh = Math.round((kw * 5.0 / 3600.0) * 10000.0) / 10000.0;
            LocalDateTime now = LocalDateTime.now();

            // 1. Persist to PostgreSQL database
            Reading reading = new Reading();
            reading.setDevice(device);
            reading.setKw(kw);
            reading.setKwh(kwh);
            reading.setTimestamp(now);
            readingRepository.save(reading);

            // 2. Update device status and sync timestamp
            device.setStatus(true);
            device.setLastSeenAt(now);
            deviceRepository.save(device);

            // 3. Broadcast live WebSocket message
            try {
                Map<String, Object> payload = new HashMap<>();
                payload.put("deviceId", device.getId());
                payload.put("deviceSerial", device.getDeviceSerial());
                payload.put("deviceType", device.getDeviceType());
                payload.put("societyId", device.getSociety() != null ? device.getSociety().getId() : null);
                payload.put("flatId", device.getFlat() != null ? device.getFlat().getId() : null);
                payload.put("flatNumber", device.getFlat() != null ? device.getFlat().getFlatNumber() : null);
                payload.put("commonAreaId", device.getCommonArea() != null ? device.getCommonArea().getId() : null);
                payload.put("commonAreaName", device.getCommonArea() != null ? device.getCommonArea().getName() : null);
                payload.put("kw", kw);
                payload.put("kwh", kwh);
                payload.put("timestamp", now.toString());
                payload.put("isDemo", true);

                ObjectMapper objectMapper = new ObjectMapper();
                String json = objectMapper.writeValueAsString(payload);
                webSocketHandler.sendToAll(json);
                log.info("Demo reading saved to DB & broadcast: Device {} ({}) - {} kW",
                        device.getId(), device.getDeviceType(), kw);
            } catch (Exception e) {
                log.error("Failed to serialize or broadcast demo reading: {}", e.getMessage(), e);
            }
        }
    }
}

