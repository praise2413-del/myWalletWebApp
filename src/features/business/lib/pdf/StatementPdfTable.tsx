import { StyleSheet, Text, View } from "@react-pdf/renderer";
import { pdfPalette } from "@/features/reports/lib/pdf/palette";
import { formatCurrency } from "@/lib/utils/currency";

const styles = StyleSheet.create({
  table: { marginTop: 6, borderWidth: 1, borderColor: pdfPalette.border, borderRadius: 4 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: pdfPalette.border },
  lastRow: { flexDirection: "row" },
  totalRow: { flexDirection: "row", backgroundColor: pdfPalette.background, borderTopWidth: 1, borderTopColor: pdfPalette.border },
  cell: { fontSize: 8.5, color: pdfPalette.textPrimary, padding: 6 },
  cellAmount: { fontSize: 8.5, color: pdfPalette.textPrimary, padding: 6, textAlign: "right" },
  cellBold: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: pdfPalette.textPrimary, padding: 6 },
  cellAmountBold: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: pdfPalette.textPrimary, padding: 6, textAlign: "right" },
  colLabel: { flex: 1 },
  colAmount: { width: "30%" },
  colAmountHalf: { width: "24%" },
  empty: { fontSize: 8.5, color: pdfPalette.textTertiary, padding: 8, textAlign: "center" },
});

export interface StatementPdfRow {
  label: string;
  amount: number;
}

/** A simple label + amount table — used for Income Statement / Balance Sheet sections. */
export function StatementPdfTable({
  rows,
  total,
  totalLabel,
  currency,
  emptyLabel,
}: {
  rows: StatementPdfRow[];
  total: number;
  totalLabel: string;
  currency: string;
  emptyLabel: string;
}) {
  return (
    <View style={styles.table}>
      {rows.length === 0 ? (
        <Text style={styles.empty}>{emptyLabel}</Text>
      ) : (
        rows.map((row, i) => (
          <View key={`${row.label}-${i}`} style={i === rows.length - 1 ? styles.lastRow : styles.row}>
            <Text style={[styles.cell, styles.colLabel]}>{row.label}</Text>
            <Text style={[styles.cellAmount, styles.colAmount]}>{formatCurrency(row.amount, currency)}</Text>
          </View>
        ))
      )}
      <View style={styles.totalRow}>
        <Text style={[styles.cellBold, styles.colLabel]}>{totalLabel}</Text>
        <Text style={[styles.cellAmountBold, styles.colAmount]}>{formatCurrency(total, currency)}</Text>
      </View>
    </View>
  );
}

export interface TrialBalancePdfRow {
  code: string;
  name: string;
  debit: number;
  credit: number;
}

export function TrialBalancePdfTable({
  rows,
  totalDebit,
  totalCredit,
  currency,
}: {
  rows: TrialBalancePdfRow[];
  totalDebit: number;
  totalCredit: number;
  currency: string;
}) {
  return (
    <View style={styles.table}>
      {rows.map((row, i) => (
        <View key={row.code} style={i === rows.length - 1 ? styles.lastRow : styles.row}>
          <Text style={[styles.cell, styles.colLabel]}>
            {row.code} · {row.name}
          </Text>
          <Text style={[styles.cellAmount, styles.colAmountHalf]}>{row.debit > 0 ? formatCurrency(row.debit, currency) : "—"}</Text>
          <Text style={[styles.cellAmount, styles.colAmountHalf]}>{row.credit > 0 ? formatCurrency(row.credit, currency) : "—"}</Text>
        </View>
      ))}
      <View style={styles.totalRow}>
        <Text style={[styles.cellBold, styles.colLabel]}>Total</Text>
        <Text style={[styles.cellAmountBold, styles.colAmountHalf]}>{formatCurrency(totalDebit, currency)}</Text>
        <Text style={[styles.cellAmountBold, styles.colAmountHalf]}>{formatCurrency(totalCredit, currency)}</Text>
      </View>
    </View>
  );
}
