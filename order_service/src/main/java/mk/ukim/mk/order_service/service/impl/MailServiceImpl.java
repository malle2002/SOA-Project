package mk.ukim.mk.order_service.service.impl;

import lombok.extern.log4j.Log4j2;
import mk.ukim.mk.order_service.messaging.OrderProducer;
import mk.ukim.mk.order_service.models.OrderNotification;
import mk.ukim.mk.order_service.repository.OrderNotificationRepository;
import mk.ukim.mk.order_service.service.MailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@Log4j2
public class MailServiceImpl implements MailService {
    private final JavaMailSender javaMailSender;
    private final OrderNotificationRepository orderNotificationRepository;
    private final OrderProducer orderProducer;
    @Autowired
    private Environment env;

    public MailServiceImpl(JavaMailSender javaMailSender, OrderNotificationRepository orderNotificationRepository, OrderProducer orderProducer) {
        this.javaMailSender = javaMailSender;
        this.orderNotificationRepository = orderNotificationRepository;
        this.orderProducer = orderProducer;
    }

    @Override
    public void sendMail(String to, String subject, String text ) {
        log.info("Mail would be sent now to: "+to+"\nSubject: "+subject+"\nWith text: "+text);
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(env.getProperty("spring.mail.username"));
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);
        javaMailSender.send(message);
        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        now.format(formatter);
        OrderNotification notification = new OrderNotification(now,to,text,subject);
        orderNotificationRepository.save(notification);
        orderProducer.sendNotificationMessage("orders", notification);
        log.info("Produced Kafka message for Order Notification: " + notification);
    }
}
