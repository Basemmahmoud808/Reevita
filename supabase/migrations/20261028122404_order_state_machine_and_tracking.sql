-- Migration 000004: COD State Machine, Inventory Auto-Restoration, and Secure Tracking
-- Supports Egyptian E-Commerce: Order validation, refusal tracking, and public tracking

-- 1. Function to validate state transitions and automatically handle inventory & refusal
CREATE OR REPLACE FUNCTION public.handle_order_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_item RECORD;
    v_is_valid_transition BOOLEAN := FALSE;
BEGIN
    -- Only run when status actually changes
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    -- Allowed state transitions matrix
    CASE OLD.status
        WHEN 'new' THEN
            v_is_valid_transition := NEW.status IN ('confirmed', 'cancelled');
        WHEN 'confirmed' THEN
            v_is_valid_transition := NEW.status IN ('packed', 'cancelled');
        WHEN 'packed' THEN
            v_is_valid_transition := NEW.status IN ('shipped', 'cancelled');
        WHEN 'shipped' THEN
            v_is_valid_transition := NEW.status IN ('delivered', 'refused', 'returned');
        WHEN 'delivered' THEN
            v_is_valid_transition := NEW.status IN ('returned');
        ELSE
            -- Terminal states: refused, returned, cancelled cannot transition further
            v_is_valid_transition := FALSE;
    END CASE;

    IF NOT v_is_valid_transition THEN
        RAISE EXCEPTION 'INVALID_STATUS_TRANSITION: Cannot transition order status from "%" to "%"',
            OLD.status, NEW.status;
    END IF;

    -- Inventory Auto-Restoration on Cancellation, Refusal, or Return
    IF NEW.status IN ('cancelled', 'refused', 'returned') AND OLD.status NOT IN ('cancelled', 'refused', 'returned') THEN
        FOR v_item IN
            SELECT product_id, quantity FROM public.order_items WHERE order_id = NEW.id
        LOOP
            -- Restore available stock, reduce reserved stock
            UPDATE public.inventory
            SET quantity_available = quantity_available + v_item.quantity,
                quantity_reserved = GREATEST(0, quantity_reserved - v_item.quantity),
                updated_at = now()
            WHERE product_id = v_item.product_id;
        END LOOP;
    END IF;

    -- When delivered: finalize reservation (deduct from reserved)
    IF NEW.status = 'delivered' AND OLD.status = 'shipped' THEN
        FOR v_item IN
            SELECT product_id, quantity FROM public.order_items WHERE order_id = NEW.id
        LOOP
            UPDATE public.inventory
            SET quantity_reserved = GREATEST(0, quantity_reserved - v_item.quantity),
                updated_at = now()
            WHERE product_id = v_item.product_id;
        END LOOP;
    END IF;

    -- Refusal protection (Anti-COD Abuse in Egypt):
    -- If customer refuses delivery at door, flag the phone number in profiles
    IF NEW.status = 'refused' THEN
        UPDATE public.profiles
        SET is_blacklisted = TRUE,
            notes = COALESCE(notes, '') || ' [Automated Flag: Refused delivery on order ' || NEW.order_number || ']'
        WHERE phone = NEW.customer_phone;
    END IF;

    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

-- Attach status trigger to orders table
DROP TRIGGER IF EXISTS trigger_order_status_transition ON public.orders;
CREATE TRIGGER trigger_order_status_transition
    BEFORE UPDATE OF status ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_order_status_transition();

