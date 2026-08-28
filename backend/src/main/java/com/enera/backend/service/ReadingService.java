package com.enera.backend.service;

import com.enera.backend.dto.reading.ReadingRequest;
import com.enera.backend.dto.reading.ReadingResponse;
import com.enera.backend.entity.Device;
import com.enera.backend.entity.Reading;
import com.enera.backend.exception.DeviceNotFoundException;
import com.enera.backend.repository.DeviceRepository;
import com.enera.backend.repository.ReadingRepository;
import com.enera.backend.websocket.EnergyWebSocketHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReadingService {
    private final ReadingRepository readingRepository;
    private final EnergyWebSocketHandler energyWebSocketHandler;
    private final DeviceRepository deviceRepository;

    @Transactional
    public ReadingResponse saveAndBroadCastReading(ReadingRequest request){
        Device device = deviceRepository.findById(request.getDeviceId())
                .orElseThrow(()-> new DeviceNotFoundException("Device not found"));


        Reading reading = new Reading();
        reading.setKw(request.getKw());
        reading.setKwh(request.getKwh());
        reading.setTimestamp(request.getTimestamp() != null ?
                request.getTimestamp() : LocalDateTime.now());
        reading.setDevice(device);

        Reading saveReading = readingRepository.save(reading);

        device.setStatus(true);
        device.setLastSeenAt(saveReading.getTimestamp());
        deviceRepository.save(device);

        broadCastToWebSocket(device,saveReading);

        ReadingResponse response = new ReadingResponse();
        response.setId(saveReading.getId());
        response.setKwh(saveReading.getKwh());
        response.setKw(saveReading.getKw());
        response.setTimestamp(saveReading.getTimestamp());
        response.setCreatedAt(saveReading.getCreatedAt());
        response.setDeviceId(device.getId());

        return response;
    }

    public void broadCastToWebSocket(Device device,Reading savedReading){
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
            payload.put("kw", savedReading.getKw());
            payload.put("kwh", savedReading.getKwh());
            payload.put("timestamp", savedReading.getTimestamp().toString());
            payload.put("isDemo", false);
            ObjectMapper mapper = new ObjectMapper();
            String json = mapper.writeValueAsString(payload);
            energyWebSocketHandler.sendToAll(json);
            log.info("Live real reading broadcasted for device ID {}: {} kW", device.getId(), savedReading.getKw());
        } catch (Exception e) {
            log.error("Failed to broadcast real reading over WebSocket: {}", e.getMessage(), e);
        }
    }
}
