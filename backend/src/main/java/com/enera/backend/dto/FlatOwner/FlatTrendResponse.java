package com.enera.backend.dto.FlatOwner;

import lombok.Data;
import java.util.List;

@Data
public class FlatTrendResponse {
    private List<TrendPointResponse> points;

    private Double pctChange;
}
