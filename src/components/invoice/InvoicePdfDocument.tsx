import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';
import type { InvoiceData } from '@/types/invoice';
import { formatPrice } from '@/lib/PriceFormat';

// No custom font registration – using PDF defaults

const c = {
  black: '#000000',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  text: '#000000',
  muted: 'rgba(0,0,0,0.5)',
  mutedMore: 'rgba(0,0,0,0.45)',
  body: 'rgba(0,0,0,0.65)',
};

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica', // Default PDF font
    fontSize: 10,
    color: c.text,
    backgroundColor: '#ffffff',
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: c.gray200,
  },
  logo: { width: 100, height: 42, objectFit: 'contain' },
  invoiceTitle: { fontSize: 28, fontWeight: 'bold', textTransform: 'uppercase', marginTop: 10 },
  dateText: { fontSize: 9, color: c.muted, marginTop: 8 },
  dateValue: { fontWeight: 'bold', color: c.black },
  invoiceNoBox: {
    borderWidth: 1,
    borderColor: c.gray200,
    borderRadius: 10,
    padding: 10,
    alignItems: 'flex-end',
  },
  invoiceNoLabel: { fontSize: 8, textTransform: 'uppercase', letterSpacing: 1, color: c.mutedMore },
  invoiceNoValue: { fontSize: 10, fontWeight: 'bold', marginTop: 2 },
  infoRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  infoBlock: { flex: 1, backgroundColor: c.gray50, borderRadius: 12, padding: 12 },
  infoTitle: { fontSize: 8, textTransform: 'uppercase', letterSpacing: 1, color: c.mutedMore, marginBottom: 6 },
  infoName: { fontWeight: 'bold', fontSize: 10, marginBottom: 2 },
  infoLine: { fontSize: 9, color: c.body, marginBottom: 1 },
  tableWrapper: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: c.gray200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: c.gray100,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableHeadCell: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: c.muted,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: c.gray200,
  },
  tableCell: { fontSize: 9, color: c.body },
  tableCellBold: { fontSize: 9, fontWeight: 'bold', color: c.black },
  colItem: { width: '32%' },
  colDiscount: { width: '13%', textAlign: 'center' },
  colQty: { width: '8%', textAlign: 'center' },
  colPrice: { width: '17%', textAlign: 'center' },
  colType: { width: '14%', textAlign: 'center' },
  colAmount: { width: '16%', textAlign: 'right' },
  summaryOuter: { marginTop: 16, alignItems: 'flex-end' },
  summaryBox: { width: '45%', backgroundColor: c.gray50, borderRadius: 12, padding: 14 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  summaryLabel: { fontSize: 9, color: c.body },
  summaryValue: { fontSize: 9, fontWeight: 'bold', color: c.black },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: c.gray200,
  },
  totalLabel: { fontSize: 12, fontWeight: 'bold' },
  totalValue: { fontSize: 12, fontWeight: 'bold' },
  footer: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.gray200 },
  footerText: { fontSize: 9, color: c.muted },
  footerValue: { fontWeight: 'bold', color: c.black },
});

type Props = { invoice: InvoiceData; logoUrl?: string };

