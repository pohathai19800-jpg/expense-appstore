import { StyleSheet } from 'react-native';

export const savingsGoalStyles = StyleSheet.create({
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
  percentText: {
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
    backgroundColor: '#16A34A',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  depositButton: {
    backgroundColor: '#DCFCE7',
  },
  depositButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16A34A',
  },
  withdrawButton: {
    backgroundColor: '#FEE2E2',
  },
  withdrawButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
  reachedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 2,
  },
  reachedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
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

  // ใช้ในหน้า Home (overview)
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

  // หน้าฝาก/ถอนเงิน
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
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
