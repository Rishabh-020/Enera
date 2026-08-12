package com.enera.backend.service;

import com.enera.backend.dto.block.BlockFloorResponse;
import com.enera.backend.entity.Block;
import com.enera.backend.entity.Floor;
import com.enera.backend.exception.SocietyNotFoundException;
import com.enera.backend.exception.UserNotFoundException;
import com.enera.backend.repository.BlockRepository;
import com.enera.backend.repository.FlatRepository;
import com.enera.backend.repository.FloorRepository;
import com.enera.backend.repository.ReadingRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class BlockService {
    private final FlatRepository flatRepository;
    private final BlockRepository blockRepository;
    private final FloorRepository floorRepository;
    private final ReadingRepository readingRepository;

    BlockService(FlatRepository flatRepository,
                 BlockRepository blockRepository,
                 FloorRepository floorRepository,
                 ReadingRepository readingRepository){
        this.flatRepository = flatRepository;
        this.blockRepository = blockRepository;
        this.floorRepository = floorRepository;
        this.readingRepository = readingRepository;
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
}
