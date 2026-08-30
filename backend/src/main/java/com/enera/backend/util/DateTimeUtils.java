package com.enera.backend.util;

import java.time.LocalDate;
import java.time.LocalDateTime;

public final class DateTimeUtils {

    private DateTimeUtils() {
        // This constructor prevent the instantiation of this class
    }

    public static LocalDateTime getStartOfCurrentMonth() {
        return LocalDate.now().withDayOfMonth(1).atStartOfDay();
    }

    public static LocalDateTime getStartOfPreviousMonth() {
        return LocalDate.now().minusMonths(1).withDayOfMonth(1).atStartOfDay();
    }

    public static LocalDateTime getEndOfPreviousMonth() {
        return LocalDate.now().withDayOfMonth(1).atStartOfDay();
    }

    public static LocalDateTime getStartOfDay(LocalDate date) {
        LocalDate target = (date != null) ? date : LocalDate.now();
        return target.atStartOfDay();
    }

    public static LocalDateTime getEndOfDay(LocalDate date) {
        LocalDate target = (date != null) ? date : LocalDate.now();
        return target.atStartOfDay().plusDays(1);
    }
}
