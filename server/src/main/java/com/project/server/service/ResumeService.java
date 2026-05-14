package com.project.server.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

@Service
public class ResumeService {

    @Autowired
    private AIService aiService;

    public Object parseResume(
            MultipartFile file
    ) {

        try {

            String filename =
                    file.getOriginalFilename();

            if (filename == null) {
                return Map.of(
                        "error",
                        "Invalid file"
                );
            }

            String text = "";

            // PDF
            if (filename.endsWith(".pdf")) {

                InputStream inputStream =
                        file.getInputStream();

                var document =
                        Loader.loadPDF(
                                file.getBytes()
                        );

                PDFTextStripper stripper =
                        new PDFTextStripper();

                text = stripper.getText(document);

                document.close();
            }

            // DOCX
            else if (
                    filename.endsWith(".docx")
            ) {

                InputStream inputStream =
                        file.getInputStream();

                XWPFDocument document =
                        new XWPFDocument(inputStream);

                XWPFWordExtractor extractor =
                        new XWPFWordExtractor(document);

                text = extractor.getText();

                extractor.close();
                document.close();
            }

            else {

                return Map.of(
                        "error",
                        "Only PDF and DOCX supported"
                );
            }

            Map<String, Object> response =
                    new HashMap<>();

            response.put("text", text);

            return response;

        } catch (Exception e) {

            return Map.of(
                    "error",
                    e.getMessage()
            );
        }
    }
}