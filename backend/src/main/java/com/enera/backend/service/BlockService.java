package com.enera.backend.service;

import com.enera.backend.dto.block.BlockFloorResponse;
import com.enera.backend.dto.block.CreateBlockRequest;
import com.enera.backend.entity.*;
import com.enera.backend.exception.SocietyNotFoundException;
import com.enera.backend.exception.UserNotFoundException;
import com.enera.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class BlockService {
    private final FlatRepository flatRepository;
    private final BlockRepository blockRepository;
    private final FloorRepository floorRepository;
    private final ReadingRepository readingRepository;
    private final SocietyRepository societyRepository;
    private final DeviceRepository deviceRepository;
    private final UserRepository userRepository;
    private final FloorService floorService;

    BlockService(FlatRepository flatRepository,
                 BlockRepository blockRepository,
                 FloorRepository floorRepository,
                 ReadingRepository readingRepository,
                 SocietyRepository societyRepository,
                 DeviceRepository deviceRepository,
                 UserRepository userRepository,
                 FloorService floorService){
        this.flatRepository = flatRepository;
        this.blockRepository = blockRepository;
        this.floorRepository = floorRepository;
        this.readingRepository = readingRepository;
        this.societyRepository = societyRepository;
        this.deviceRepository = deviceRepository;
        this.userRepository = userRepository;
        this.floorService = floorService;
    }

    public List<BlockFloorResponse> getBlockFloors(Long blockId){
        List<BlockFloorResponse> responses = new ArrayList<>();

        Block block = blockRepository.findById(blockId)
                .orElseThrow(()-> new SocietyNotFoundException("Block not found"));

        List<Floor> floors = floorRepository.findByBlockId(blockId);

        for(Floor floor : floors){
            BlockFloorResponse response = new BlockFloorResponse();

            Double mtdKwh =
                    readingRepository.getMonthKwhByFloorId(floor.getId());

            Long flatCount = flatRepository.countByFloorId(floor.getId());

            response.setId(floor.getId());
            response.setFloorNumber(floor.getFloorNumber());
            response.setFlatCount(flatCount);
            response.setMtdKwh(mtdKwh);

            responses.add(response);
        }

        return responses;
    }

    public Block createBlock(CreateBlockRequest request) {
        Society society = societyRepository.findById(request.getSocietyId())
                .orElseThrow(() -> new SocietyNotFoundException("Society not found with id: " + request.getSocietyId()));

        Block block = new Block();
        block.setBlockName(request.getBlockName());
        block.setSociety(society);
        return blockRepository.save(block);
    }

    @Transactional
    public void deleteBlock(Long blockId){
        Block block = blockRepository.findById(blockId)
                .orElseThrow(()-> new SocietyNotFoundException("Block not found"));

        List<Floor> floors = floorRepository.findByBlockId(blockId);
        for(Floor floor : floors){
            floorService.deleteFloor(floor.getId());
        }

        blockRepository.delete(block);
    }
}
