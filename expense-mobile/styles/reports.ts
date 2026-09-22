import { StyleSheet } from 'react-native';

export const reportsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 14,
    color: '#111827',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  label: {
    color: '#666',
    marginBottom: 8,
  },
  income: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16A34A',
  },
  expense: {
    fontSize: 18,
    fontWeight: '700',
    color: '#DC2626',
  },
  balance: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#EEF0F3',
    borderRadius: 14,
    padding: 4,
    marginTop: 16,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#111827',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
  },
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  legend: {
    width: '100%',
    marginTop: 24,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendIconBadge: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  legendPercent: {
    fontSize: 12,
    color: '#9CA3AF',
    marginRight: 8,
  },
  legendAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },

  // สลับหน้า "รายงาน" / "จัดสรรงบ" อยู่บนสุดของหน้า แยกจาก tabRow (รายจ่าย/รายรับ)
  pageModeRow: {
    flexDirection: 'row',
    backgroundColor: '#EEF0F3',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  pageModeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  pageModeTabActive: {
    backgroundColor: '#FFFFFF',
  },
  pageModeText: {
    fontWeight: '600',
    color: '#6B7280',
  },
  pageModeTextActive: {
    color: '#2563EB',
  },

  // ใช้ในหน้า "จัดสรรงบ" ของหน้า Reports
  allocationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 12,
  },
  editPlanButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  allocationTargetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  allocationTargetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  allocationTargetValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  allocationSummaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  allocationItemBlock: {
    width: '100%',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  allocationItemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  allocationIconBadge: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allocationItemLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  allocationItemPercent: {
    fontSize: 12,
    color: '#9CA3AF',
    marginRight: 8,
  },
  allocationItemAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  allocationItemSpent: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  allocationTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
    marginTop: 8,
  },
  allocationFill: {
    height: 8,
    borderRadius: 4,
  },
  allocationSpentText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 6,
  },
  saveButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});