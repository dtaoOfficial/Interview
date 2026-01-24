# ==========================================
# STAGE 1: Build using Official Maven Image
# ==========================================
# We use a Docker image that already has Maven installed
# So we don't need the local 'mvnw' or '.mvn' folder
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app

# 1. Copy only the pom.xml first (to cache dependencies)
COPY pom.xml .

# 2. Download dependencies (Offline mode)
RUN mvn dependency:go-offline -B

# 3. Copy the source code
COPY src src

# 4. Build the application (Skip tests for speed)
RUN mvn clean package -DskipTests

# ==========================================
# STAGE 2: Run the Application
# ==========================================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# 1. Copy the built JAR from Stage 1
COPY --from=build /app/target/*.jar app.jar

# 2. Create uploads directory
RUN mkdir -p /app/uploads

# 3. Expose port
EXPOSE 8080

# 4. Start the app
ENTRYPOINT ["java", "-jar", "app.jar"]