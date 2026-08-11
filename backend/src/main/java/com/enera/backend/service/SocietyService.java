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
import java.time.LocalDate;
import java.time.LocalDateTime;
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

    SocietyService(SocietyRepository societyRepository,
                   ReadingRepository readingRepository,
                   FlatRepository flatRepository,
                   DeviceRepository deviceRepository,
                   BlockRepository blockRepository,
                   CommonAreaRepository commonAreaRepository,
                   UserRepository userRepository){
        this.societyRepository = societyRepository;
        this.readingRepository = readingRepository;
        this.flatRepository = flatRepository;
        this.deviceRepository = deviceRepository;
        this.blockRepository = blockRepository;
        this.commonAreaRepository = commonAreaRepository;
        this.userRepository = userRepository;
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
}
