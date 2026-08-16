package com.enera.backend.mock;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class DemoReading {
    private Long deviceId;

    private Long deviceSerial;

    private String deviceType;

    private Long societyId;

    private Long flatId;

    private String flatNumber;

    private Long commonAreaId;

    private String commonAreaName;

    private double kw;

    private double kwh;

    private String timestamp;

    private boolean isDemo;

    public String toJson() {
        return "{"
                + "\"deviceId\":" + (deviceId != null ? deviceId : 0) + ","
                + "\"deviceSerial\":" + (deviceSerial != null ? deviceSerial : 0) + ","
                + "\"deviceType\":\"" + (deviceType != null ? deviceType : "") + "\","
                + "\"societyId\":" + (societyId != null ? societyId : 0) + ","
                + "\"flatId\":" + (flatId != null ? flatId : "null") + ","
                + "\"flatNumber\":" + (flatNumber != null ? ("\"" + flatNumber + "\"") : "null") + ","
                + "\"commonAreaId\":" + (commonAreaId != null ? commonAreaId : "null") + ","
                + "\"commonAreaName\":" + (commonAreaName != null ? ("\"" + commonAreaName + "\"") : "null") + ","
                + "\"kw\":" + kw + ","
                + "\"kwh\":" + kwh + ","
                + "\"timestamp\":\"" + (timestamp != null ? timestamp : "") + "\","
                + "\"isDemo\":" + isDemo
                + "}";
    }
}


