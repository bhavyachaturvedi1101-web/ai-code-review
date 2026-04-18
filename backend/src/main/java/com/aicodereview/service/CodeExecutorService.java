package com.aicodereview.service;

import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.*;
import java.util.concurrent.*;

@Service
public class CodeExecutorService {

    private static final int TIMEOUT_SECONDS = 10;

    public String execute(String code, String language) {
        try {
            return switch (language != null ? language.toLowerCase() : "auto") {
                case "python" -> runPython(code);
                case "javascript", "typescript" -> runNode(code);
                case "java" -> runJava(code);
                default -> runNode(code); // fallback
            };
        } catch (Exception e) {
            return "Execution error: " + e.getMessage();
        }
    }

    private String runPython(String code) throws Exception {
        Path file = writeTemp("script.py", code);
        return runProcess(new String[]{"python", file.toString()}, file.getParent());
    }

    private String runNode(String code) throws Exception {
        Path file = writeTemp("script.js", code);
        return runProcess(new String[]{"node", file.toString()}, file.getParent());
    }

    private String runJava(String code) throws Exception {
        // Extract class name from code
        String className = extractClassName(code);
        Path dir = Files.createTempDirectory("javarun");
        Path file = dir.resolve(className + ".java");
        Files.writeString(file, code);

        // Compile
        String compileOut = runProcess(new String[]{"javac", file.toString()}, dir);
        if (!compileOut.isBlank() && compileOut.contains("error")) {
            return "Compile error:\n" + compileOut;
        }

        // Run
        return runProcess(new String[]{"java", "-cp", dir.toString(), className}, dir);
    }

    private String extractClassName(String code) {
        for (String line : code.split("\n")) {
            line = line.trim();
            if (line.startsWith("public class ")) {
                return line.split("\\s+")[2].replaceAll("[{].*", "").trim();
            }
        }
        return "Main";
    }

    private Path writeTemp(String filename, String code) throws Exception {
        Path dir = Files.createTempDirectory("coderun");
        Path file = dir.resolve(filename);
        Files.writeString(file, code);
        return file;
    }

    private String runProcess(String[] cmd, Path workDir) throws Exception {
        ProcessBuilder pb = new ProcessBuilder(cmd);
        pb.directory(workDir.toFile());
        pb.redirectErrorStream(true);

        Process process = pb.start();
        StringBuilder output = new StringBuilder();

        ExecutorService executor = Executors.newSingleThreadExecutor();
        Future<Void> future = executor.submit(() -> {
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                int lines = 0;
                while ((line = reader.readLine()) != null && lines < 100) {
                    output.append(line).append("\n");
                    lines++;
                }
            }
            return null;
        });

        boolean finished = process.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);
        if (!finished) {
            process.destroyForcibly();
            executor.shutdownNow();
            return "Execution timed out after " + TIMEOUT_SECONDS + " seconds.";
        }

        future.get(2, TimeUnit.SECONDS);
        executor.shutdown();

        return output.toString().isBlank() ? "(no output)" : output.toString().trim();
    }
}
