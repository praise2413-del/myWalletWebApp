import { format } from "date-fns";
import { StyleSheet, Text, View } from "@react-pdf/renderer";
import { pdfPalette } from "@/features/reports/lib/pdf/palette";
import { formatCurrency } from "@/lib/utils/currency";

const styles = StyleSheet.create({
  table: { marginTop: 8, borderWidth: 1, borderColor: pdfPalette.border, borderRadius: 4 },
  headerRow: { flexDirection: "row", backgroundColor: pdfPalette.background, borderBottomWidth: 1, borderBottomColor: pdfPalette.border },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: pdfPalette.border },
  lastRow: { flexDirection: "row" },
  cellHeader: { fontSize: 8, fontFamily: "Helvetica-Bold", color: pdfPalette.textSecondary, padding: 6 },
  cell: { fontSize: 8.5, color: pdfPalette.textPrimary, padding: 6 },
  cellAmount: { fontSize: 8.5, color: pdfPalette.textPrimary, padding: 6, textAlign: "right" },
  colDate: { width: "16%" },
  colLabel: { width: "26%" },
  colNote: { width: "38%" },
  colAmount: { width: "20%" },
  accent: { width: 3 },
  empty: { fontSize: 8.5, color: pdfPalette.textTertiary, padding: 8, textAlign: "center" },
});

export interface RecordsPdfRow {
  id: string;
  date: string;
  label: string;
  note: string | null;
  amount: number;
}

export function RecordsPdfTable({
  rows,
  currency,
  accentColor,
  emptyLabel,
  labelHeader = "Category",
}: {
  rows: RecordsPdfRow[];
  currency: string;
  accentColor: string;
  emptyLabel: string;
  labelHeader?: string;
}) {
  if (rows.length === 0) {
    return (
      <View style={styles.table}>
        <Text style={styles.empty}>{emptyLabel}</Text>
      </View>
    );
  }

  return (
    <View style={styles.table} wrap>
      <View style={styles.headerRow}>
        <View style={styles.accent} />
        <Text style={[styles.cellHeader, styles.colDate]}>Date</Text>
        <Text style={[styles.cellHeader, styles.colLabel]}>{labelHeader}</Text>
        <Text style={[styles.cellHeader, styles.colNote]}>Description</Text>
        <Text style={[styles.cellHeader, styles.colAmount]}>Amount</Text>
      </View>
      {rows.map((row, i) => (
        <View key={row.id} style={i === rows.length - 1 ? styles.lastRow : styles.row} wrap={false}>
          <View style={[styles.accent, { backgroundColor: accentColor }]} />
          <Text style={[styles.cell, styles.colDate]}>{format(new Date(`${row.date}T00:00:00`), "MMM d, yyyy")}</Text>
          <Text style={[styles.cell, styles.colLabel]}>{row.label}</Text>
          <Text style={[styles.cell, styles.colNote]}>{row.note ?? "—"}</Text>
          <Text style={[styles.cellAmount, styles.colAmount]}>{formatCurrency(row.amount, currency)}</Text>
        </View>
      ))}
    </View>
  );
}
