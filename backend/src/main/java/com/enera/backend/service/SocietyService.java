package com.enera.backend.service;

import com.enera.backend.dto.device.RegisterDeviceRequest;
import com.enera.backend.dto.device.RegisterDeviceResponse;
import com.enera.backend.dto.society.*;
import com.enera.backend.entity.*;
import com.enera.backend.exception.DuplicateDeviceException;
import com.enera.backend.exception.FlatNotFoundException;
import com.enera.backend.exception.SocietyNotFoundException;
import com.enera.backend.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.sql.Timestamp;
import java.util.*;

@Service
public class SocietyService {
    private final SocietyRepository societyRepository;
    private final ReadingRepository readingRepository;
    private final FlatRepository flatRepository;
    private final DeviceRepository deviceRepository;
    private final BlockRepository blockRepository;
    private final CommonAreaRepository commonAreaRepository;
    private final UserRepository userRepository;
    private final BuilderRepository builderRepository;

    SocietyService(SocietyRepository societyRepository,
                   ReadingRepository readingRepository,
                   FlatRepository flatRepository,
                   DeviceRepository deviceRepository,
                   BlockRepository blockRepository,
                   CommonAreaRepository commonAreaRepository,
                   UserRepository userRepository,
                   BuilderRepository builderRepository){
        this.societyRepository = societyRepository;
        this.readingRepository = readingRepository;
        this.flatRepository = flatRepository;
        this.deviceRepository = deviceRepository;
        this.blockRepository = blockRepository;
        this.commonAreaRepository = commonAreaRepository;
        this.userRepository = userRepository;
        this.builderRepository = builderRepository;
    }

    public SocietyOverviewResponse getSocietyOverview(Long societyId){
        Society society = societyRepository.findById(societyId).
                orElseThrow(()-> new SocietyNotFoundException("Society not found"));

        Double liveKw = readingRepository.getLiveKwBySocietyId(societyId);

        Integer totalFlats = flatRepository.countByFloorBlockSocietyId(societyId);

        Integer occupiedFlats = flatRepository.countByFloorBlockSocietyIdAndStatus(societyId,true);

        Integer devicesOnline = deviceRepository.countBySocietyIdAndStatus(societyId,true);

        Integer devicesOffline = deviceRepository.countBySocietyIdAndStatus(societyId,false);

        LocalDateTime st = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime ed = LocalDateTime.now();
        Double mtdKwh = readingRepository.getMonthKwhBySociety(societyId,st,ed);

        Double mtdCost = mtdKwh * 8;

        SocietyOverviewResponse response = new SocietyOverviewResponse();

        response.setName(society.getName());
        response.setLiveKw(liveKw);
        response.setTotalFlats(totalFlats);
        response.setOccupiedFlats(occupiedFlats);
        response.setDevicesOnline(devicesOnline);
        response.setDevicesOffline(devicesOffline);
        response.setMtdKwh(mtdKwh);
        response.setMtdCost(mtdCost);

        return response;
    }

    public List<SocietyBlockResponse> getSocietyBlocks(Long societyId){
        List<SocietyBlockResponse> responses = new ArrayList<>();

        Society society = societyRepository.findById(societyId)
                .orElseThrow(() -> new SocietyNotFoundException("Society not found"));

        List<Block> blocks = blockRepository.findBySocietyId(societyId);

        // Calculate kWh for each block in a single pass, avoid double-querying
        Map<Long, Double> blockKwhMap = new HashMap<>();
        double totalKwh = 0;

        for (Block block : blocks) {
            Double kwh = readingRepository.getMonthKwhBySocietyBlockId(block.getId());
            blockKwhMap.put(block.getId(), kwh);
            totalKwh += kwh;
        }

        double averageKwh = blocks.isEmpty() ? 0 : totalKwh / blocks.size();

        for(Block block : blocks) {
            SocietyBlockResponse response = new SocietyBlockResponse();

            Long id = block.getId();
            Double mtdKwh = blockKwhMap.get(id);
            Double liveKw = readingRepository.getLiveKwBySocietyBlockId(id);
            Long flatCount = flatRepository.countByFloorBlockId(id);
            Boolean aboveAvg = mtdKwh > averageKwh * 1.05;

            response.setId(id);
            response.setName(block.getBlockName());
            response.setMtdKwh(mtdKwh);
            response.setLiveKw(liveKw);
            response.setFlatCount(flatCount);
            response.setAboveAverage(aboveAvg);
            // todayKwh is not yet implemented — set to 0 for now
            response.setTodayKwh(0.0);

            responses.add(response);
        }

        return responses;
    }

    public List<SocietyCommonAreaResponse> getSocietyCommonAreas(Long societyId){
        List<SocietyCommonAreaResponse> responses = new ArrayList<>();

        Society society = societyRepository.findById(societyId)
                .orElseThrow(() -> new SocietyNotFoundException("Society not found"));

        List<CommonArea> commonAreas = commonAreaRepository.findBySocietyId(societyId);

        for(CommonArea commonArea : commonAreas){
            SocietyCommonAreaResponse response = new SocietyCommonAreaResponse();

            Long id = commonArea.getId();
            Double currentKw = readingRepository.getCurrentKwByCommonAreaId(id);

            response.setId(id);
            response.setName(commonArea.getName());
            response.setCategory(commonArea.getCategory());
            response.setFloorOrLocation(commonArea.getFloorOrLocation());
            response.setType(commonArea.getCategory());
            response.setCurrentKw(currentKw);

            responses.add(response);
        }

        return responses;
    }

