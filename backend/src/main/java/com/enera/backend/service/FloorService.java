package com.enera.backend.service;

import com.enera.backend.dto.floor.FloorFlatResponse;
import com.enera.backend.entity.Flat;
import com.enera.backend.entity.Floor;
import com.enera.backend.entity.Role;
import com.enera.backend.entity.User;
import com.enera.backend.exception.FloorNotFoundException;
import com.enera.backend.exception.UserNotFoundException;
import com.enera.backend.repository.DeviceRepository;
import com.enera.backend.repository.FlatRepository;
import com.enera.backend.repository.FloorRepository;
import com.enera.backend.repository.ReadingRepository;
import com.enera.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class FloorService {
    private final FloorRepository floorRepository;
    private final FlatRepository flatRepository;
    private final ReadingRepository readingRepository;
    private final DeviceRepository deviceRepository;
    private final UserRepository userRepository;

    FloorService(FloorRepository floorRepository,
                 ReadingRepository readingRepository,
                 FlatRepository flatRepository,
                 DeviceRepository deviceRepository,
                 UserRepository userRepository){
        this.floorRepository = floorRepository;
        this.readingRepository = readingRepository;
        this.flatRepository = flatRepository;
        this.deviceRepository = deviceRepository;
        this.userRepository = userRepository;
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

            User resident = userRepository.findByFlatAndRole(flat, Role.RESIDENT)
                    .orElse(null);

            response.setId(flat.getId());
            response.setFlatNumber(flat.getFlatNumber());
            response.setBhkType(flat.getBhkType());
            response.setResidentName(resident != null ? resident.getName() : null);
            response.setMeterStatus(Boolean.TRUE.equals(deviceOnline) ? "live" : "offline");
            response.setMtdKwh(mtdKwh);

            responses.add(response);
        }

        return responses;
    }
}
