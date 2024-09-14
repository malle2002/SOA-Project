package mk.ukim.mk.order_service.messaging;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.log4j.Log4j2;
import mk.ukim.mk.order_service.models.OrderNotification;
import mk.ukim.mk.order_service.service.MailService;
import mk.ukim.mk.order_service.service.OrderNotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@Log4j2
public class OrderConsumer {

    private final ObjectMapper objectMapper;
    private final MailService mailService;

    @Autowired
    private OrderNotificationService orderNotificationService;

    public OrderConsumer(ObjectMapper objectMapper, MailService mailService) {
        this.objectMapper = objectMapper;
        this.mailService = mailService;
    }
    @KafkaListener(topics = "orders")
    public void receiveNotificationMessage(String message) {

        try {
            log.info("Received following message: " + message);
            OrderNotification orderNotification = objectMapper.readValue(message, OrderNotification.class);
            if (orderNotification.getOrderedOn() != null) {
                System.out.println("Kafka should save");
                orderNotificationService.createOrderNotification(orderNotification);
                System.out.println("kafka saved");
            } else {
                mailService.sendMail(orderNotification.getRecipientEmail(),
                        "Post Notification",
                        orderNotification.getDetails());
            }

        } catch (JsonProcessingException e) {
            log.error(e.getMessage());
        }

    }
}
