import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';

// TODO: เอา Public API Key จาก RevenueCat dashboard มาใส่ตรงนี้
// (Project settings > API Keys > Public app-specific key ของแอป Android)
const REVENUECAT_API_KEY = 'test_UWQGvHpVSrBqWEpiTPkQVxbDapH';

// ต้องตรงกับ identifier ของ Entitlement ที่สร้างไว้ใน RevenueCat > Entitlements
// (สร้าง entitlement ชื่อ "pro" แล้วผูกกับ subscription product ที่ Google Play)
const ENTITLEMENT_ID = 'pro';

type PurchasesContextValue = {
  // true = สมัครสมาชิก Pro อยู่ (ปลดล็อกทุกฟีเจอร์)
  isPro: boolean;
  // true = กำลังเช็คสถานะสมาชิกครั้งแรก (ยังไม่ควรเชื่อค่า isPro จนกว่าจะ false)
  loading: boolean;
  offering: PurchasesOffering | null;
  purchasePackage: (pkg: PurchasesPackage) => Promise<void>;
  restorePurchases: () => Promise<void>;
};

const PurchasesContext = createContext<PurchasesContextValue | null>(null);

function hasProEntitlement(customerInfo: CustomerInfo): boolean {
  return typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
}

export function PurchasesProvider({ children }: { children: ReactNode }) {
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);

  useEffect(() => {
    let isActive = true;

    async function init() {
      try {
        Purchases.configure({ apiKey: REVENUECAT_API_KEY });

        const customerInfo = await Purchases.getCustomerInfo();
        if (isActive) setIsPro(hasProEntitlement(customerInfo));

        const offerings = await Purchases.getOfferings();
        if (isActive) setOffering(offerings.current);

        Purchases.addCustomerInfoUpdateListener((info) => {
          if (isActive) setIsPro(hasProEntitlement(info));
        });
      } catch (error) {
        console.error('Failed to initialize Purchases:', error);
      } finally {
        if (isActive) setLoading(false);
      }
    }

    init();

    return () => {
      isActive = false;
    };
  }, []);

  const purchasePackage = async (pkg: PurchasesPackage) => {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    setIsPro(hasProEntitlement(customerInfo));
  };

  const restorePurchases = async () => {
    const customerInfo = await Purchases.restorePurchases();
    setIsPro(hasProEntitlement(customerInfo));
  };

  return (
    <PurchasesContext.Provider
      value={{ isPro, loading, offering, purchasePackage, restorePurchases }}
    >
      {children}
    </PurchasesContext.Provider>
  );
}

export function usePurchases() {
  const ctx = useContext(PurchasesContext);

  if (!ctx) {
    throw new Error('usePurchases must be used within a PurchasesProvider');
  }

  return ctx;
}
