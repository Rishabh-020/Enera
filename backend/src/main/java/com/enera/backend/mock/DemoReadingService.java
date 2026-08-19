package com.enera.backend.mock;

import com.enera.backend.dto.society.SocietyBlockResponse;
import com.enera.backend.dto.society.SocietyCommonAreaResponse;
import com.enera.backend.dto.society.SocietyFlatResponse;
import com.enera.backend.dto.society.SocietyOverviewResponse;
import com.enera.backend.websocket.EnergyWebSocketHandler;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;


@Slf4j
@Service
@RequiredArgsConstructor
public class DemoReadingService {

    private final EnergyWebSocketHandler webSocketHandler;
    private final Random random = new Random();

    private final List<DemoDevice> allDevices = new ArrayList<>();
    private final List<DemoDevice> activeDevices = new ArrayList<>();

    @PostConstruct
    public void initTopology() {
        log.info("Initializing in-memory Demo Topology (2 Societies, 3-4 Blocks, 5 Floors, 8 Flats/Floor, 20 Common Areas, 20 Active Flats)...");

        long deviceIdCounter = 1L;
        long deviceSerialCounter = 900001L;
        long flatIdCounter = 1L;

        String[] soc1CommonAreas = {
                "Clubhouse & Main Gym", "Main Lift 1", "Main Lift 2", "Service Lift",
                "BoreWell Pump 1", "Overhead Tank Pump", "Swimming Pool Filtration",
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
        if (!webSocketHandler.hasActiveSessions() || activeDevices.isEmpty()) {
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
            reading.setTimestamp(Instant.now().toString());
            reading.setDemo(true);

            try {
                ObjectMapper objectMapper = new ObjectMapper();
                String json = objectMapper.writeValueAsString(reading);
                webSocketHandler.sendToAll(json);
                log.info("Demo reading broadcast: Device {} ({}) - {} kW",
                        device.getDeviceId(), device.getMappedTo(), kw);
            } catch (Exception e) {
                log.error("Failed to serialize or broadcast demo reading: {}", e.getMessage(), e);
            }
        }
    }

    public List<DemoDevice> getAllDevices() {
        return Collections.unmodifiableList(allDevices);
    }

    public List<DemoDevice> getActiveDevices() {
        return Collections.unmodifiableList(activeDevices);
    }

    public SocietyOverviewResponse getSocietyOverview(Long societyId) {
        long targetSocId = (societyId != null) ? societyId : 1L;
        List<DemoDevice> socDevices = allDevices.stream()
                .filter(d -> d.getSocietyId() != null && d.getSocietyId().equals(targetSocId))
                .toList();

        long flatCount = socDevices.stream()
                .filter(d -> "FLAT_METER".equals(d.getDeviceType()))
                .count();
        long activeCount = socDevices.stream()
                .filter(d -> Boolean.TRUE.equals(d.getIsActive()))
                .count();
        double totalLiveKw = socDevices.stream()
                .filter(d -> Boolean.TRUE.equals(d.getIsActive()) && d.getBaseKw() != null)
                .mapToDouble(DemoDevice::getBaseKw)
                .sum();

        SocietyOverviewResponse resp = new SocietyOverviewResponse();

        resp.setName(targetSocId == 1L ? "Sunrise Heights (Demo)" : "Skyline Towers (Demo)");
        resp.setLiveKw(Math.round(totalLiveKw * 10.0) / 10.0);
        resp.setTotalFlats((int) flatCount);
        resp.setOccupiedFlats((int) (flatCount * 0.9));
        resp.setDevicesOnline((int) activeCount);
        resp.setDevicesOffline((int) (socDevices.size() - activeCount));
        resp.setMtdKwh(targetSocId == 1L ? 5420.0 : 4180.0);
        resp.setMtdCost(targetSocId == 1L ? 43360.0 : 33440.0);
        return resp;
    }

    public List<SocietyBlockResponse> getSocietyBlocks(Long societyId) {
        long targetSocId = (societyId != null) ? societyId : 1L;
        String[] blockNames = (targetSocId == 1L) ? new String[]{"A", "B", "C", "D"} : new String[]{"A", "B", "C"};
        List<SocietyBlockResponse> list = new ArrayList<>();

        for (int i = 0; i < blockNames.length; i++) {
            String bName = blockNames[i];
            List<DemoDevice> bDevices = allDevices.stream()
                    .filter(d -> d.getSocietyId() != null && d.getSocietyId().equals(targetSocId) && d.getFlatNumber() != null && d.getFlatNumber().startsWith(bName + "-"))
                    .toList();

            double liveKw = bDevices.stream()
                    .filter(d -> Boolean.TRUE.equals(d.getIsActive()) && d.getBaseKw() != null)
                    .mapToDouble(DemoDevice::getBaseKw)
                    .sum();

            SocietyBlockResponse b = new SocietyBlockResponse();

            b.setId((targetSocId * 10) + (i + 1));
            b.setName("Block " + bName);
            b.setLiveKw(Math.round(liveKw * 10.0) / 10.0);
            b.setFlatCount((long) bDevices.size());
            b.setTodayKwh(Math.round(liveKw * 14.2 * 10.0) / 10.0);
            b.setMtdKwh(Math.round(liveKw * 320.0 * 10.0) / 10.0);
            b.setAboveAverage(i % 2 == 1);
            list.add(b);
        }
        return list;
    }

    public List<SocietyCommonAreaResponse> getSocietyCommonAreas(Long societyId) {
        long targetSocId = (societyId != null) ? societyId : 1L;
        return allDevices.stream()
                .filter(d -> d.getSocietyId() != null && d.getSocietyId().equals(targetSocId) && "COMMON_AREA_METER".equals(d.getDeviceType()))
                .map(d -> {
                    com.enera.backend.dto.society.SocietyCommonAreaResponse ca = new com.enera.backend.dto.society.SocietyCommonAreaResponse();
                    ca.setId(d.getCommonAreaId());
                    ca.setName(d.getCommonAreaName());
                    String name = d.getCommonAreaName() != null ? d.getCommonAreaName() : "";
                    ca.setCategory(name.contains("Lift") ? "Vertical Transport" :
                            name.contains("Pump") ? "Water Management" :
                            name.contains("Lighting") ? "Lighting" : "Amenities");
                    ca.setFloorOrLocation("Ground / Central");
                    ca.setType("Metered");
                    ca.setCurrentKw(d.getBaseKw() != null ? d.getBaseKw() : 0.0);
                    return ca;
                })
                .toList();
    }

    public List<SocietyFlatResponse> getSocietyFlats(Long societyId) {
        long targetSocId = (societyId != null) ? societyId : 1L;
        return allDevices.stream()
                .filter(d -> d.getSocietyId() != null && d.getSocietyId().equals(targetSocId) && "FLAT_METER".equals(d.getDeviceType()))
                .map(d -> {
                    boolean active = Boolean.TRUE.equals(d.getIsActive());
                    String fNum = d.getFlatNumber() != null ? d.getFlatNumber() : "A-101";
                    double base = d.getBaseKw() != null ? d.getBaseKw() : 1.0;

                    SocietyFlatResponse f = new SocietyFlatResponse();

                    f.setId(d.getFlatId());
                    f.setFlatNumber(fNum);
                    f.setBhkType(fNum.endsWith("1") || fNum.endsWith("5") ? "3 BHK" : "2 BHK");
                    f.setOccupied(active);
                    f.setResidentName(active ? "Resident " + fNum : null);
                    f.setBlockName("Block " + fNum.substring(0, 1));

                    long floor = 1L;

                    try {
                        floor = Long.parseLong(fNum.substring(2, 3));
                    } catch (Exception ignored) {}

                    f.setFloorNumber(floor);
                    f.setMeterStatus(active ? "live" : "offline");
                    f.setMtdKwh(active ? Math.round(base * 240.0 * 10.0) / 10.0 : 0.0);
                    return f;
                })
                .toList();
    }
}
