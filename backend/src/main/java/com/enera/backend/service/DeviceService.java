package com.enera.backend.service;

import com.enera.backend.entity.Device;
import com.enera.backend.exception.DeviceNotFoundException;
import com.enera.backend.exception.SocietyNotFoundException;
import com.enera.backend.repository.*;
import org.springframework.stereotype.Service;

@Service
public class DeviceService {
    private final DeviceRepository deviceRepository;;

    DeviceService(DeviceRepository deviceRepository){
        this.deviceRepository = deviceRepository;
    }

    public void deRegisterDevice(Long deviceId){
        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(
                ()-> new DeviceNotFoundException("Device not found")
        );

        device.setStatus(false);

        deviceRepository.save(device);
    }
}
