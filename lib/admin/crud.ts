import "server-only";
import type { Model } from "mongoose";
import type { ZodType } from "zod";
import { assertSameOrigin, fail, handleRouteError, ok } from "@/lib/api";
import { getVerifiedAdmin, canManage } from "@/lib/auth/guards";
import { connectToDatabase, serialize } from "@/lib/db/mongoose";
import { isValidObjectId } from "@/lib/utils";
import type { AdminRole } from "@/models/Admin";

type CrudOptions<T extends Record<string, unknown>> = {
  /**
   * Deliberately loose: this factory serves every admin resource, and each
   * model has a different document type. Safety comes from the Zod `schema`
   * below, which validates every write before it reaches Mongoose.
   */
  model: Model<any>;
  schema: ZodType<T>;
  /** Applied to list queries, e.g. `{ sortOrder: 1 }`. */
  sort?: Record<string, 1 | -1>;
  /** Fields matched against `?q=` with a case-insensitive regex. */
  searchFields?: string[];
  populate?: string;
  /** Minimum role required to write. Reads only need `staff`. */
  writeRole?: AdminRole;
  /** Runs before a delete; return a string to block with that message. */
  beforeDelete?: (id: string) => Promise<string | null>;
  afterWrite?: () => Promise<void>;
};

/**
 * Builds the four handlers every admin resource needs.
 *
 * Each one re-verifies the admin session against the database, so deactivating
 * a staff account revokes access immediately rather than at token expiry.
 */
export function createAdminCrud<T extends Record<string, unknown>>(
  options: CrudOptions<T>,
) {
  const {
    model,
    schema,
    sort = { createdAt: -1 },
    searchFields = [],
    populate,
    writeRole = "manager",
  } = options;

  async function guard(write: boolean) {
    const admin = await getVerifiedAdmin();
    if (!admin) return { error: fail("Not authorised.", 401) };
    if (write && !canManage(admin, writeRole)) {
      return { error: fail("Your role can't make this change.", 403) };
    }
    return { admin };
  }

  return {
    async GET(request: Request) {
      try {
        const { error } = await guard(false);
        if (error) return error;

        await connectToDatabase();
        const url = new URL(request.url);
        const q = url.searchParams.get("q")?.trim();
        const limit = Math.min(
          Math.max(Number(url.searchParams.get("limit")) || 100, 1),
          500,
        );

        const filter: Record<string, unknown> = {};
        if (q && searchFields.length) {
          const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 60);
          const pattern = new RegExp(safe, "i");
          filter.$or = searchFields.map((field) => ({ [field]: pattern }));
        }

        let query = model.find(filter).sort(sort).limit(limit);
        if (populate) query = query.populate(populate);

        return ok(serialize(await query.lean()));
      } catch (error) {
        return handleRouteError(error, "admin:crud:list");
      }
    },

    async POST(request: Request) {
      try {
        assertSameOrigin(request);
        const { error } = await guard(true);
        if (error) return error;

        const body = schema.parse(await request.json());
        await connectToDatabase();
        const created = await model.create(body);
        await options.afterWrite?.();

        return ok(serialize(created.toObject()));
      } catch (error) {
        if (
          error instanceof Error &&
          "code" in error &&
          (error as { code: number }).code === 11000
        ) {
          return fail("Something with that identifier already exists.", 409);
        }
        return handleRouteError(error, "admin:crud:create");
      }
    },

    async PATCH(request: Request) {
      try {
        assertSameOrigin(request);
        const { error } = await guard(true);
        if (error) return error;

        const url = new URL(request.url);
        const id = url.searchParams.get("id");
        if (!id || !isValidObjectId(id))
          return fail("Invalid identifier.", 400);

        const body = schema.parse(await request.json());
        await connectToDatabase();

        const updated = await model
          .findByIdAndUpdate(
            id,
            { $set: body },
            { returnDocument: "after", runValidators: true },
          )
          .lean();
        if (!updated) return fail("Not found.", 404);
        await options.afterWrite?.();

        return ok(serialize(updated));
      } catch (error) {
        if (
          error instanceof Error &&
          "code" in error &&
          (error as { code: number }).code === 11000
        ) {
          return fail("Something with that identifier already exists.", 409);
        }
        return handleRouteError(error, "admin:crud:update");
      }
    },

    async DELETE(request: Request) {
      try {
        assertSameOrigin(request);
        const { error } = await guard(true);
        if (error) return error;

        const url = new URL(request.url);
        const id = url.searchParams.get("id");
        if (!id || !isValidObjectId(id))
          return fail("Invalid identifier.", 400);

        if (options.beforeDelete) {
          const blocked = await options.beforeDelete(id);
          if (blocked) return fail(blocked, 409);
        }

        await connectToDatabase();
        const deleted = await model.findByIdAndDelete(id).lean();
        if (!deleted) return fail("Not found.", 404);
        await options.afterWrite?.();

        return ok({ deleted: true });
      } catch (error) {
        return handleRouteError(error, "admin:crud:delete");
      }
    },
  };
}
