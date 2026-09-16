import { StyleSheet } from 'react-native';

export const billStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  autoChargeLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  statusPaid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusPaidText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  statusUnpaidText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  markPaidButton: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  markPaidButtonText: {
    fontSize: 12,
    fontWeight: '700',
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
});
