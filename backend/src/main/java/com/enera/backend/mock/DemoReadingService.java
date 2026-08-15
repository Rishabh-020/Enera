package com.enera.backend.mock;

import com.enera.backend.websocket.EnergyWebSocketHandler;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;

@Slf4j
@Service
@RequiredArgsConstructor
public class DemoReadingService {

    private final EnergyWebSocketHandler webSocketHandler;
    private final ObjectMapper objectMapper;
    private final Random random = new Random();

    private final List<DemoDevice> allDevices = new ArrayList<>();
    private final List<DemoDevice> activeDevices = new ArrayList<>();

    @PostConstruct
    public void initTopology() {
        log.info("Initializing in-memory Demo Topology (2 Societies, 3-4 Blocks, 5 Floors, 8 Flats/Floor, 20 Common Areas, 20 Active Flats)...");

        long deviceIdCounter = 1L;
        long deviceSerialCounter = 900001L;
        long flatIdCounter = 1001L;

        String[] soc1CommonAreas = {
                "Clubhouse & Main Gym", "Main Lift 1", "Main Lift 2", "Service Lift",
                "Borewell Pump 1", "Overhead Tank Pump", "Swimming Pool Filtration",
                "EV Fast Charging Hub", "Corridor & Perimeter Lighting", "Security Gate & Hub"
        };

        double[] soc1CommonLoads = { 8.5, 5.0, 5.0, 6.0, 9.5, 7.5, 4.5, 11.0, 3.2, 2.1 };

        for (int i = 0; i < soc1CommonAreas.length; i++) {
            DemoDevice dev = DemoDevice.builder()
                    .deviceId(deviceIdCounter++)
                    .deviceSerial(deviceSerialCounter++)
                    .deviceType("COMMON_AREA_METER")
                    .mappedTo(soc1CommonAreas[i])
                    .societyId(1L)
                    .commonAreaId((long) (i + 1))
                    .commonAreaName(soc1CommonAreas[i])
                    .isActive(true)
                    .baseKw(soc1CommonLoads[i])
                    .build();
            allDevices.add(dev);
            activeDevices.add(dev);
        }

        String[] soc2CommonAreas = {
                "Resident Fitness Center (Gym)", "Block A Passenger Lift", "Block B Passenger Lift",
                "Block C Passenger Lift", "Deep Borewell Pump", "Water Treatment Booster",
                "Community Hall & Badminton", "Basement Parking Ventilation", "Landscape Lighting",
                "Central Guard Room"
        };
        double[] soc2CommonLoads = { 7.8, 4.8, 4.8, 4.8, 10.0, 8.0, 5.5, 6.5, 2.8, 1.9 };

        for (int i = 0; i < soc2CommonAreas.length; i++) {
            DemoDevice dev = DemoDevice.builder()
                    .deviceId(deviceIdCounter++)
                    .deviceSerial(deviceSerialCounter++)
                    .deviceType("COMMON_AREA_METER")
                    .mappedTo(soc2CommonAreas[i])
                    .societyId(2L)
                    .commonAreaId((long) (i + 11))
                    .commonAreaName(soc2CommonAreas[i])
                    .isActive(true)
                    .baseKw(soc2CommonLoads[i])
                    .build();
            allDevices.add(dev);
            activeDevices.add(dev);
        }

        int activeFlatsCount = 0;

        for (long socId = 1L; socId <= 2L; socId++) {
            int blockCount = (socId == 1L) ? 4 : 3;
            String[] blockNames = { "A", "B", "C", "D" };

            for (int b = 0; b < blockCount; b++) {
                String blockName = blockNames[b];
                long blockId = (socId * 10) + (b + 1);

                for (int floor = 1; floor <= 5; floor++) {
                    for (int flatNum = 1; flatNum <= 8; flatNum++) {
                        long currentFlatId = flatIdCounter++;
                        String flatNumberStr = blockName + "-" + floor + "0" + flatNum;
                        String mappedToLabel = "Flat " + flatNumberStr + " (Society " + socId + ")";

                        boolean isActiveFlat = false;
                        if (socId == 1L && activeFlatsCount < 12 && (flatNum == 1 || flatNum == 5)) {
                            isActiveFlat = true;
                            activeFlatsCount++;
                        } else if (socId == 2L && activeFlatsCount < 20 && (flatNum == 2 || flatNum == 6)) {
                            isActiveFlat = true;
                            activeFlatsCount++;
                        }

                        DemoDevice flatMeter = DemoDevice.builder()
                                .deviceId(deviceIdCounter++)
                                .deviceSerial(deviceSerialCounter++)
                                .deviceType("FLAT_METER")
                                .mappedTo(mappedToLabel)
                                .societyId(socId)
                                .flatId(currentFlatId)
                                .flatNumber(flatNumberStr)
                                .isActive(isActiveFlat)
                                .baseKw(isActiveFlat ? (1.2 + (random.nextDouble() * 2.2)) : 0.0)
                                .build();

                        allDevices.add(flatMeter);
                        if (isActiveFlat) {
                            activeDevices.add(flatMeter);
                        }
                    }
                }
            }
        }

        log.info("Demo Topology Ready: {} total devices created ({} active devices: 20 common areas + {} active flats).",
                allDevices.size(), activeDevices.size(), activeFlatsCount);
    }

    public void generateAndBroadcastReading() {
        if (activeDevices.isEmpty()) {
            return;
        }

        // Pick 1 or 2 active devices randomly per tick to simulate continuous real-time telemetry
        int count = 1 + random.nextInt(2);
        for (int i = 0; i < count; i++) {
            DemoDevice device = activeDevices.get(random.nextInt(activeDevices.size()));

            // Realistic instantaneous power with ±15% jitter
            double jitter = 0.85 + (random.nextDouble() * 0.30);
            double kw = Math.round((device.getBaseKw() * jitter) * 100.0) / 100.0;

            // 5-second interval energy consumption in kWh
            double kwh = Math.round((kw * 5.0 / 3600.0) * 10000.0) / 10000.0;

            DemoReading reading = new DemoReading();
            reading.setDeviceId(device.getDeviceId());
            reading.setDeviceSerial(device.getDeviceSerial());
            reading.setDeviceType(device.getDeviceType());
            reading.setSocietyId(device.getSocietyId());
            reading.setFlatId(device.getFlatId());
            reading.setFlatNumber(device.getFlatNumber());
            reading.setCommonAreaId(device.getCommonAreaId());
            reading.setCommonAreaName(device.getCommonAreaName());
            reading.setKw(kw);
            reading.setKwh(kwh);
            reading.setTimestamp(LocalDateTime.now());
            reading.setDemo(true);

            try {
                String json = objectMapper.writeValueAsString(reading);
                webSocketHandler.sendToAll(json);
                log.debug("Demo reading broadcast: Device {} ({}) - {} kW",
                        device.getDeviceId(), device.getMappedTo(), kw);
            } catch (Exception e) {
                log.error("Failed to serialize or broadcast demo reading: {}", e.getMessage());
            }
        }
    }

    public List<DemoDevice> getAllDevices() {
        return Collections.unmodifiableList(allDevices);
    }

    public List<DemoDevice> getActiveDevices() {
        return Collections.unmodifiableList(activeDevices);
    }
}
