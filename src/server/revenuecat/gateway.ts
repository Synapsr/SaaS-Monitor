import "server-only";
import { z } from "zod";
import { parseOverviewMetrics } from "./charts";
import { redactRevenueCatSecrets, RevenueCatAccessError } from "./errors";
import type {
  RevenueCatChartData,
  RevenueCatOverview,
  RevenueCatProduct,
  RevenueCatProject,
} from "./types";

const DEFAULT_BASE_URL = "https://api.revenuecat.com/v2";
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_RETRIES = 2;
const MAX_RETRY_WAIT_MS = 2_000;

export interface RevenueCatGateway {
  readonly requestCount: number;
  listProjects(): Promise<RevenueCatProject[]>;
  getOverviewMetrics(projectId: string, currency?: string): Promise<RevenueCatOverview>;
  getChartData(
    projectId: string,
    chartName: string,
    params: { startDate: string; endDate: string; resolution?: string; currency?: string },
  ): Promise<RevenueCatChartData>;
  listProducts(projectId: string): Promise<RevenueCatProduct[]>;
  createWebhookIntegration(
    projectId: string,
    input: {
      name: string;
      url: string;
      authorizationHeader: string;
      environment: "production" | "sandbox";
      eventTypes: readonly string[];
    },
  ): Promise<{ id: string; signingSecret: string | null }>;
  deleteWebhookIntegration(projectId: string, webhookId: string): Promise<void>;
}

export type RevenueCatGatewayFactory = (secretKey: string) => RevenueCatGateway;

export interface RevenueCatAccessOptions {
  createGateway?: RevenueCatGatewayFactory;
}

const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const listProjectsSchema = z.object({
  items: z.array(projectSchema),
  next_page: z.string().nullable().optional(),
});

const overviewSchema = z.object({
  currency: z.string().optional(),
  metrics: z
    .array(
      z.object({
        id: z.string().optional(),
        value: z.number().optional(),
        last_updated_at: z.number().nullable().optional(),
      }),
    )
    .optional(),
});

const chartDataSchema = z.object({
  yaxis_currency: z.string().optional(),
  resolution: z.string().optional(),
  measures: z
    .array(
      z.object({
        display_name: z.string().optional(),
        unit: z.string().nullable().optional(),
        chartable: z.boolean().optional(),
      }),
    )
    .nullable()
    .optional(),
  values: z.array(z.unknown()).optional(),
});

