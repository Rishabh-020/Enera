package com.enera.backend.service;

import com.enera.backend.dto.floor.FloorFlatResponse;
import com.enera.backend.entity.Flat;
import com.enera.backend.entity.Floor;
import com.enera.backend.exception.UserNotFoundException;
import com.enera.backend.repository.DeviceRepository;
import com.enera.backend.repository.FlatRepository;
import com.enera.backend.repository.FloorRepository;
import com.enera.backend.repository.ReadingRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class FloorService {
    private final FloorRepository floorRepository;
    private final FlatRepository flatRepository;
    private final ReadingRepository readingRepository;
    private final DeviceRepository deviceRepository;

    FloorService(FloorRepository floorRepository,
                 ReadingRepository readingRepository,
                 FlatRepository flatRepository,
                 DeviceRepository deviceRepository){
        this.floorRepository = floorRepository;
        this.readingRepository = readingRepository;
        this.flatRepository = flatRepository;
        this.deviceRepository = deviceRepository;
    }

    public List<FloorFlatResponse> getFloorFlats(Long floorId){
        List<FloorFlatResponse> responses = new ArrayList<>();

        Floor floor = floorRepository.findById(floorId).
                orElseThrow(()-> new UserNotFoundException("Flat not found"));

            List<Flat> flats = flatRepository.findByFloorId(floorId);

        for(Flat flat : flats){
             FloorFlatResponse response = new FloorFlatResponse();

            Double mtdKwh =
                    readingRepository.getMonthKwhByFlatId(flat.getId());

            Boolean status =
                    deviceRepository.getStatusByFlatId(flat.getId());

            response.setStatus(status);

            response.setMtdKwh(mtdKwh);

            response.setId(flat.getId());

            response.setStatus(status);

            responses.add(response);
        }

        return responses;
    }


}
