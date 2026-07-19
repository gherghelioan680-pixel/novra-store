import { getCountyCode } from "@/lib/romania-county-codes";
import { ROMANIAN_COUNTIES } from "@/lib/romanian-counties";

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

export function createEmptyDeliveryMapPayload(enabled = true): DeliveryMapPublicPayload {
  const counties = ROMANIAN_COUNTIES.map((countyName) => ({
    countyCode: getCountyCode(countyName),
    countyName,
    orderCount: 0,
  }));

  return {
    enabled,
    counties,
    totalOrders: 0,
    updatedAt: new Date().toISOString(),
  };
}
