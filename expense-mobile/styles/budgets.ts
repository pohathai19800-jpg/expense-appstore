import { StyleSheet } from 'react-native';

export const budgetStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 10,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  scope: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'right',
  },
  amountOfText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  fill: {
    height: 8,
    borderRadius: 4,
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },

  // ใช้ในหน้ารวมรายการ + หน้า Home
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
  },

  showToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  showToggleLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
});
