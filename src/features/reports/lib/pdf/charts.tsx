import { Circle, G, Line, Path, Rect, Svg, Text, View } from "@react-pdf/renderer";
import { pdfPalette } from "@/features/reports/lib/pdf/palette";
import { formatCurrency, formatPercent } from "@/lib/utils/currency";

interface Slice {
  name: string;
  amount: number;
  color: string;
}

function polarPoint(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** A single arc segment of a donut, drawn as an outer-then-inner arc path. */
function donutArcPath(cx: number, cy: number, outerR: number, innerR: number, startAngle: number, endAngle: number): string {
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  const outerStart = polarPoint(cx, cy, outerR, startAngle);
  const outerEnd = polarPoint(cx, cy, outerR, endAngle);
  const innerStart = polarPoint(cx, cy, innerR, endAngle);
  const innerEnd = polarPoint(cx, cy, innerR, startAngle);
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y}`,
    "Z",
  ].join(" ");
}

const styles = {
  legendRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 6, marginBottom: 4 },
  legendSwatch: { width: 8, height: 8, borderRadius: 2 },
  legendLabel: { fontSize: 8, color: pdfPalette.textSecondary, flexGrow: 1 },
  legendValue: { fontSize: 8, color: pdfPalette.textPrimary, fontFamily: "Helvetica-Bold" },
};

export function PdfDonutChart({ data, currency, size = 120 }: { data: Slice[]; currency: string; size?: number }) {
  const total = data.reduce((s, d) => s + d.amount, 0);
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 4;
  const innerR = outerR * 0.58;

  const arcs = data
    .filter((d) => d.amount > 0)
    .reduce<Array<Slice & { fraction: number; startAngle: number; endAngle: number; isFullCircle: boolean }>>((acc, d) => {
      const cursor = acc.length > 0 ? acc[acc.length - 1].endAngle / 360 : 0;
      const fraction = total > 0 ? d.amount / total : 0;
      const startAngle = cursor * 360;
      const endAngle = (cursor + fraction) * 360;
      acc.push({ ...d, fraction, startAngle, endAngle, isFullCircle: fraction >= 0.999 });
      return acc;
    }, []);

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {total <= 0 ? (
          <Circle cx={cx} cy={cy} r={outerR} fill={pdfPalette.background} stroke={pdfPalette.border} strokeWidth={1} />
        ) : (
          <G>
            {arcs.map((arc) =>
              arc.isFullCircle ? (
                <Circle key={arc.name} cx={cx} cy={cy} r={(outerR + innerR) / 2} fill="none" stroke={arc.color} strokeWidth={outerR - innerR} />
              ) : (
                <Path key={arc.name} d={donutArcPath(cx, cy, outerR, innerR, arc.startAngle, arc.endAngle)} fill={arc.color} />
              ),
            )}
          </G>
        )}
      </Svg>
      <View style={{ flexGrow: 1 }}>
        {data.map((d) => (
          <View key={d.name} style={styles.legendRow}>
            <View style={[styles.legendSwatch, { backgroundColor: d.color }]} />
            <Text style={styles.legendLabel}>{d.name}</Text>
            <Text style={styles.legendValue}>
              {total > 0 ? formatPercent((d.amount / total) * 100, 0) : "0%"} · {formatCurrency(d.amount, currency)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function PdfBarComparisonChart({
  income,
  expenses,
  currency,
  width = 220,
  height = 100,
}: {
  income: number;
  expenses: number;
  currency: string;
  width?: number;
  height?: number;
}) {
  const max = Math.max(income, expenses, 1);
  const barWidth = 56;
  const gap = 40;
  const chartHeight = height - 20;
  const incomeHeight = (income / max) * chartHeight;
  const expenseHeight = (expenses / max) * chartHeight;
  const startX = (width - (barWidth * 2 + gap)) / 2;

  return (
    <View>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Line x1={0} y1={chartHeight} x2={width} y2={chartHeight} stroke={pdfPalette.border} strokeWidth={1} />
        <Rect x={startX} y={chartHeight - incomeHeight} width={barWidth} height={Math.max(incomeHeight, 1)} fill={pdfPalette.income} rx={2} />
        <Rect
          x={startX + barWidth + gap}
          y={chartHeight - expenseHeight}
          width={barWidth}
          height={Math.max(expenseHeight, 1)}
          fill={pdfPalette.expense}
          rx={2}
        />
      </Svg>
      <View style={{ flexDirection: "row", justifyContent: "center", gap: gap + barWidth }}>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 8, color: pdfPalette.textSecondary }}>Income</Text>
          <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: pdfPalette.textPrimary }}>{formatCurrency(income, currency)}</Text>
        </View>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 8, color: pdfPalette.textSecondary }}>Expenses</Text>
          <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: pdfPalette.textPrimary }}>{formatCurrency(expenses, currency)}</Text>
        </View>
      </View>
    </View>
  );
}

export function PdfTrendChart({
  points,
  currency,
  width = 460,
  height = 90,
}: {
  points: { date: string; amount: number }[];
  currency: string;
  width?: number;
  height?: number;
}) {
  if (points.length === 0) return null;
  const max = Math.max(...points.map((p) => p.amount), 1);
  const padding = 8;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;
  const stepX = points.length > 1 ? usableWidth / (points.length - 1) : 0;

  const coords = points.map((p, i) => ({
    x: padding + i * stepX,
    y: padding + usableHeight - (p.amount / max) * usableHeight,
  }));

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${height - padding} L ${coords[0].x} ${height - padding} Z`;

  const total = points.reduce((s, p) => s + p.amount, 0);

  return (
    <View>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke={pdfPalette.border} strokeWidth={1} />
        <Path d={areaPath} fill={pdfPalette.primaryLight} />
        <Path d={linePath} fill="none" stroke={pdfPalette.primary} strokeWidth={1.5} />
      </Svg>
      <Text style={{ fontSize: 8, color: pdfPalette.textTertiary, marginTop: 2 }}>
        Total across period: {formatCurrency(total, currency)}
      </Text>
    </View>
  );
}

export function PdfAllocationGauge({ rate, target, width = 220, height = 14 }: { rate: number; target: number; width?: number; height?: number }) {
  const clampedRate = Math.max(0, Math.min(rate, 100));
  const clampedTarget = Math.max(0, Math.min(target, 100));
  const fillWidth = (clampedRate / 100) * width;
  const targetX = (clampedTarget / 100) * width;
  const color = rate >= target ? pdfPalette.income : pdfPalette.savings;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Rect x={0} y={height / 2 - 3} width={width} height={6} rx={3} fill={pdfPalette.background} stroke={pdfPalette.border} strokeWidth={0.5} />
      <Rect x={0} y={height / 2 - 3} width={Math.max(fillWidth, 3)} height={6} rx={3} fill={color} />
      <Line x1={targetX} y1={0} x2={targetX} y2={height} stroke={pdfPalette.textSecondary} strokeWidth={1} />
    </Svg>
  );
}
