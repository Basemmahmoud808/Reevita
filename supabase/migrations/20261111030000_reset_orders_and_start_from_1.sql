-- Reset all existing orders and restart the order number sequence from 1

-- Delete all orders (cascades to order_items and order_status_history)
DELETE FROM public.orders;

-- Reset sequence to 1 so the next order starts at 1 (RV-YYYY-00001)
ALTER SEQUENCE public.order_number_seq RESTART WITH 1;
