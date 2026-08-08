package com.enera.backend.service;

import com.enera.backend.dto.society.*;
import com.enera.backend.entity.Block;
import com.enera.backend.entity.CommonArea;
import com.enera.backend.entity.Flat;
import com.enera.backend.entity.Society;
import com.enera.backend.exception.UserNotFoundException;
import com.enera.backend.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class SocietyService {
    private final SocietyRepository societyRepository;
    private final ReadingRepository readingRepository;
    private final FlatRepository flatRepository;
    private final DeviceRepository deviceRepository;
    private final BlockRepository blockRepository;
    private final CommonAreaRepository commonAreaRepository;

    SocietyService(SocietyRepository societyRepository,
                   ReadingRepository readingRepository,
                   FlatRepository flatRepository,
                   DeviceRepository deviceRepository,
                   BlockRepository blockRepository,
                   CommonAreaRepository commonAreaRepository){
        this.societyRepository = societyRepository;
        this.readingRepository = readingRepository;
        this.flatRepository = flatRepository;
        this.deviceRepository = deviceRepository;
        this.blockRepository = blockRepository;
        this.commonAreaRepository = commonAreaRepository;
    }

    public SocietyOverviewResponse getSocietyOverview(Long societyId){
        Society society = societyRepository.findById(societyId).
                orElseThrow(()-> new UserNotFoundException("Society not found"));

        Double liveKw = readingRepository.getLiveKwBySocietyId(societyId);

        Integer totalFlats = flatRepository.countByFloorBlockSocietyId(societyId);

        Integer occupiedFlats = flatRepository.countByFloorBlockSocietyIdAndStatus(societyId,true);

        Integer devicesOnline = deviceRepository.countBySocietyIdAndStatus(societyId,true);

        Integer devicesOffline = deviceRepository.countBySocietyIdAndStatus(societyId,false);

        LocalDateTime st = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime ed = LocalDateTime.now();
        Double mtdKwh = readingRepository.getMonthKwhBySociety(societyId,st,ed);

        Double mtdCost = mtdKwh/8;

        SocietyOverviewResponse response = new SocietyOverviewResponse();

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
                .orElseThrow(() -> new UserNotFoundException("Society not found"));

        List<Block> blocks = blockRepository.findBySocietyId(societyId);

        double totalKwh = 0;

        for (Block block : blocks) {
            Double kwh =
                    readingRepository.getMonthKwhBySocietyBlockId(block.getId());

            totalKwh += kwh;
        }

        double averageKwh = totalKwh / blocks.size();

        for(Block block : blocks) {
            SocietyBlockResponse response = new SocietyBlockResponse();

            Long id = block.getId();

            String name = block.getBlockName();

            Double mtdKwh = readingRepository.getMonthKwhBySocietyBlockId(id);

            Double liveKw = readingRepository.getLiveKwBySocietyBlockId(id);

            Long flatCount = flatRepository.countByFloorBlockId(id);

            Boolean aboveAbg = averageKwh <= readingRepository.getAverageKwhBySocietyBlockId(id) ;

            response.setId(id);
            response.setName(name);
            response.setMtdKwh(mtdKwh);
            response.setLiveKw(liveKw);
            response.setFlatCount(flatCount);
            response.setAboveAverage(aboveAbg);

            responses.add(response);
        }

        return responses;
    }

    public List<SocietyCommonAreaResponse> getSocietyCommonAreas(Long societyId){
        List<SocietyCommonAreaResponse> responses = new ArrayList<>();

        Society society = societyRepository.findById(societyId)
                .orElseThrow(() -> new UserNotFoundException("Society not found"));

        List<CommonArea> commonAreas = commonAreaRepository.findBySocietyId(societyId);

        for(CommonArea commonArea : commonAreas){
            SocietyCommonAreaResponse response = new SocietyCommonAreaResponse();

            Long id = commonArea.getId();

            Double currentKw = readingRepository.getCurrentKwByCommonAreaId(id);

            String type = commonArea.getCategory();

            response.setId(id);
            response.setCurrentKw(currentKw);
            response.setType(type);

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
                orElseThrow(()-> new UserNotFoundException("Society not found"));

        List<Flat> flats = flatRepository.findByFloorBlockSocietyId(societyId);


        for(Flat flat : flats){
            SocietyFlatResponse response = new SocietyFlatResponse();

            String name = flat.getFlatNumber();

            Long floorNumber = flat.getFloor().getFloorNumber();

            Double mtdKwh = readingRepository.getMonthKwhByFlatId(flat.getId());

            Boolean status = deviceRepository.getStatusByFlatId(flat.getId());

            response.setName(name);
            response.setFloorNumber(floorNumber);
            response.setMtdKwh(mtdKwh);
            response.setStatus(status);

            responses.add(response);
        }

        return responses;
    }
}
