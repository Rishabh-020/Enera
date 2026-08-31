package com.enera.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "common_areas", uniqueConstraints = {
        @UniqueConstraint(name = "uk_common_area_society_name", columnNames = {"society_id", "name"})
})
public class CommonArea {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long  id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "society_id",nullable = false)
    private Society society;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String category;

    @Column(name = "floor_or_location", nullable = false)
    private String floorOrLocation;
}
