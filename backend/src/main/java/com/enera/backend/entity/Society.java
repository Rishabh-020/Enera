package com.enera.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@Entity
@Table(name = "societies", uniqueConstraints = {
        @UniqueConstraint(name = "uk_society_builder_name", columnNames = {"builder_id", "name"})
})
public class Society {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "builder_id",nullable = false)
    private Builder builder;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private String city;

    @Column(name = "total_blocks",nullable = false)
    private  Long totalBlocks;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false,updatable = false)
    private LocalDateTime createdAt;

}
