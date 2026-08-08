package com.enera.backend.service;

import com.enera.backend.dto.block.BlockFlatsResponse;
import com.enera.backend.entity.Block;
import com.enera.backend.entity.Flat;
import com.enera.backend.exception.UserNotFoundException;
import com.enera.backend.repository.BlockRepository;
import com.enera.backend.repository.FlatRepository;
import com.enera.backend.repository.ReadingRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class BlockService {
    private final FlatRepository flatRepository;
    private final BlockRepository blockRepository;
    private final ReadingRepository readingRepository;

    BlockService(FlatRepository flatRepository,
                 BlockRepository blockRepository,
                 ReadingRepository readingRepository){
        this.flatRepository = flatRepository;
        this.blockRepository = blockRepository;
        this.readingRepository = readingRepository;
    }

    public List<BlockFlatsResponse> getBlockFlats(Long blockId){
        List<BlockFlatsResponse> responses = new ArrayList<>();

        Block block = blockRepository.findById(blockId)
                .orElseThrow(()-> new UserNotFoundException("Block not found"));

        List<Flat> flats = flatRepository.findByFloorBlockId(blockId);

        for(Flat flat : flats){
            BlockFlatsResponse response = new BlockFlatsResponse();

            Double mtdKwh =
                    readingRepository.getMonthKwhByFlatId(flat.getId());


            Long flatCount = flatRepository.countByFloorId(flat.getId());
            response.setId(flat.getId());
            response.setFlatCount(flatCount);
            response.setMtdKwh(mtdKwh);
            response.setFloorNumber(flat.getFlatNumber());

            responses.add(response);
        }

        return responses;
    }
}