export function InvoicePdfDocument({ invoice, logoUrl }: Props) {
  const logoSource = logoUrl || 'https://yourdomain.com/images/logo/logo.png';

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Image src={logoSource} style={s.logo} />
            <Text style={s.invoiceTitle}>Invoice</Text>
            <Text style={s.dateText}>
              Date: <Text style={s.dateValue}>{invoice.date?.trim() || '—'}</Text>
            </Text>
          </View>
          <View style={s.invoiceNoBox}>
            <Text style={s.invoiceNoLabel}>Invoice No.</Text>
            <Text style={s.invoiceNoValue}>{invoice.invoiceNumber}</Text>
          </View>
        </View>

        {/* Billed To / From */}
        <View style={s.infoRow}>
          <View style={s.infoBlock}>
            <Text style={s.infoTitle}>Billed To</Text>
            <Text style={s.infoName}>{invoice.billedTo.name}</Text>
            {invoice.billedTo.addressLine1 && <Text style={s.infoLine}>{invoice.billedTo.addressLine1}</Text>}
            {invoice.billedTo.addressLine2 && <Text style={s.infoLine}>{invoice.billedTo.addressLine2}</Text>}
            {invoice.billedTo.email && <Text style={s.infoLine}>{invoice.billedTo.email}</Text>}
            {invoice.billedTo.phone && <Text style={s.infoLine}>{invoice.billedTo.phone}</Text>}
          </View>
          <View style={s.infoBlock}>
            <Text style={s.infoTitle}>From</Text>
            <Text style={s.infoName}>{invoice.from.name}</Text>
            {invoice.from.addressLine1 && <Text style={s.infoLine}>{invoice.from.addressLine1}</Text>}
            {invoice.from.addressLine2 && <Text style={s.infoLine}>{invoice.from.addressLine2}</Text>}
            {invoice.from.email && <Text style={s.infoLine}>{invoice.from.email}</Text>}
            {invoice.from.phone && <Text style={s.infoLine}>{invoice.from.phone}</Text>}
          </View>
        </View>

        {/* Table */}
        <View style={s.tableWrapper}>
          <View style={s.tableHead}>
            <Text style={[s.tableHeadCell, s.colItem]}>Item</Text>
            <Text style={[s.tableHeadCell, s.colDiscount]}>Discount</Text>
            <Text style={[s.tableHeadCell, s.colQty]}>Qty</Text>
            <Text style={[s.tableHeadCell, s.colPrice]}>Price</Text>
            <Text style={[s.tableHeadCell, s.colType]}>Type</Text>
            <Text style={[s.tableHeadCell, s.colAmount]}>Amount</Text>
          </View>

          {invoice.items.map((row) => (
            <View key={row.id} style={s.tableRow} wrap={false}>
              <Text style={[s.tableCellBold, s.colItem]}>{row.item}</Text>
              <Text style={[s.tableCell, s.colDiscount]}>
                {row.discountPercent && row.discountPercent > 0
                  ? `${row.discountPercent.toFixed(1)}%`
                  : row.discountAmount && row.discountAmount > 0
                  ? formatPrice(row.discountAmount)
                  : '—'}
              </Text>
              <Text style={[s.tableCell, s.colQty]}>{row.quantity}</Text>
              <Text style={[s.tableCell, s.colPrice]}>{formatPrice(row.price)}</Text>
              <Text style={[s.tableCell, s.colType, { textTransform: 'capitalize' }]}>
                {row.type.replace(/_/g, ' ')}
              </Text>
              <Text style={[s.tableCellBold, s.colAmount]}>{formatPrice(row.amount)}</Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={s.summaryOuter}>
          <View style={s.summaryBox}>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Subtotal</Text>
              <Text style={s.summaryValue}>{formatPrice(invoice.summary.subtotal)}</Text>
            </View>
            {invoice.summary.discount > 0 && (
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Discount</Text>
                <Text style={s.summaryValue}>-{formatPrice(invoice.summary.discount)}</Text>
              </View>
            )}
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Taxes</Text>
              <Text style={s.summaryValue}>{formatPrice(invoice.summary.taxes)}</Text>
            </View>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Delivery</Text>
              <Text style={s.summaryValue}>{formatPrice(invoice.summary.deliveryCharge)}</Text>
            </View>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Total</Text>
              <Text style={s.totalValue}>{formatPrice(invoice.summary.total)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>
            Payment Method: <Text style={s.footerValue}>{invoice.paymentMethod}</Text>
          </Text>
          {invoice.note && (
            <Text style={[s.footerText, { marginTop: 4 }]}>
              Note: <Text style={s.footerValue}>{invoice.note}</Text>
            </Text>
          )}
        </View>
      </Page>
    </Document>
  );
}