-- 2. Admin RPC to update order status, carrier, and tracking number
CREATE OR REPLACE FUNCTION public.admin_update_order_status(
    p_order_id UUID,
    p_new_status TEXT,
    p_reason TEXT DEFAULT NULL,
    p_shipping_carrier TEXT DEFAULT NULL,
    p_tracking_number TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_old_status TEXT;
    v_order_number TEXT;
BEGIN
    -- Admin check
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'FORBIDDEN: Only administrators can update order status';
    END IF;

    SELECT status, order_number INTO v_old_status, v_order_number
    FROM public.orders WHERE id = p_order_id;

    IF v_old_status IS NULL THEN
        RAISE EXCEPTION 'ORDER_NOT_FOUND: Order does not exist';
    END IF;

    -- Update order
    UPDATE public.orders
    SET status = p_new_status,
        shipping_carrier = COALESCE(p_shipping_carrier, shipping_carrier),
        tracking_number = COALESCE(p_tracking_number, tracking_number),
        updated_at = now()
    WHERE id = p_order_id;

    -- Insert into history
    INSERT INTO public.order_status_history (
        order_id,
        from_status,
        to_status,
        changed_by,
        reason
    ) VALUES (
        p_order_id,
        v_old_status,
        p_new_status,
        auth.uid(),
        COALESCE(p_reason, 'Status changed by admin to ' || p_new_status)
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'order_id', p_order_id,
        'order_number', v_order_number,
        'from_status', v_old_status,
        'to_status', p_new_status
    );
END;
$$;

-- 3. Public Safe Order Tracking: `track_order`
-- Requires BOTH order number AND customer phone to prevent enumeration / IDOR attacks.
-- Does NOT leak private data (no full address, no email, no payment details).
CREATE OR REPLACE FUNCTION public.track_order(
    p_order_number TEXT,
    p_phone TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_normalized_phone TEXT;
    v_order RECORD;
    v_status_ar TEXT;
    v_found_order_number TEXT;
    v_attempt_count INTEGER;
BEGIN
    IF p_order_number IS NULL OR trim(p_order_number) = '' THEN
        RAISE EXCEPTION 'INVALID_INPUT: Order number is required';
    END IF;

    -- Normalize phone
    v_normalized_phone := public.normalize_egyptian_phone(p_phone);

    IF upper(trim(p_order_number)) !~ '^RV-[0-9]{4}-[0-9]{5}$' THEN
        RETURN jsonb_build_object(
            'found', FALSE,
            'message_ar', 'لم يتم العثور على طلب مطابق لرقم الطلب ورقم الهاتف المدخلين.',
            'message_en', 'No order found matching the provided order number and phone.'
        );
    END IF;

    -- Only keep counters for real orders, and cap direct RPC phone guesses even
    -- when callers bypass the Next.js Server Action rate limiter.
    SELECT o.order_number INTO v_found_order_number
    FROM public.orders o
    WHERE upper(trim(o.order_number)) = upper(trim(p_order_number));

    IF v_found_order_number IS NULL THEN
        RETURN jsonb_build_object(
            'found', FALSE,
            'message_ar', 'لم يتم العثور على طلب مطابق لرقم الطلب ورقم الهاتف المدخلين.',
            'message_en', 'No order found matching the provided order number and phone.'
        );
    END IF;

    INSERT INTO private.order_tracking_attempts (order_number, attempt_count, window_started_at)
    VALUES (upper(trim(v_found_order_number)), 1, now())
    ON CONFLICT (order_number) DO UPDATE
      SET attempt_count = CASE
            WHEN private.order_tracking_attempts.window_started_at <= now() - interval '1 minute' THEN 1
            ELSE private.order_tracking_attempts.attempt_count + 1
          END,
          window_started_at = CASE
            WHEN private.order_tracking_attempts.window_started_at <= now() - interval '1 minute' THEN now()
            ELSE private.order_tracking_attempts.window_started_at
          END
    RETURNING attempt_count INTO v_attempt_count;

    IF v_attempt_count > 12 THEN
        RETURN jsonb_build_object(
            'found', FALSE,
            'message_ar', 'لم يتم العثور على طلب مطابق لرقم الطلب ورقم الهاتف المدخلين.',
            'message_en', 'No order found matching the provided order number and phone.'
        );
    END IF;

    -- Find matching order
    SELECT 
        o.order_number,
        o.status,
        o.shipping_carrier,
        o.tracking_number,
        o.subtotal,
        o.shipping_fee,
        o.total,
        o.currency,
        o.created_at,
        g.name_ar as governorate_ar,
        sr.estimated_days_min,
        sr.estimated_days_max
    INTO v_order
    FROM public.orders o
    JOIN public.governorates g ON g.id = o.governorate_id
    JOIN public.shipping_rates sr ON sr.governorate_id = g.id
    WHERE upper(trim(o.order_number)) = upper(trim(p_order_number))
      AND o.customer_phone = v_normalized_phone;

    IF v_order.order_number IS NULL THEN
        RETURN jsonb_build_object(
            'found', FALSE,
            'message_ar', 'لم يتم العثور على طلب مطابق لرقم الطلب ورقم الهاتف المدخلين.',
            'message_en', 'No order found matching the provided order number and phone.'
        );
    END IF;

    -- Arabic localized status description
    CASE v_order.status
        WHEN 'new' THEN v_status_ar := 'تم استلام طلبك وجاري مراجعته';
        WHEN 'confirmed' THEN v_status_ar := 'تم تأكيد الطلب ويجري تجهيزه';
        WHEN 'packed' THEN v_status_ar := 'تم تجهيز وتغليف الشحنة';
        WHEN 'shipped' THEN v_status_ar := 'الشحنة مع مندوب شركة الشحن في طريقها إليك';
        WHEN 'delivered' THEN v_status_ar := 'تم تسليم الطلب بنجاح';
        WHEN 'refused' THEN v_status_ar := 'تم رفض استلام الشحنة';
        WHEN 'returned' THEN v_status_ar := 'تم إرجاع الشحنة إلى المتجر';
        WHEN 'cancelled' THEN v_status_ar := 'تم إلغاء الطلب';
        ELSE v_status_ar := v_order.status;
    END CASE;

    RETURN jsonb_build_object(
        'found', TRUE,
        'order_number', v_order.order_number,
        'status', v_order.status,
        'status_ar', v_status_ar,
        'shipping_carrier', COALESCE(v_order.shipping_carrier, 'الشحن الداخلي REEVITA'),
        'tracking_number', v_order.tracking_number,
        'destination_governorate', v_order.governorate_ar,
        'total', v_order.total,
        'currency', v_order.currency,
        'created_at', v_order.created_at
    );
END;
$$;
