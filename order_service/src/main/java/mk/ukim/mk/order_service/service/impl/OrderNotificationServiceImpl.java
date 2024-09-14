package mk.ukim.mk.order_service.service.impl;

import mk.ukim.mk.order_service.models.OrderNotification;
import mk.ukim.mk.order_service.repository.OrderNotificationRepository;
import mk.ukim.mk.order_service.service.OrderNotificationService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class OrderNotificationServiceImpl implements OrderNotificationService {
    private final OrderNotificationRepository orderNotificationRepository;

    public OrderNotificationServiceImpl(OrderNotificationRepository orderNotificationRepository) {
        this.orderNotificationRepository = orderNotificationRepository;
    }


    @Override
    public OrderNotification createOrderNotification(OrderNotification orderNotification) {
        orderNotificationRepository.save(orderNotification);
        return orderNotification;
    }

    @Override
    public List<OrderNotification> getAllOrderNotifications() {
        return orderNotificationRepository.findAll();
    }
}