const productSchema = z.object({
  id: z.string(),
  store_identifier: z.string(),
  display_name: z.string().nullable().optional(),
  type: z.string(),
  subscription: z
    .object({
      duration: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

const listProductsSchema = z.object({
  items: z.array(productSchema),
  next_page: z.string().nullable().optional(),
});

const webhookIntegrationSchema = z.object({
  id: z.string(),
  signing_secret: z.string().nullable().optional(),
});

const errorBodySchema = z.object({
  type: z.string().optional(),
  message: z.string().optional(),
  backoff_ms: z.number().nullable().optional(),
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createRevenueCatGateway(
  secretKey: string,
  baseUrl: string = DEFAULT_BASE_URL,
): RevenueCatGateway {
  const root = baseUrl.replace(/\/+$/, "");
  let requestCount = 0;

  async function request<T>(
    path: string,
    options: {
      method?: "GET" | "POST" | "DELETE";
      body?: unknown;
      permission?: string;
    } = {},
  ): Promise<T> {
    const url = path.startsWith("http")
      ? path
      : `${root}${path.startsWith("/") ? path : `/${path}`}`;
    const method = options.method ?? "GET";

    for (let attempt = 0; ; attempt += 1) {
      requestCount += 1;
      let response: Response;
      try {
        response = await fetch(url, {
          method,
          headers: {
            Authorization: `Bearer ${secretKey}`,
            Accept: "application/json",
            ...(options.body !== undefined && { "Content-Type": "application/json" }),
          },
          body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
      } catch (error) {
        if (attempt < MAX_RETRIES) {
          await sleep(Math.min(MAX_RETRY_WAIT_MS, 400 * 2 ** attempt));
          continue;
        }
        const message = redactRevenueCatSecrets(
          error instanceof Error ? error.message : String(error),
        );
        throw new RevenueCatAccessError("unavailable", message);
      }

      if (response.ok) {
        if (response.status === 204) return undefined as T;
        return (await response.json()) as T;
      }

      const rawText = await response.text().catch(() => "");
      let parsedError: z.infer<typeof errorBodySchema> | null = null;
      try {
        parsedError = errorBodySchema.parse(JSON.parse(rawText));
      } catch {
        parsedError = null;
      }
      const message = redactRevenueCatSecrets(
        parsedError?.message || `RevenueCat API returned ${response.status}`,
      );
      const retryAfterHeader = Number(response.headers.get("retry-after"));
      const retryAfterSeconds =
        Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
          ? retryAfterHeader
          : parsedError?.backoff_ms
            ? Math.ceil(parsedError.backoff_ms / 1000)
            : null;

      if ((response.status === 429 || response.status >= 500) && attempt < MAX_RETRIES) {
        const waitMs = Math.min(
          MAX_RETRY_WAIT_MS,
          retryAfterSeconds ? retryAfterSeconds * 1000 : 500 * 2 ** attempt,
        );
        await sleep(waitMs);
        continue;
      }

      switch (response.status) {
        case 401:
          throw new RevenueCatAccessError("authentication", message);
        case 403:
          throw new RevenueCatAccessError("permission", message, {
            permission: options.permission ?? null,
          });
        case 404:
          throw new RevenueCatAccessError("not_found", message);
        case 429:
          throw new RevenueCatAccessError("rate_limited", message, { retryAfterSeconds });
        default:
          throw new RevenueCatAccessError(
            response.status >= 500 ? "unavailable" : "invalid_request",
            message,
          );
      }
    }
  }

  return {
    get requestCount() {
      return requestCount;
    },

    async listProjects() {
      const items: RevenueCatProject[] = [];
      let path: string | null = "/projects?limit=100";
      while (path) {
        const raw = await request<unknown>(path, {
          permission: "project_configuration:projects:read",
        });
        const page = listProjectsSchema.parse(raw);
        items.push(...page.items);
        path = page.next_page ? stripV2Prefix(page.next_page) : null;
      }
      return items;
    },

    async getOverviewMetrics(projectId, currency = "USD") {
      const params = new URLSearchParams({ currency: currency.toUpperCase() });
      const raw = await request<unknown>(
        `/projects/${encodeURIComponent(projectId)}/metrics/overview?${params.toString()}`,
        { permission: "charts_metrics:overview:read" },
      );
      return parseOverviewMetrics(overviewSchema.parse(raw), new Date());
    },

    async getChartData(projectId, chartName, { startDate, endDate, resolution = "0", currency }) {
      const params = new URLSearchParams({
        realtime: "true",
        resolution,
        start_date: startDate,
        end_date: endDate,
      });
      if (currency) params.set("currency", currency.toUpperCase());
      const raw = await request<unknown>(
        `/projects/${encodeURIComponent(projectId)}/charts/${encodeURIComponent(chartName)}?${params.toString()}`,
        { permission: "charts_metrics:charts:read" },
      );
      const parsed = chartDataSchema.parse(raw);
      return {
        currency: (parsed.yaxis_currency ?? currency ?? "USD").toLowerCase(),
        resolution: parsed.resolution ?? "day",
        measures: (parsed.measures ?? []).map((m) => ({
          displayName: m.display_name ?? "",
          unit: m.unit ?? null,
          chartable: m.chartable ?? true,
        })),
        values: parsed.values ?? [],
      };
    },

    async listProducts(projectId) {
      const items: RevenueCatProduct[] = [];
      let path: string | null = `/projects/${encodeURIComponent(projectId)}/products?limit=100`;
      // Cap pagination to keep sync bounded on unusually large catalogs.
      for (let pageIndex = 0; path && pageIndex < 20; pageIndex += 1) {
        const raw = await request<unknown>(path, {
          permission: "project_configuration:products:read",
        });
        const page = listProductsSchema.parse(raw);
        for (const product of page.items) {
          items.push({
            id: product.id,
            storeIdentifier: product.store_identifier,
            displayName: product.display_name ?? null,
            type: product.type,
            duration: product.subscription?.duration ?? null,
          });
        }
        path = page.next_page ? stripV2Prefix(page.next_page) : null;
      }
      return items;
    },

    async createWebhookIntegration(projectId, input) {
      const raw = await request<unknown>(
        `/projects/${encodeURIComponent(projectId)}/integrations/webhooks`,
        {
          method: "POST",
          permission: "project_configuration:integrations:read_write",
          body: {
            name: input.name,
            url: input.url,
            authorization_header: input.authorizationHeader,
            environment: input.environment,
            event_types: [...input.eventTypes],
            status: "active",
          },
        },
      );
      const created = webhookIntegrationSchema.parse(raw);
      return { id: created.id, signingSecret: created.signing_secret ?? null };
    },

    async deleteWebhookIntegration(projectId, webhookId) {
      try {
        await request<unknown>(
          `/projects/${encodeURIComponent(projectId)}/integrations/webhooks/${encodeURIComponent(webhookId)}`,
          {
            method: "DELETE",
            permission: "project_configuration:integrations:read_write",
          },
        );
      } catch (error) {
        if (error instanceof RevenueCatAccessError && error.kind === "not_found") return;
        throw error;
      }
    },
  };
}

/** RevenueCat `next_page` starts with `/v2/...`; strip `/v2` because `baseUrl` already ends with it. */
function stripV2Prefix(nextPage: string): string {
  return nextPage.startsWith("/v2/") ? nextPage.slice(3) : nextPage;
}
