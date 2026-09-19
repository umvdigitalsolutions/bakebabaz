import { assertSameOrigin, fail, handleRouteError, ok } from "@/lib/api";
import { getVerifiedAdmin, canManage } from "@/lib/auth/guards";
import { connectToDatabase, serialize } from "@/lib/db/mongoose";
import { CustomCakeRequest } from "@/models/CustomCakeRequest";
import { customRequestUpdateSchema } from "@/lib/validation/admin";
import { isValidObjectId } from "@/lib/utils";
import { notify } from "@/lib/notifications/service";
import { REQUEST_STATUS_LABELS } from "@/lib/custom-request-status";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await getVerifiedAdmin();
    if (!admin) return fail("Not authorised.", 401);

    const { id } = await ctx.params;
    if (!isValidObjectId(id)) return fail("Invalid request.", 400);

    await connectToDatabase();
    const doc = await CustomCakeRequest.findById(id).lean();
    if (!doc) return fail("Request not found.", 404);

    return ok(serialize(doc));
  } catch (error) {
    return handleRouteError(error, "admin:custom-order:get");
  }
}

/**
 * Handles every admin action on a request: status change, re-quote, and
 * internal or customer-facing notes.
 */
export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const admin = await getVerifiedAdmin();
    if (!admin) return fail("Not authorised.", 401);

    const { id } = await ctx.params;
    if (!isValidObjectId(id)) return fail("Invalid request.", 400);

    const body = customRequestUpdateSchema.parse(await request.json());
    await connectToDatabase();

    const doc = await CustomCakeRequest.findById(id);
    if (!doc) return fail("Request not found.", 404);

    if (body.quoteAmount != null) {
      if (!canManage(admin, "manager")) {
        return fail("Only managers and owners can set a price.", 403);
      }
      doc.quote = {
        amount: body.quoteAmount,
        note: body.quoteNote,
        quotedAt: new Date(),
        quotedBy: admin.email,
      };
      if (!body.status) doc.status = "QUOTED";
    }

    if (body.status) {
      doc.status = body.status;
      doc.statusHistory.push({
        status: body.status,
        at: new Date(),
        by: admin.email,
      });
    }

    if (body.internalNote) {
      doc.internalNotes.push({
        text: body.internalNote,
        at: new Date(),
        by: admin.email,
      });
    }

    if (body.customerNote) {
      doc.customerNotes.push({
        text: body.customerNote,
        at: new Date(),
        by: admin.email,
      });
    }

    await doc.save();

    if (body.quoteAmount != null) {
      await notify("custom_cake_quoted", {
        requestNumber: doc.requestNumber,
        customerName: doc.contact.name,
        customerEmail: doc.contact.email,
        amount: body.quoteAmount,
        note: body.quoteNote,
      });
    } else if (body.status) {
      await notify("custom_cake_approved", {
        requestNumber: doc.requestNumber,
        customerName: doc.contact.name,
        customerEmail: doc.contact.email,
        status: REQUEST_STATUS_LABELS[body.status],
      });
    }

    return ok(serialize(doc.toObject()));
  } catch (error) {
    return handleRouteError(error, "admin:custom-order:update");
  }
}
