export type DeliveryCountyStat = {
  countyCode: string;
  countyName: string;
  orderCount: number;
  lastDeliveryAt?: string;
  excluded?: boolean;
};

export type DeliveryMapData = {
  counties: DeliveryCountyStat[];
  updatedAt: string;
};

export type DeliveryMapPublicPayload = {
  enabled: boolean;
  counties: DeliveryCountyStat[];
  totalOrders: number;
  updatedAt: string;
};
