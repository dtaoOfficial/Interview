# ==========================================
# STAGE 1: Build the Application
# ==========================================
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# 1. Copy Maven wrapper and POM first (to cache dependencies)
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# 2. Give permission to execute Maven
RUN chmod +x mvnw

# 3. Download dependencies (This layer will be cached if pom.xml doesn't change)
RUN ./mvnw dependency:go-offline

# 4. Copy the actual source code
COPY src src

# 5. Build the JAR file (Skipping tests to speed up the build)
RUN ./mvnw clean package -DskipTests

# ==========================================
# STAGE 2: Run the Application
# ==========================================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# 1. Copy the built JAR from the build stage
COPY --from=build /app/target/*.jar app.jar

# 2. Create the uploads directory to prevent "File not found" errors
RUN mkdir -p /app/uploads

# 3. Expose the port (matches your application.properties default)
EXPOSE 8080

# 4. Start the application
ENTRYPOINT ["java", "-jar", "app.jar"]