package com.chargeback.responder;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.nio.charset.StandardCharsets;

@SpringBootApplication
public class ChargebackResponderApplication {

    public static void main(String[] args) {
        loadDotenv();
        SpringApplication.run(ChargebackResponderApplication.class, args);
    }

    /**
     * Automatically discover and load .env variables into JVM System properties
     * so that Spring Boot's ${...} placeholders resolve seamlessly in development and production.
     */
    private static void loadDotenv() {
        File[] candidates = new File[] {
                new File(".env"),
                new File("../.env"),
                new File("../../.env")
        };

        for (File envFile : candidates) {
            if (envFile.exists() && envFile.isFile()) {
                System.out.println("[ChargebackResponder] Loading real environment configuration from: " + envFile.getAbsolutePath());
                try (BufferedReader reader = new BufferedReader(new FileReader(envFile, StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#") || !line.contains("=")) {
                            continue;
                        }
                        int eqIdx = line.indexOf('=');
                        String key = line.substring(0, eqIdx).trim();
                        String value = line.substring(eqIdx + 1).trim();
                        if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
                            value = value.substring(1, value.length() - 1);
                        }
                        if (System.getProperty(key) == null && System.getenv(key) == null) {
                            System.setProperty(key, value);
                        }
                    }
                } catch (Exception e) {
                    System.err.println("[ChargebackResponder] Warning: Failed to parse .env file: " + e.getMessage());
                }
                break;
            }
        }
    }
}

