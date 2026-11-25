import "server-only";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { isDuplicateEntry } from "@/db/errors";
import { stripeAccounts } from "@/db/schema";
import type { ActionResult } from "@/lib/action-result";
import { nameSchema } from "@/lib/names";
import { encryptSecret } from "@/server/crypto";
import type { MissingPermissions } from "@/server/stripe/accounts";
import { scheduleSync } from "@/server/sync";
import { workingStatus } from "@/server/sync/state";
import { RevenueCatAccessError } from "./errors";
import {
  createRevenueCatGateway,
  type RevenueCatAccessOptions,
  type RevenueCatGateway,
} from "./gateway";
import { revenueCatProjectIdSchema, revenueCatSecretKeySchema } from "./keys";
import { newRevenueCatBackfill } from "./sync";
import type { RevenueCatOverview, RevenueCatProject } from "./types";
import { registerRevenueCatWebhook } from "./webhooks";

const accountNameSchema = nameSchema("Name the account, for example after your app.");

export const connectRevenueCatSchema = z.object({
  name: accountNameSchema,
  secretKey: revenueCatSecretKeySchema,
  projectId: revenueCatProjectIdSchema,
});

const REVENUECAT_UNREACHABLE = "RevenueCat could not be reached. Try again in a moment.";

/**
 * Checks a RevenueCat API v2 secret key, resolves its project, verifies read permissions for
 * overview & charts, stores it encrypted in `workspaceId`, attempts to register a webhook
 * integration for instant updates, and starts the initial import.
 */
export async function connectRevenueCatAccount(
  input: { workspaceId: string } & z.infer<typeof connectRevenueCatSchema>,
  options: RevenueCatAccessOptions = {},
): Promise<ActionResult<{ accountId: string }, MissingPermissions>> {
  const key = input.secretKey;
  const gateway = (options.createGateway ?? createRevenueCatGateway)(key.key);

  const projectResult = await resolveProject(gateway, input.projectId);
  if (!projectResult.ok) return projectResult;
  const { project } = projectResult;

  const probeResult = await probeReadAccess(gateway, project.id);
  if (!probeResult.ok) return probeResult;
  const { overview } = probeResult;

  const [existing] = await db()
    .select({ id: stripeAccounts.id, status: stripeAccounts.status })
    .from(stripeAccounts)
    .where(
      and(
        eq(stripeAccounts.workspaceId, input.workspaceId),
        eq(stripeAccounts.provider, "revenuecat"),
        eq(stripeAccounts.stripeAccountId, project.id),
        eq(stripeAccounts.livemode, true),
      ),
    );
  if (existing?.status === "error") {
    await db()
      .update(stripeAccounts)
      .set({
        encryptedSecretKey: encryptSecret(key.key),
        secretKeyHint: key.hint,
        status: workingStatus(),
        lastError: null,
        syncFailures: 0,
        syncLockedUntil: null,
      })
      .where(eq(stripeAccounts.id, existing.id));
    scheduleSync([existing.id]);
    return { ok: true, accountId: existing.id };
  }
  if (existing) {
    return { ok: false, error: "This RevenueCat project is already connected." };
  }

  const now = new Date();
  let account: { id: string };
  try {
    [account] = await db()
      .insert(stripeAccounts)
      .values({
        workspaceId: input.workspaceId,
        provider: "revenuecat",
        name: input.name,
        stripeAccountId: project.id,
        livemode: true,
        encryptedSecretKey: encryptSecret(key.key),
        secretKeyHint: key.hint,
        defaultCurrency: overview.currency,
        status: "importing",
        backfill: newRevenueCatBackfill(now),
      })
      .$returningId();
  } catch (error) {
    if (!isDuplicateEntry(error)) throw error;
    return { ok: false, error: "This RevenueCat project is already connected." };
  }

  await registerRevenueCatWebhook(account.id, project.id, gateway, true);
  scheduleSync([account.id]);
  return { ok: true, accountId: account.id };
}

async function resolveProject(
  gateway: RevenueCatGateway,
  requestedProjectId?: string,
): Promise<ActionResult<{ project: RevenueCatProject }, MissingPermissions>> {
  let projects: RevenueCatProject[];
  try {
    projects = await gateway.listProjects();
  } catch (error) {
    if (!(error instanceof RevenueCatAccessError)) throw error;
    if (error.kind === "authentication") {
      return {
        ok: false,
        error:
          "This key is not valid. Create an API v2 secret key in RevenueCat under Project Settings › API keys.",
      };
    }
    if (error.kind === "permission") {
      // If the user explicitly supplied a project ID, we can still proceed to probe overview & charts.
      if (requestedProjectId) {
        return { ok: true, project: { id: requestedProjectId, name: requestedProjectId } };
      }
      return {
        ok: false,
        error: "This key is missing a permission.",
        missingPermissions: ["project_configuration:projects:read"],
      };
    }
    return { ok: false, error: REVENUECAT_UNREACHABLE };
  }

  if (requestedProjectId) {
    const match = projects.find((candidate) => candidate.id === requestedProjectId);
    if (!match) {
      return {
        ok: false,
        error: `This key does not have access to project “${requestedProjectId}”.`,
      };
    }
    return { ok: true, project: match };
  }

  if (projects.length === 0) {
    return { ok: false, error: "No RevenueCat project was found for this API key." };
  }
  if (projects.length > 1) {
    const list = projects.map((p) => `${p.name} (${p.id})`).join(", ");
    return {
      ok: false,
      error: `This key can access several projects. Enter the Project ID to connect: ${list}.`,
    };
  }
  return { ok: true, project: projects[0] };
}

async function probeReadAccess(
  gateway: RevenueCatGateway,
  projectId: string,
): Promise<ActionResult<{ overview: RevenueCatOverview }, MissingPermissions>> {
  const today = new Date().toISOString().slice(0, 10);
  const [overviewRes, chartRes] = await Promise.allSettled([
    gateway.getOverviewMetrics(projectId),
    gateway.getChartData(projectId, "mrr", {
      startDate: today,
      endDate: today,
      resolution: "0",
    }),
  ]);

  const failures: { error: RevenueCatAccessError; permission: string }[] = [];
  if (overviewRes.status === "rejected") {
    if (!(overviewRes.reason instanceof RevenueCatAccessError)) throw overviewRes.reason;
    failures.push({ error: overviewRes.reason, permission: "charts_metrics:overview:read" });
  }
  if (chartRes.status === "rejected") {
    if (!(chartRes.reason instanceof RevenueCatAccessError)) throw chartRes.reason;
    failures.push({ error: chartRes.reason, permission: "charts_metrics:charts:read" });
  }

  if (!failures.length && overviewRes.status === "fulfilled") {
    return { ok: true, overview: overviewRes.value };
  }

  if (failures.some(({ error }) => error.kind === "authentication")) {
    return {
      ok: false,
      error:
        "This key is not valid. Create an API v2 secret key in RevenueCat under Project Settings › API keys.",
    };
  }
  if (failures.some(({ error }) => error.kind === "not_found")) {
    return { ok: false, error: `Project “${projectId}” was not found in RevenueCat.` };
  }

  const missing = failures.filter(({ error }) => error.kind === "permission");
  if (missing.length) {
    const missingPermissions = missing.map(
      ({ error, permission }) => error.permission ?? permission,
    );
    return {
      ok: false,
      error:
        missingPermissions.length === 1
          ? "This key is missing a permission."
          : `This key is missing ${missingPermissions.length} permissions.`,
      missingPermissions,
    };
  }

  return { ok: false, error: REVENUECAT_UNREACHABLE };
}
