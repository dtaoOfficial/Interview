package com.dtao.resume.service;

import com.dtao.resume.model.Application;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender javaMailSender;

    // ✅ Inject HR Email from application.properties
    @Value("${app.hr.email}")
    private String hrEmail;

    // ✅ Inject Sender Email from application.properties
    @Value("${app.mail.from}")
    private String fromEmail;

    // ✅ Inject Custom Sender Name (e.g., "New Horizon HR Team")
    @Value("${app.mail.sender-name}")
    private String senderName;

    // =========================================================================
    // 1. Send "Thank You" Email to Candidate
    // =========================================================================
    public void sendCandidateSuccessEmail(String toEmail, String candidateName, String jobId) {
        String subject = "Application Received - Job ID: " + jobId;

        String htmlContent = "<html><body style='font-family: Arial, sans-serif; color: #333;'>" +
                "<div style='background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #1a1a54;'>" +
                "<h2 style='color: #1a1a54; margin:0;'>New Horizon Recruitment</h2>" +
                "</div>" +
                "<div style='padding: 20px;'>" +
                "<h3>Hi " + candidateName + ",</h3>" +
                "<p>Thank you for applying for the position (Job ID: <b>" + jobId + "</b>) at New Horizon.</p>" +
                "<p>We have successfully received your application, resume, and interview details.</p>" +
                "<p>Our HR team will review your profile and get back to you shortly regarding the next steps.</p>" +
                "<br/>" +
                "<p>Best Regards,<br/><b>New Horizon HR Team</b></p>" +
                "</div>" +
                "<div style='background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; color: #666;'>" +
                "© New Horizon Educational Institution" +
                "</div>" +
                "</body></html>";

        sendHtmlEmail(toEmail, subject, htmlContent);
    }

    // =========================================================================
    // 2. Send "New Application" Alert to HR
    // =========================================================================
    public void sendHrAlertEmail(Application application) {
        String subject = "NEW APPLICANT: " + application.getCandidateName();
        String videoStatus = (application.getVideoPath() != null) ? "✅ Video Interview Completed" : "⚠️ No Video Submitted";

        String htmlContent = "<html><body style='font-family: Arial, sans-serif; color: #333;'>" +
                "<div style='background-color: #1a1a54; padding: 15px; color: white; text-align: center;'>" +
                "<h2>New Candidate Application</h2>" +
                "</div>" +
                "<div style='padding: 20px; border: 1px solid #ddd;'>" +
                "<p><b>Name:</b> " + application.getCandidateName() + "</p>" +
                "<p><b>Email:</b> " + application.getEmail() + "</p>" +
                "<p><b>Phone:</b> " + application.getPhone() + "</p>" +
                "<p><b>Job ID:</b> " + application.getJobId() + "</p>" +
                "<p><b>Video Status:</b> " + videoStatus + "</p>" +
                "<br/>" +
                "<a href='http://localhost:5173/login' style='background-color: #d32f2f; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;'>Login to Admin Portal</a>" +
                "</div>" +
                "</body></html>";

        sendHtmlEmail(hrEmail, subject, htmlContent);
    }

    // =========================================================================
    // ✅ CORE HELPER: Sends Email using JavaMailSender (SMTP)
    // =========================================================================
    private void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            // ✅ Set From Address WITH Sender Name
            helper.setFrom(fromEmail, senderName);

            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true); // true = HTML content

            javaMailSender.send(message);
            log.info("✅ Email sent successfully to: {}", to);

        } catch (MessagingException | UnsupportedEncodingException e) {
            log.error("❌ Failed to send email to {}: {}", to, e.getMessage());
            // We catch the error so it doesn't crash the application submission
        }
    }
}