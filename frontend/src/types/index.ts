export interface ProcurementOption {
  id: string;
  name: string;
  price: number;
  vendor_name: string;
  vendor_id: string;
  trust_score: number;
  delivery_days: number;
  ai_score: number;
  reason: string;
  ai_reason: string;
  original_price?: number;
}

export type ProcurementStrategy = "balanced" | "cheapest" | "fastest";

export interface Telemetry {
  model: string;
  latency_ms: number;
  tokens_used: number;
}
