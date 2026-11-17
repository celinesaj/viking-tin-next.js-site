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

// Built-in Helvetica font – no external downloads
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#000000',
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
    borderBottomColor: '#e5e7eb',
  },
  logo: { width: 100, height: 42, objectFit: 'contain' },
  invoiceTitle: { fontSize: 28, fontWeight: 'bold', textTransform: 'uppercase', marginTop: 10 },
  dateText: { fontSize: 9, color: 'rgba(0,0,0,0.5)', marginTop: 8 },
  dateValue: { fontWeight: 'bold', color: '#000000' },
  invoiceNoBox: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 10,
    alignItems: 'flex-end',
  },
  invoiceNoLabel: { fontSize: 8, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(0,0,0,0.45)' },
  invoiceNoValue: { fontSize: 10, fontWeight: 'bold', marginTop: 2 },
  infoRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  infoBlock: { flex: 1, backgroundColor: '#f9fafb', borderRadius: 12, padding: 12 },
  infoTitle: { fontSize: 8, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(0,0,0,0.45)', marginBottom: 6 },
  infoName: { fontWeight: 'bold', fontSize: 10, marginBottom: 2 },
  infoLine: { fontSize: 9, color: 'rgba(0,0,0,0.65)', marginBottom: 1 },
  tableWrapper: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableHeadCell: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: 'rgba(0,0,0,0.5)',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  tableCell: { fontSize: 9, color: 'rgba(0,0,0,0.65)' },
  tableCellBold: { fontSize: 9, fontWeight: 'bold', color: '#000000' },
  colItem: { width: '32%' },
  colDiscount: { width: '13%', textAlign: 'center' },
  colQty: { width: '8%', textAlign: 'center' },
  colPrice: { width: '17%', textAlign: 'center' },
  colType: { width: '14%', textAlign: 'center' },
  colAmount: { width: '16%', textAlign: 'right' },
  summaryOuter: { marginTop: 16, alignItems: 'flex-end' },
  summaryBox: { width: '45%', backgroundColor: '#f9fafb', borderRadius: 12, padding: 14 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  summaryLabel: { fontSize: 9, color: 'rgba(0,0,0,0.65)' },
  summaryValue: { fontSize: 9, fontWeight: 'bold', color: '#000000' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  totalLabel: { fontSize: 12, fontWeight: 'bold' },
  totalValue: { fontSize: 12, fontWeight: 'bold' },
  footer: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  footerText: { fontSize: 9, color: 'rgba(0,0,0,0.5)' },
  footerValue: { fontWeight: 'bold', color: '#000000' },
});

type Props = {
  invoice: InvoiceData;
  logoUrl: string;
};

export default function InvoicePdfServer({ invoice, logoUrl }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Image src={logoUrl} style={styles.logo} />
            <Text style={styles.invoiceTitle}>Invoice</Text>
            <Text style={styles.dateText}>
              Date: <Text style={styles.dateValue}>{invoice.date?.trim() || '—'}</Text>
            </Text>
          </View>
          <View style={styles.invoiceNoBox}>
            <Text style={styles.invoiceNoLabel}>Invoice No.</Text>
            <Text style={styles.invoiceNoValue}>{invoice.invoiceNumber}</Text>
          </View>
        </View>

        {/* Billed To / From */}
        <View style={styles.infoRow}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>Billed To</Text>
            <Text style={styles.infoName}>{invoice.billedTo.name}</Text>
            {invoice.billedTo.addressLine1 && <Text style={styles.infoLine}>{invoice.billedTo.addressLine1}</Text>}
            {invoice.billedTo.addressLine2 && <Text style={styles.infoLine}>{invoice.billedTo.addressLine2}</Text>}
            {invoice.billedTo.email && <Text style={styles.infoLine}>{invoice.billedTo.email}</Text>}
            {invoice.billedTo.phone && <Text style={styles.infoLine}>{invoice.billedTo.phone}</Text>}
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>From</Text>
            <Text style={styles.infoName}>{invoice.from.name}</Text>
            {invoice.from.addressLine1 && <Text style={styles.infoLine}>{invoice.from.addressLine1}</Text>}
            {invoice.from.addressLine2 && <Text style={styles.infoLine}>{invoice.from.addressLine2}</Text>}
            {invoice.from.email && <Text style={styles.infoLine}>{invoice.from.email}</Text>}
            {invoice.from.phone && <Text style={styles.infoLine}>{invoice.from.phone}</Text>}
          </View>
        </View>

        {/* Table */}
        <View style={styles.tableWrapper}>
          <View style={styles.tableHead}>
            <Text style={[styles.tableHeadCell, styles.colItem]}>Item</Text>
            <Text style={[styles.tableHeadCell, styles.colDiscount]}>Discount</Text>
            <Text style={[styles.tableHeadCell, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeadCell, styles.colPrice]}>Price</Text>
            <Text style={[styles.tableHeadCell, styles.colType]}>Type</Text>
            <Text style={[styles.tableHeadCell, styles.colAmount]}>Amount</Text>
          </View>

          {invoice.items.map((row) => (
            <View key={row.id} style={styles.tableRow} wrap={false}>
              <Text style={[styles.tableCellBold, styles.colItem]}>{row.item}</Text>
              <Text style={[styles.tableCell, styles.colDiscount]}>
                {row.discountPercent && row.discountPercent > 0
                  ? `${row.discountPercent.toFixed(1)}%`
                  : row.discountAmount && row.discountAmount > 0
                  ? formatPrice(row.discountAmount)
                  : '—'}
              </Text>
              <Text style={[styles.tableCell, styles.colQty]}>{row.quantity}</Text>
              <Text style={[styles.tableCell, styles.colPrice]}>{formatPrice(row.price)}</Text>
              <Text style={[styles.tableCell, styles.colType, { textTransform: 'capitalize' }]}>
                {row.type.replace(/_/g, ' ')}
              </Text>
              <Text style={[styles.tableCellBold, styles.colAmount]}>{formatPrice(row.amount)}</Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summaryOuter}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatPrice(invoice.summary.subtotal)}</Text>
            </View>
            {invoice.summary.discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={styles.summaryValue}>-{formatPrice(invoice.summary.discount)}</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Taxes</Text>
              <Text style={styles.summaryValue}>{formatPrice(invoice.summary.taxes)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery</Text>
              <Text style={styles.summaryValue}>{formatPrice(invoice.summary.deliveryCharge)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatPrice(invoice.summary.total)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Payment Method: <Text style={styles.footerValue}>{invoice.paymentMethod}</Text>
          </Text>
          {invoice.note && (
            <Text style={[styles.footerText, { marginTop: 4 }]}>
              Note: <Text style={styles.footerValue}>{invoice.note}</Text>
            </Text>
          )}
        </View>
      </Page>
    </Document>
  );
}