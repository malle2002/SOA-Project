package mk.ukim.mk.order_service.web.dao;

public record SendMailRequest (
    String to,
    String subject,
    String text){
}
