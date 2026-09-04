# Stage 1: Build the application
FROM maven:3.9.6-eclipse-temurin-21 AS builder
WORKDIR /app

# Copy pom.xml and download dependencies to leverage Docker layer caching
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build the JAR (skipping unit tests for fast release builds)
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Production runtime environment
FROM eclipse-temurin:21-jre
WORKDIR /app

# Create a non-root user for security best practices
RUN addgroup --system spring && adduser --system spring --ingroup spring
USER spring:spring

# Copy the built JAR from builder stage
COPY --from=builder --chown=spring:spring /app/target/*.jar app.jar

# Expose backend port
EXPOSE 8080

# Run Spring Boot application
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]