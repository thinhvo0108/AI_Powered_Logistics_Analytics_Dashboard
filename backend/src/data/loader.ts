import { readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { config } from "../core/config.js";
import logger from "../core/logger.js";

export interface Row {
  clientId: string;
  orderId: string;
  orderDate: Date;
  deliveryDate: Date | null;
  carrier: string;
  originCity: string;
  destinationCity: string;
  status: string;
  sku: string;
  productCategory: string;
  quantity: number;
  unitPriceUsd: number;
  orderValueUsd: number;
  isPromo: boolean;
  promoDiscountPct: number;
  region: string;
  warehouse: string;
  // Derived fields
  deliveryDays: number | null;
  isDelayed: boolean;
  isOnTime: boolean;
}

interface RawRecord {
  client_id: string;
  order_id: string;
  order_date: string;
  delivery_date: string;
  carrier: string;
  origin_city: string;
  destination_city: string;
  status: string;
  sku: string;
  product_category: string;
  quantity: string;
  unit_price_usd: string;
  order_value_usd: string;
  is_promo: string;
  promo_discount_pct: string;
  region: string;
  warehouse: string;
}

/**
 * Parses a "YYYY-MM-DD" date string as UTC midnight, so day-level math
 * (deliveryDays) and calendar grouping stay correct regardless of the host's
 * local timezone/DST.
 */
export function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

function toRow(raw: RawRecord): Row {
  const orderDate = parseDate(raw.order_date);
  // in_transit / canceled orders have no delivery_date yet.
  const deliveryDate = raw.delivery_date ? parseDate(raw.delivery_date) : null;
  const deliveryDays = deliveryDate
    ? (deliveryDate.getTime() - orderDate.getTime()) / 86_400_000
    : null;
  const status = raw.status;

  return {
    clientId: raw.client_id,
    orderId: raw.order_id,
    orderDate,
    deliveryDate,
    carrier: raw.carrier,
    originCity: raw.origin_city,
    destinationCity: raw.destination_city,
    status,
    sku: raw.sku,
    productCategory: raw.product_category,
    quantity: Number(raw.quantity),
    unitPriceUsd: Number(raw.unit_price_usd),
    orderValueUsd: Number(raw.order_value_usd),
    isPromo: raw.is_promo === "1" || raw.is_promo?.toLowerCase() === "true",
    promoDiscountPct: Number(raw.promo_discount_pct),
    region: raw.region,
    warehouse: raw.warehouse,
    deliveryDays,
    isDelayed: status === "delayed",
    isOnTime: status === "delivered",
  };
}

function load(): Row[] {
  const raw = readFileSync(config.dataPath, "utf-8");
  const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
  }) as RawRecord[];

  const rows = records.map(toRow);

  logger.info({ count: rows.length, path: config.dataPath }, "Loaded logistics data");

  return rows;
}

// Parsed once, synchronously, at module load ("on startup").
const rows: Row[] = load();

/** Returns the read-only, in-memory singleton of parsed logistics rows. Never mutate the result. */
export function getRows(): Row[] {
  return rows;
}
