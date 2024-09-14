package mk.ukim.mk.order_service.service;

import mk.ukim.mk.order_service.models.OrderNotification;

import java.util.List;

public interface OrderNotificationService {

    OrderNotification createOrderNotification(OrderNotification orderNotification);

    List<OrderNotification> getAllOrderNotifications();
}
