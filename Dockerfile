FROM eclipse-temurin:21-jdk-jammy AS build

WORKDIR /workspace

COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN chmod +x mvnw

COPY src src

RUN ./mvnw -DskipTests package \
    && JAR_FILE="$(find target -maxdepth 1 -name '*.jar' ! -name '*.original' | head -n 1)" \
    && cp "$JAR_FILE" target/app.jar

FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

ENV JAVA_OPTS=""

COPY --from=build /workspace/target/app.jar /app/app.jar

EXPOSE 8080

CMD ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
