/**
 * REEVITA E-Commerce - Online Payment Provider Interface
 * Status: DISABLED by default (ONLINE_PAYMENTS_ENABLED=false)
 * In accordance with Phase 2 rules: Electronic payment is architected as an
 * inactive interface until real provider credentials and webhooks are configured.
 */

export interface PaymentIntentRequest {
  orderId: string;
  orderNumber: string;
  amountCents: number;
  currency: 'EGP';
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
}

export interface PaymentIntentResponse {
  paymentId: string;
  clientSecret?: string;
  redirectUrl?: string;
  status: 'pending' | 'success' | 'failed';
}

export interface PaymentWebhookPayload {
  transactionId: string;
  orderId: string;
  amount: number;
  success: boolean;
  signature: string;
}

export interface IPaymentProvider {
  readonly providerName: string;
  readonly isEnabled: boolean;

  createPaymentIntent(req: PaymentIntentRequest): Promise<PaymentIntentResponse>;
  verifyWebhook(rawBody: string, signature: string): Promise<boolean>;
  processRefund(transactionId: string, amountCents: number): Promise<boolean>;
}

/**
 * Inactive placeholder payment provider
 */
export class DisabledPaymentProvider implements IPaymentProvider {
  readonly providerName = 'DisabledOnlinePayment';
  readonly isEnabled = false;

  async createPaymentIntent(): Promise<PaymentIntentResponse> {
    throw new Error('ONLINE_PAYMENTS_DISABLED: Electronic payments are disabled. Use COD (Cash On Delivery).');
  }

  async verifyWebhook(): Promise<boolean> {
    return false;
  }

  async processRefund(): Promise<boolean> {
    throw new Error('ONLINE_PAYMENTS_DISABLED: Electronic payments are disabled.');
  }
}
