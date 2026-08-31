package com.enera.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "flats", uniqueConstraints = {
        @UniqueConstraint(name = "uk_flat_floor_number", columnNames = {"floor_id", "flat_number"})
})
public class Flat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "floor_id",nullable = false)
    private Floor floor;

    @Column(name = "flat_number", nullable = false)
    private String flatNumber;

    @Column(name = "bhk_type", nullable = false)
    private String bhkType;

    @Column(nullable = false)
    private boolean status;
}
