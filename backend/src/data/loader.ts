import { readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { config } from "../core/config.js";
import logger from "../core/logger.js";

export interface LogisticsRecord {
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
  quantity: number;
  unit_price_usd: number;
  order_value_usd: number;
  is_promo: boolean;
  promo_discount_pct: number;
  region: string;
  warehouse: string;
}

let records: LogisticsRecord[] = [];

/** Loads the CSV at config.dataPath into an in-memory, read-only singleton. */
export async function loadData(): Promise<LogisticsRecord[]> {
  const raw = readFileSync(config.dataPath, "utf-8");
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
  }) as Record<string, string>[];

  records = rows.map((row) => ({
    client_id: row.client_id,
    order_id: row.order_id,
    order_date: row.order_date,
    delivery_date: row.delivery_date,
    carrier: row.carrier,
    origin_city: row.origin_city,
    destination_city: row.destination_city,
    status: row.status,
    sku: row.sku,
    product_category: row.product_category,
    quantity: Number(row.quantity),
    unit_price_usd: Number(row.unit_price_usd),
    order_value_usd: Number(row.order_value_usd),
    is_promo: row.is_promo === "1" || row.is_promo?.toLowerCase() === "true",
    promo_discount_pct: Number(row.promo_discount_pct),
    region: row.region,
    warehouse: row.warehouse,
  }));

  logger.info({ count: records.length, path: config.dataPath }, "Loaded logistics data");

  return records;
}

/** Returns the currently loaded records. Call loadData() first. */
export function getData(): LogisticsRecord[] {
  return records;
}
