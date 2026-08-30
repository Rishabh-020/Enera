package com.enera.backend.repository;

import com.enera.backend.entity.Builder;
import com.enera.backend.entity.Society;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Objects;
import java.util.Optional;


@Repository
public interface SocietyRepository extends JpaRepository<Society,Long> {
    List<Society> findByBuilder(Builder builder);

    List<Society> findByCity(String city);

    Optional<Society> findByBuilderAndName(Builder builder, String name);

    Optional<Society> findFirstByBuilderAndName(Builder builder, String name);

    Optional<Society> findFirstByBuilderAndNameOrderByIdAsc(Builder builder, String name);

    boolean existsByBuilderAndName(Builder builder, String name);

    Integer countByBuilderId(Long builderId);

    List<Society> findByBuilderId(Long builderId);
}
