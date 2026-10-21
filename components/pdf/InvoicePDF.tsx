/**
 * InvoicePDF — Modèle de facture PDF SHIFT UP
 * Utilisé côté serveur via @react-pdf/renderer (renderToBuffer)
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const PRIMARY = "#0A2533";
const ACCENT  = "#2D5B78";
const LIGHT   = "#F8FAFC";

const s = StyleSheet.create({
  page:          { fontFamily: "Helvetica", fontSize: 9, color: PRIMARY, backgroundColor: "#FFFFFF", padding: 40 },
  header:        { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 },
  logoBox:       { backgroundColor: ACCENT, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  logoText:      { color: "#FFFFFF", fontFamily: "Helvetica-Bold", fontSize: 16, letterSpacing: 1 },
  invoiceTitle:  { fontSize: 20, fontFamily: "Helvetica-Bold", color: PRIMARY },
  invoiceNum:    { fontSize: 9, color: "#64748B", marginTop: 2 },
  divider:       { borderBottomWidth: 1, borderBottomColor: "#E2E8F0", marginVertical: 20 },
  row2:          { flexDirection: "row", gap: 20, marginBottom: 24 },
  infoBox:       { flex: 1, backgroundColor: LIGHT, borderRadius: 8, padding: 12 },
  infoLabel:     { fontSize: 7, color: "#94A3B8", fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  infoName:      { fontFamily: "Helvetica-Bold", fontSize: 10, marginBottom: 2 },
  infoLine:      { color: "#475569", marginBottom: 1.5 },
  tableHead:     { flexDirection: "row", backgroundColor: PRIMARY, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 2 },
  tableHeadText: { color: "#FFFFFF", fontFamily: "Helvetica-Bold", fontSize: 8 },
  tableRow:      { flexDirection: "row", paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  colDesc:       { flex: 1 },
  colQty:        { width: 50, textAlign: "center" },
  colUnit:       { width: 80, textAlign: "right" },
  colTotal:      { width: 80, textAlign: "right" },
  totalSection:  { flexDirection: "row", justifyContent: "flex-end", marginTop: 16 },
  totalBox:      { width: 200 },
  totalRow:      { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  totalLabel:    { color: "#64748B" },
  totalValue:    { fontFamily: "Helvetica-Bold" },
  grandTotal:    { flexDirection: "row", justifyContent: "space-between", backgroundColor: ACCENT, borderRadius: 6, padding: 10, marginTop: 6 },
  grandLabel:    { color: "#FFFFFF", fontFamily: "Helvetica-Bold", fontSize: 10 },
  grandValue:    { color: "#FFFFFF", fontFamily: "Helvetica-Bold", fontSize: 10 },
  badgeRow:      { flexDirection: "row", marginTop: 24, gap: 8 },
  badge:         { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, fontSize: 8, fontFamily: "Helvetica-Bold" },
  badgePaid:     { backgroundColor: "#D1FAE5", color: "#065F46" },
  badgePending:  { backgroundColor: "#FEF3C7", color: "#92400E" },
  footer:        { position: "absolute", bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: "#E2E8F0", paddingTop: 10, flexDirection: "row", justifyContent: "space-between" },
  footerText:    { fontSize: 7, color: "#94A3B8" },
});

export interface InvoiceData {
  reference: string;
  date: string;
  client: { name: string; email: string };
  prestation: { title: string; sector?: string | null };
  amount: number;
  currency: string;
  method: string;
  provider: string;
  status: "COMPLETED" | "PENDING" | "FAILED" | "REFUNDED";
}

function fmt(n: number, currency: string) {
  return `${n.toLocaleString("fr-FR")} ${currency}`;
}

export function InvoicePDF({ data }: { data: InvoiceData }) {
  const isPaid = data.status === "COMPLETED";

  return (
    <Document
      title={`Facture ${data.reference} — SHIFT UP`}
      author="SHIFT UP"
      subject="Facture de prestation"
    >
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <View style={s.logoBox}>
              <Text style={s.logoText}>SHIFT UP</Text>
            </View>
            <Text style={{ fontSize: 7, color: "#94A3B8", marginTop: 6 }}>Cabinet de Conseil & Solutions Numériques</Text>
            <Text style={{ fontSize: 7, color: "#94A3B8" }}>Abomey-Calavi, Bénin • www.shiftup.bj</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.invoiceTitle}>FACTURE</Text>
            <Text style={s.invoiceNum}>N° {data.reference}</Text>
            <Text style={{ ...s.invoiceNum, marginTop: 4 }}>Date : {data.date}</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* Client + Société */}
        <View style={s.row2}>
          <View style={s.infoBox}>
            <Text style={s.infoLabel}>Émetteur</Text>
            <Text style={s.infoName}>SHIFT UP SARL</Text>
            <Text style={s.infoLine}>RCCM : Cotonou N° RB/ABC/25 A 124734</Text>
            <Text style={s.infoLine}>IFU : 0202113434116</Text>
            <Text style={s.infoLine}>Tel : +229 01 95 03 50 99</Text>
            <Text style={s.infoLine}>Email : contact@shiftup.bj</Text>
          </View>
          <View style={s.infoBox}>
            <Text style={s.infoLabel}>Facturé à</Text>
            <Text style={s.infoName}>{data.client.name}</Text>
            <Text style={s.infoLine}>{data.client.email}</Text>
          </View>
        </View>

        {/* Table */}
        <View style={s.tableHead}>
          <Text style={{ ...s.tableHeadText, ...s.colDesc }}>Description</Text>
          <Text style={{ ...s.tableHeadText, ...s.colQty }}>Qté</Text>
          <Text style={{ ...s.tableHeadText, ...s.colUnit }}>PU</Text>
          <Text style={{ ...s.tableHeadText, ...s.colTotal }}>Total</Text>
        </View>
        <View style={s.tableRow}>
          <View style={s.colDesc}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>{data.prestation.title}</Text>
            {data.prestation.sector && (
              <Text style={{ color: "#94A3B8", fontSize: 7.5, marginTop: 1 }}>Secteur : {data.prestation.sector}</Text>
            )}
            <Text style={{ color: "#94A3B8", fontSize: 7.5, marginTop: 1 }}>Prestation SHIFT UP — Ref. {data.reference}</Text>
          </View>
          <Text style={{ ...s.colQty, ...s.infoLine }}>1</Text>
          <Text style={{ ...s.colUnit, ...s.infoLine }}>{fmt(data.amount, data.currency)}</Text>
          <Text style={{ ...s.colTotal, fontFamily: "Helvetica-Bold" }}>{fmt(data.amount, data.currency)}</Text>
        </View>

        {/* Totals */}
        <View style={s.totalSection}>
          <View style={s.totalBox}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Sous-total HT</Text>
              <Text style={s.totalValue}>{fmt(data.amount, data.currency)}</Text>
            </View>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>TVA (0%)</Text>
              <Text style={s.totalValue}>—</Text>
            </View>
            <View style={s.grandTotal}>
              <Text style={s.grandLabel}>Total à payer</Text>
              <Text style={s.grandValue}>{fmt(data.amount, data.currency)}</Text>
            </View>
          </View>
        </View>

        {/* Badges */}
        <View style={s.badgeRow}>
          <View style={[s.badge, isPaid ? s.badgePaid : s.badgePending]}>
            <Text>{isPaid ? "✓ Paiement reçu" : "En attente de paiement"}</Text>
          </View>
          <View style={[s.badge, { backgroundColor: "#EFF6FF", color: "#1E40AF" }]}> 
            <Text>Via {data.provider} ({data.method})</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>SHIFT UP — Cabinet de Conseil & Solutions Numériques, Bénin</Text>
          <Text style={s.footerText}>Facture générée automatiquement • shiftup.bj</Text>
        </View>

      </Page>
    </Document>
  );
}
