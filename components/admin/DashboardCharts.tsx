"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatINRPlain } from "@/lib/utils";

/**
 * Palette chosen to stay legible next to the neutral admin chrome and to keep
 * adjacent categories distinguishable without relying on hue alone.
 */
const SERIES = [
  "#16324f",
  "#2f6f9f",
  "#5aa0c9",
  "#93c4dd",
  "#c9e2ef",
  "#e0eef5",
];

const axisStyle = { fontSize: 11, fill: "#94a3b8" };

// Recharts hands formatters loosely-typed values, so every helper coerces.
function monthLabel(value: unknown) {
  const [year, month] = String(value ?? "").split("-");
  if (!year || !month) return String(value ?? "");
  return new Date(Number(year), Number(month) - 1).toLocaleDateString("en-IN", {
    month: "short",
  });
}

const rupees = (value: unknown) => `₹${formatINRPlain(Number(value) || 0)}`;

export function RevenueChart({
  data,
}: {
  data: { month: string; revenue: number; orders: number }[];
}) {
  if (!data.length) {
    return (
      <ChartEmpty message="Revenue will chart here once orders are paid." />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart
        data={data}
        margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
      >
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#16324f" stopOpacity={0.22} />
            <stop offset="100%" stopColor="#16324f" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#eef2f6" vertical={false} />
        <XAxis
          dataKey="month"
          tickFormatter={monthLabel}
          tick={axisStyle}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={axisStyle}
          tickLine={false}
          axisLine={false}
          tickFormatter={rupees}
          width={70}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value: unknown) => [rupees(value), "Revenue"]}
          labelFormatter={monthLabel}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#16324f"
          strokeWidth={2}
          fill="url(#revenueFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function OrdersChart({
  data,
}: {
  data: { month: string; orders: number }[];
}) {
  if (!data.length) {
    return <ChartEmpty message="Order volume will chart here." />;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid stroke="#eef2f6" vertical={false} />
        <XAxis
          dataKey="month"
          tickFormatter={monthLabel}
          tick={axisStyle}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={axisStyle}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value: unknown) => [Number(value) || 0, "Orders"]}
          labelFormatter={monthLabel}
          cursor={{ fill: "#f1f5f9" }}
        />
        <Bar
          dataKey="orders"
          fill="#2f6f9f"
          radius={[4, 4, 0, 0]}
          maxBarSize={38}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TopProductsChart({
  data,
}: {
  data: { name: string; revenue: number; quantity: number }[];
}) {
  if (!data.length) {
    return <ChartEmpty message="Your bestsellers will appear here." />;
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 42)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
      >
        <CartesianGrid stroke="#eef2f6" horizontal={false} />
        <XAxis
          type="number"
          tick={axisStyle}
          tickLine={false}
          axisLine={false}
          tickFormatter={rupees}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ ...axisStyle, fontSize: 11.5 }}
          tickLine={false}
          axisLine={false}
          width={150}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value: unknown, _name: unknown, item: unknown) => {
            const sold =
              (item as { payload?: { quantity?: number } })?.payload
                ?.quantity ?? 0;
            return [`${rupees(value)} · ${sold} sold`, "Revenue"];
          }}
          cursor={{ fill: "#f1f5f9" }}
        />
        <Bar dataKey="revenue" radius={[0, 4, 4, 0]} maxBarSize={22}>
          {data.map((_, index) => (
            <Cell key={index} fill={SERIES[index % SERIES.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StatusChart({
  data,
}: {
  data: { status: string; count: number }[];
}) {
  if (!data.length) {
    return <ChartEmpty message="Order statuses will break down here." />;
  }

  const rows = data.map((row) => ({
    ...row,
    label: row.status.replace(/_/g, " ").toLowerCase(),
  }));

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <ResponsiveContainer width="100%" height={200} className="max-w-[200px]">
        <PieChart>
          <Pie
            data={rows}
            dataKey="count"
            nameKey="label"
            innerRadius={52}
            outerRadius={82}
            paddingAngle={2}
            stroke="none"
          >
            {rows.map((_, index) => (
              <Cell key={index} fill={SERIES[index % SERIES.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>

      <ul className="flex-1 space-y-1.5 text-[13px]">
        {rows.map((row, index) => (
          <li key={row.status} className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="size-2.5 flex-none rounded-full"
              style={{ background: SERIES[index % SERIES.length] }}
            />
            <span className="flex-1 text-[#475569] capitalize">
              {row.label}
            </span>
            <span className="font-semibold tabular-nums">{row.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const tooltipStyle = {
  background: "#ffffff",
  border: "1px solid #e3e8ef",
  borderRadius: 8,
  fontSize: 12,
  boxShadow: "0 6px 18px rgba(15,23,42,.08)",
} as const;

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="grid h-[200px] place-items-center rounded-lg border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-6 text-center">
      <p className="text-[13px] text-[#64748b]">{message}</p>
    </div>
  );
}