    public double[][] getSocietyHeatmap(Long societyId) {

        List<Object[]> data =
                readingRepository.getSocietyHeatmap(societyId);

        double[][] grid = new double[7][24];

        for (Object[] row : data) {

            int day = ((Number) row[0]).intValue();
            int hour = ((Number) row[1]).intValue();

            double avgKw =
                    ((Number) row[2]).doubleValue();

            grid[day][hour] =
                    Math.round(avgKw * 100.0) / 100.0;
        }

        return grid;
    }

    public List<SocietyFlatResponse> getSocietyFlatResponse(Long societyId){
        List<SocietyFlatResponse> responses = new ArrayList<>();

        Society society = societyRepository.findById(societyId).
                orElseThrow(()-> new SocietyNotFoundException("Society not found"));

        List<Flat> flats = flatRepository.findByFloorBlockSocietyId(societyId);

        for(Flat flat : flats){
            SocietyFlatResponse response = new SocietyFlatResponse();

            response.setId(flat.getId());
            response.setFlatNumber(flat.getFlatNumber());
            response.setBhkType(flat.getBhkType());
            response.setOccupied(flat.isStatus());

            // Get resident name from user linked to this flat
            User resident = userRepository.findByFlatAndRole(flat, Role.RESIDENT)
                    .orElse(null);
            response.setResidentName(resident != null ? resident.getName() : null);

            // Get block name via floor -> block
            response.setBlockName(flat.getFloor().getBlock().getBlockName());
            response.setFloorNumber(flat.getFloor().getFloorNumber());

            Double mtdKwh = readingRepository.getMonthKwhByFlatId(flat.getId());
            response.setMtdKwh(mtdKwh);

            // Map boolean device status to string status for frontend
            Boolean deviceOnline = deviceRepository.getStatusByFlatId(flat.getId());
            response.setMeterStatus(Boolean.TRUE.equals(deviceOnline) ? "live" : "offline");

            responses.add(response);
        }

        return responses;
    }

    public List<SocietyDeviceResponse> getSocietyDevice(Long societyId){
        Society society = societyRepository.findById(societyId).
                orElseThrow(()-> new SocietyNotFoundException("Society not found"));

        List<Device> devices = deviceRepository.findBySocietyId(societyId);

        List<SocietyDeviceResponse> responses = new ArrayList<>();

        // This will assign proper naming for the device, to whom it is mapped to

        for(Device device : devices){
            SocietyDeviceResponse response = new SocietyDeviceResponse();

            if(device.getFlat() != null){
                response.setMappedTo(device.getFlat().getFlatNumber());
            }else{
                response.setMappedTo(device.getCommonArea().getCategory());
            }

            response.setMeterStatus(device.isStatus());
            response.setLastSeenAt(device.getLastSeenAt());

            responses.add(response);
        }

        return responses;
    }

    public RegisterDeviceResponse registerDevice(Long societyId, RegisterDeviceRequest request){
        Society society = societyRepository.findById(societyId).
                orElseThrow(()-> new SocietyNotFoundException("Society does not exist"));

        Long deviceSerial = request.getDeviceSerial();

        Device existingDevice = deviceRepository.findByDeviceSerial(deviceSerial)
                .orElse(null);

        if (existingDevice != null) {
            throw new DuplicateDeviceException("Device already registered");
        }

        Device device = new Device();

        String deviceType = request.getDeviceType();
        Long flatId = request.getFlatId();
        Long commonAreaId = request.getCommonAreaId();

        device.setDeviceSerial(deviceSerial);
        device.setDeviceType(deviceType);
        device.setSociety(society);

        LocalDateTime time = LocalDateTime.now();

        device.setLastSeenAt(time);

        if(request.getFlatId() != null){
            Flat flat = flatRepository.findById(flatId).orElseThrow(
                    ()-> new FlatNotFoundException("Flat not found")
            );

            device.setFlat(flat);
        }else{
            CommonArea commonArea = commonAreaRepository.findById(commonAreaId).orElseThrow(
                    ()-> new FlatNotFoundException("Common Area not found")
            );

            device.setCommonArea(commonArea);
        }

        Device savedDevice = deviceRepository.save(device);

        RegisterDeviceResponse  response = new RegisterDeviceResponse();

        String mappedTo = savedDevice.getFlat() != null ? "Flat" : "Common Area";

        response.setSocietyId(savedDevice.getSociety().getId());
        response.setDeviceSerial(savedDevice.getDeviceSerial());
        response.setDeviceType(savedDevice.getDeviceType());
        response.setMappedTo(mappedTo);

        return response;
    }

