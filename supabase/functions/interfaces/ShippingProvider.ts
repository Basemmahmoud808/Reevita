/**
 * REEVITA E-Commerce - Shipping Provider Interface (Egypt Logistics)
 * Status: MANUAL in initial release. Carrier API integration inactive until credentials exist.
 * Egyptian logistics carriers (e.g., Bosta, J&T, Aramex, Mylerz).
 */

export interface ShipmentCreationRequest {
  orderId: string;
  orderNumber: string;
  recipientName: string;
  recipientPhone: string;
  governorateCode: string;
  city: string;
  addressLine: string;
  landmark?: string;
  codAmount: number; // Cash to collect on delivery in EGP
  packageDescription: string;
}

export interface ShipmentCreationResponse {
  carrier: string;
  trackingNumber: string;
  trackingUrl?: string;
  labelUrl?: string;
  estimatedDeliveryDate?: string;
}

export interface TrackingStatusResponse {
  trackingNumber: string;
  status: 'pending' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'returned' | 'refused';
  currentLocation?: string;
  updatedAt: string;
}

export interface IShippingProvider {
  readonly carrierName: string;
  readonly isAutomated: boolean;

  createShipment(req: ShipmentCreationRequest): Promise<ShipmentCreationResponse>;
  getTrackingStatus(trackingNumber: string): Promise<TrackingStatusResponse>;
  cancelShipment(trackingNumber: string): Promise<boolean>;
}

/**
 * Manual Shipping Carrier (Default for MVP)
 * Admins enter carrier name and tracking number manually via admin_update_order_status RPC.
 */
export class ManualShippingProvider implements IShippingProvider {
  readonly carrierName = 'Manual / Domestic Delivery';
  readonly isAutomated = false;

  async createShipment(): Promise<ShipmentCreationResponse> {
    throw new Error('AUTOMATED_SHIPPING_DISABLED: Carrier API credentials not configured. Use admin_update_order_status for manual dispatch.');
  }

  async getTrackingStatus(trackingNumber: string): Promise<TrackingStatusResponse> {
    return {
      trackingNumber,
      status: 'in_transit',
      updatedAt: new Date().toISOString()
    };
  }

  async cancelShipment(): Promise<boolean> {
    return true;
  }
}
