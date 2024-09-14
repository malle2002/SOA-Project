package mk.ukim.mk.order_service.web.controller;

import lombok.extern.log4j.Log4j2;
import mk.ukim.mk.order_service.models.OrderNotification;
import mk.ukim.mk.order_service.service.MailService;
import mk.ukim.mk.order_service.service.OrderNotificationService;
import mk.ukim.mk.order_service.web.dao.SendMailRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Log4j2
public class OrderController {
    private final MailService mailService;
    @Autowired
    private OrderNotificationService orderNotificationService;

    public OrderController(MailService mailService) {
        this.mailService = mailService;
    }

    @PostMapping(path = "/api/orders/sendMail")
    public ResponseEntity<Object> sendMail(@RequestBody SendMailRequest request) {

        try {
            mailService.sendMail(request.to(), request.subject(), request.text());
            return ResponseEntity.ok("Mail request has been fulfilled:\n"+ request);
        } catch (Exception e) {
            log.error("Caught exception: " + e.getMessage());
            return ResponseEntity.internalServerError().body("There was an error in sending the following mail:\n"
                    + request.toString());
        }
    }
    @GetMapping(path = "/get")
    public ResponseEntity<List<OrderNotification>> getAll() {
        return ResponseEntity.ok(orderNotificationService.getAllOrderNotifications());
    }
}