    public List<DailyTrendResponse> getDailyTrend(Long societyId,int date){
        Society society = societyRepository.findById(societyId).
                orElseThrow(() -> new SocietyNotFoundException("Society not found"));

        List<Object[]> rows = readingRepository.getDailyTrendBySociety(societyId,date);

        List<DailyTrendResponse> responses = new ArrayList<>();

        for(Object[] row : rows){
            String dateStr = (String) row[0];
            double totalKwh = ((Number) row[1]).doubleValue();
            double commonAreaKwh = ((Number) row[2]).doubleValue();

            responses.add(DailyTrendResponse.builder()
                    .date(dateStr)
                    .totalKwh(Math.round(totalKwh*10.0)/10.0)
                    .commonAreaKwh(Math.round(commonAreaKwh*10.0)/10.0)
                    .build());
        }

        return responses;
    }

    public List<HourlyBreakDownResponse> getHourlyBreakDown(Long societyId,LocalDate date){
        Society society = societyRepository.findById(societyId).
                orElseThrow(() -> new SocietyNotFoundException("Society not found"));

        if (date == null) {
            date = LocalDate.now();
        }


        List<HourlyBreakDownResponse> response = new ArrayList<>();

        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = start.plusDays(1);

        List<Object[]> rows = readingRepository.getHourlyBreakdownByDate(
                        societyId,start,end
        );


        for (Object[] row : rows) {
            int hourNum = ((Number) row[0]).intValue();
            String hour = hourNum + ":00";

            double totalFlatKwh = ((Number) row[1]).doubleValue();
            double commonKwh = ((Number) row[2]).doubleValue();

            double baseKwh = Math.round(totalFlatKwh * 0.30 * 10.0) / 10.0;
            double societyKwh = Math.round(totalFlatKwh * 0.50 * 10.0) / 10.0;
            double peekKwh = Math.round(totalFlatKwh * 0.20 * 10.0) / 10.0;
            double commonAreaKwh = Math.round(commonKwh * 10.0) / 10.0;

            response.add(new HourlyBreakDownResponse(hour, baseKwh, societyKwh, commonAreaKwh, peekKwh));
        }

        return response;
    }

    public List<SocietyAnomaliesResponse> getAnomalies(Long societyId) {
        Society society = societyRepository.findById(societyId)
                .orElseThrow(() -> new SocietyNotFoundException("Society not found"));

        List<Object[]> readings = readingRepository.findAnomaliesBySociety(societyId);
        List<SocietyAnomaliesResponse> responses = new ArrayList<>();

        for (Object[] reading : readings) {
            Long id = ((Number) reading[0]).longValue();
            String flatNumber = (String) reading[1];
            String blockName = (String) reading[2];
            double currentKw = ((Number) reading[3]).doubleValue();
            double expectedKw = Math.round(((Number) reading[4]).doubleValue() * 10.0) / 10.0;

            Object tsObj = reading[5];
            String detectedAtStr;
            if (tsObj instanceof java.sql.Timestamp) {
                detectedAtStr = ((java.sql.Timestamp) tsObj).toLocalDateTime().toString();
            } else if (tsObj instanceof LocalDateTime) {
                detectedAtStr = ((LocalDateTime) tsObj).toString();
            } else if (tsObj != null) {
                detectedAtStr = tsObj.toString();
            } else {
                detectedAtStr = LocalDateTime.now().toString();
            }

            double ratio = expectedKw > 0 ? Math.round((currentKw / expectedKw) * 10.0) / 10.0 : 2.5;

            SocietyAnomaliesResponse response = new SocietyAnomaliesResponse();
            response.setId(id);
            response.setFlat("Flat " + flatNumber);
            response.setFlatId("Flat " + flatNumber);
            response.setFlatNumber(flatNumber);
            response.setBlockName(blockName);
            response.setCurrentKw(currentKw);
            response.setExpectedKw(expectedKw);
            response.setMultiplier(ratio + "x usual");
            response.setDesc("Drawing " + currentKw + " kW — expected " + expectedKw + " kW");
            response.setDescription("Drawing " + currentKw + " kW — expected " + expectedKw + " kW");
            response.setDetectedAt(detectedAtStr);
            response.setResolved(false);

            responses.add(response);
        }

        return responses;
    }

    public SocietyResponse createSociety(CreateSocietyRequest request) {
        Builder builder = builderRepository.findById(request.getBuilderId())
                .orElseThrow(() -> new RuntimeException("Builder not found with id: " + request.getBuilderId()));

        Society society = new Society();
        society.setName(request.getName());
        society.setBuilder(builder);
        society.setAddress(request.getAddress());
        society.setCity(request.getCity());
        society.setTotalBlocks(request.getTotalBlocks());

        Society saved = societyRepository.save(society);

        SocietyResponse response = new SocietyResponse();
        response.setId(saved.getId());
        response.setName(saved.getName());
        response.setBuilderId(builder.getId());
        response.setAddress(saved.getAddress());
        response.setCity(saved.getCity());
        response.setTotalBlocks(saved.getTotalBlocks());
        response.setCreatedAt(saved.getCreatedAt());

        return response;
    }
}
