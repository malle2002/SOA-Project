package mk.ukim.mk.order_service.service;

public interface MailService {
    void sendMail(String to, String subject, String text);
}
