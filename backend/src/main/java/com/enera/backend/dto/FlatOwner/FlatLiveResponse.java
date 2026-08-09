package com.enera.backend.dto.FlatOwner;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class FlatLiveResponse {
    private Boolean status;

    private LocalDateTime lastReadingAt;

    private Double kw;

    private String level;

    private Double pctVsUsual;

    private LocalDateTime timeStamp;
}
