import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { connectToDatabase, serialize } from "@/lib/db/mongoose";
import { CustomCakeRequest } from "@/models/CustomCakeRequest";
import {
  AdminCard,
  AdminEmpty,
  AdminPage,
  StatusBadge,
} from "@/components/admin/AdminShell";
import { REQUEST_STATUS_LABELS } from "@/lib/custom-request-status";
import { formatDate, formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "Custom cakes" };

export default async function AdminCustomOrdersPage() {
  await connectToDatabase();
  const requests = serialize(
    await CustomCakeRequest.find().sort({ createdAt: -1 }).limit(200).lean(),
  );

  const open = requests.filter(
    (request) => !["COMPLETED", "REJECTED", "PAID"].includes(request.status),
  );

  return (
    <AdminPage
      title="Custom cake requests"
      description="Design requests from the cake builder. Review the references, set a price, and reply."
    >
      {requests.length === 0 ? (
        <AdminCard>
          <AdminEmpty
            title="No custom requests yet"
            description="When the store is in approval mode, cake builder submissions land here. In instant mode, custom cakes go straight through as normal orders."
          />
        </AdminCard>
      ) : (
        <div className="space-y-4">
          {open.length > 0 ? (
            <p className="text-[13px] text-[#64748b]">
              <span className="font-semibold text-[#131a24]">
                {open.length}
              </span>{" "}
              request{open.length === 1 ? "" : "s"} still need attention.
            </p>
          ) : null}

          <ul className="grid gap-4 lg:grid-cols-2">
            {requests.map((request) => (
              <li key={request._id}>
                <Link
                  href={`/admin/custom-orders/${request._id}`}
                  className="admin-card block p-5 transition-colors hover:border-[#16324f]/30"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11.5px] font-semibold tracking-[0.08em] text-[#94a3b8] uppercase">
                        #{request.requestNumber}
                      </p>
                      <p className="mt-0.5 truncate font-semibold">
                        {request.contact.name} · {request.contact.phone}
                      </p>
                    </div>
                    <StatusBadge
                      status={request.status}
                      label={REQUEST_STATUS_LABELS[request.status]}
                    />
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[12.5px] sm:grid-cols-4">
                    <Detail
                      label="Required"
                      value={formatDate(request.celebration.requiredDate)}
                    />
                    <Detail
                      label="Occasion"
                      value={request.celebration.occasion}
                    />
                    <Detail
                      label="Weight"
                      value={`${request.cake.weightKg} kg`}
                    />
                    <Detail
                      label="Flavour"
                      value={request.cake.flavour ?? "—"}
                    />
                  </dl>

                  {request.referenceImages.length > 0 ? (
                    <div className="mt-3 flex gap-2">
                      {request.referenceImages
                        .slice(0, 5)
                        .map((image, index) => (
                          <span
                            key={image.url}
                            className="relative size-12 overflow-hidden rounded-lg bg-[#f1f5f9]"
                          >
                            <Image
                              src={image.url}
                              alt={`Reference ${index + 1}`}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          </span>
                        ))}
                    </div>
                  ) : null}

                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#e3e8ef] pt-3 text-[13px]">
                    <span className="text-[#64748b]">
                      {request.quote?.amount ? "Quoted" : "Estimated"}
                    </span>
                    <span className="font-semibold tabular-nums">
                      {formatINR(
                        request.quote?.amount ?? request.estimate.total,
                      )}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AdminPage>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10.5px] font-semibold tracking-[0.08em] text-[#94a3b8] uppercase">
        {label}
      </dt>
      <dd className="truncate font-medium">{value}</dd>
    </div>
  );
}
