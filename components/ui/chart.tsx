"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode
    color?: string
    icon?: React.ComponentType<{ className?: string }>
  }
>

type ChartContextValue = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextValue | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used inside <ChartContainer />")
  }

  return context
}

function ChartContainer({
  id,
  className,
  children,
  config,
  style,
  ...props
}: React.ComponentProps<"div"> & {
  id?: string
  config: ChartConfig
  children: React.ReactElement
}) {
  const uniqueId = React.useId()
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`

  const variables = Object.fromEntries(
    Object.entries(config)
      .filter(([, item]) => Boolean(item.color))
      .map(([key, item]) => [`--color-${key}`, item.color]),
  ) as React.CSSProperties

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border/60 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className,
        )}
        style={{ ...variables, ...style }}
        {...props}
      >
        <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip
const ChartLegend = RechartsPrimitive.Legend

type TooltipPayloadItem = {
  color?: string
  dataKey?: string | number
  name?: string | number
  value?: string | number | readonly (string | number)[]
  payload?: Record<string, unknown>
}

type ChartTooltipContentProps = React.ComponentProps<"div"> & {
  active?: boolean
  payload?: readonly TooltipPayloadItem[]
  label?: React.ReactNode
  hideLabel?: boolean
  hideIndicator?: boolean
  indicator?: "line" | "dot" | "dashed"
  nameKey?: string
  labelFormatter?: (
    label: React.ReactNode,
    payload: readonly TooltipPayloadItem[],
  ) => React.ReactNode
  valueFormatter?: (
    value: TooltipPayloadItem["value"],
    item: TooltipPayloadItem,
  ) => React.ReactNode
}

function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  nameKey,
  label,
  labelFormatter,
  valueFormatter,
}: ChartTooltipContentProps) {
  const { config } = useChart()

  if (!active || !payload?.length) return null

  const renderedLabel = hideLabel
    ? null
    : labelFormatter
      ? labelFormatter(label, payload)
      : label

  return (
    <div
      className={cn(
        "grid min-w-[10rem] gap-1.5 rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-xl",
        className,
      )}
    >
      {renderedLabel ? (
        <div className="font-medium text-foreground">{renderedLabel}</div>
      ) : null}

      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const payloadValue = nameKey ? item.payload?.[nameKey] : undefined
          const key = String(payloadValue ?? item.dataKey ?? item.name ?? `value-${index}`)
          const itemConfig = config[key]
          const rawFill = item.payload?.fill
          const rawStroke = item.payload?.stroke
          const color =
            itemConfig?.color ??
            item.color ??
            (typeof rawFill === "string" ? rawFill : undefined) ??
            (typeof rawStroke === "string" ? rawStroke : undefined) ??
            "currentColor"

          return (
            <div key={`${key}-${index}`} className="flex items-center gap-2">
              {!hideIndicator ? (
                <span
                  className={cn(
                    "shrink-0",
                    indicator === "dot" && "h-2.5 w-2.5 rounded-[2px]",
                    indicator === "line" && "h-3 w-1 rounded-full",
                    indicator === "dashed" && "h-3 w-0 border-l-2 border-dashed",
                  )}
                  style={{
                    backgroundColor: indicator === "dashed" ? undefined : color,
                    borderColor: color,
                  }}
                />
              ) : null}

              <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
                <span className="truncate text-muted-foreground">
                  {itemConfig?.label ?? item.name ?? key}
                </span>
                <span className="font-mono font-medium tabular-nums text-foreground">
                  {valueFormatter
                    ? valueFormatter(item.value, item)
                    : formatTooltipValue(item.value)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function formatTooltipValue(value: TooltipPayloadItem["value"]) {
  if (Array.isArray(value)) return value.join(" – ")
  if (typeof value === "number") {
    return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 3 }).format(value)
  }
  return value ?? "-"
}

type LegendPayloadItem = {
  color?: string
  dataKey?: string | number
  value?: string | number
}

function ChartLegendContent({
  className,
  payload,
}: React.ComponentProps<"div"> & {
  payload?: readonly LegendPayloadItem[]
}) {
  const { config } = useChart()

  if (!payload?.length) return null

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-4 pt-3", className)}>
      {payload.map((item, index) => {
        const key = String(item.dataKey ?? item.value ?? `legend-${index}`)
        const itemConfig = config[key]
        const color = itemConfig?.color ?? item.color ?? "currentColor"

        return (
          <div key={`${key}-${index}`} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: color }} />
            <span>{itemConfig?.label ?? item.value ?? key}</span>
          </div>
        )
      })}
    </div>
  )
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
}
