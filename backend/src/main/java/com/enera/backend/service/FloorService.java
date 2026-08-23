package com.enera.backend.service;

import com.enera.backend.dto.floor.CreateFloorRequest;
import com.enera.backend.dto.floor.FloorFlatResponse;
import com.enera.backend.dto.floor.FloorResponse;
import com.enera.backend.entity.*;
import com.enera.backend.exception.FloorNotFoundException;
import com.enera.backend.exception.SocietyNotFoundException;
import com.enera.backend.exception.UserNotFoundException;
import com.enera.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class FloorService {
    private final FloorRepository floorRepository;
    private final FlatRepository flatRepository;
    private final ReadingRepository readingRepository;
    private final DeviceRepository deviceRepository;
    private final BlockRepository blockRepository;
    private final UserRepository userRepository;
    private final FlatService flatService;
    private static final String online = "Live";
    private static final String offline = "Offline";

    FloorService(FloorRepository floorRepository,
                 ReadingRepository readingRepository,
                 FlatRepository flatRepository,
                 DeviceRepository deviceRepository,
                 UserRepository userRepository,
                 BlockRepository blockRepository,
                 FlatService flatService){
        this.floorRepository = floorRepository;
        this.readingRepository = readingRepository;
        this.flatRepository = flatRepository;
        this.deviceRepository = deviceRepository;
        this.userRepository = userRepository;
        this.blockRepository = blockRepository;
        this.flatService = flatService;
    }

    public List<FloorFlatResponse> getFloorFlats(Long floorId){
        List<FloorFlatResponse> responses = new ArrayList<>();

        Floor floor = floorRepository.findById(floorId).
                orElseThrow(()-> new FloorNotFoundException("Floor not found"));

        List<Flat> flats = flatRepository.findByFloorId(floorId);

        for(Flat flat : flats){
            FloorFlatResponse response = new FloorFlatResponse();

            Double mtdKwh =
                    readingRepository.getMonthKwhByFlatId(flat.getId());

            Boolean deviceOnline =
                    deviceRepository.getStatusByFlatId(flat.getId());

            User resident = userRepository.findFirstByFlatAndRoleOrderByIdDesc(flat, Role.RESIDENT)
                    .orElse(null);

            response.setId(flat.getId());
            response.setFlatNumber(flat.getFlatNumber());
            response.setBhkType(flat.getBhkType());
            response.setResidentName(resident != null ? resident.getName() : null);
            response.setMeterStatus(Boolean.TRUE.equals(deviceOnline) ? online : offline);
            response.setMtdKwh(mtdKwh);

            responses.add(response);
        }

        return responses;
    }

    @Transactional
    public FloorResponse createFloor(Long blockId, CreateFloorRequest request){
        Block block = blockRepository.findById(blockId).
                orElseThrow(()-> new SocietyNotFoundException("Block not found"));

        Floor floor = new Floor();
        floor.setFloorNumber(request.getFloorNumber());
        floor.setBlock(block);

        Floor saveFloor = floorRepository.save(floor);

        FloorResponse response = new FloorResponse();
        response.setFloorNumber(saveFloor.getFloorNumber());
        response.setId(saveFloor.getId());
        response.setBlockId(saveFloor.getBlock().getId());

        return response;
    }

    @Transactional
    public void deleteFloor(Long floorId){
        Floor floor = floorRepository.findById(floorId).orElseThrow(()-> new FloorNotFoundException("Floor not found"));

        List<Flat> flats = flatRepository.findByFloorId(floorId);

        for(Flat flat : flats){
            flatService.deleteFlat(flat.getId());
        }

        floorRepository.delete(floor);
    }
}
