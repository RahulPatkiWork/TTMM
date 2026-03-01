import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Check } from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { ReceiptItem, calculateItemizedSplits } from '../utils/itemizedSplitLogic';

interface Props {
  receiptData: {
    merchant_name: string;
    items: { name: string; price_cents: number }[];
    tax_cents: number;
    tip_or_service_charge_cents: number;
    total_cents: number;
  };
  users: { user_id: string; name: string }[];
  payerId: string;
  onComplete: (splits: { user_id: string; amount_cents: number }[]) => void;
  onClose: () => void;
}

export function ItemizedSplitModal({ receiptData, users, payerId, onComplete, onClose }: Props) {
  const [items, setItems] = useState<ReceiptItem[]>(
    receiptData.items.map((item, i) => ({
      id: `item_${i}`,
      name: item.name,
      price_cents: item.price_cents,
      claimed_by: [],
    }))
  );

  const handleToggleClaim = (itemId: string, userId: string) => {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const claimed = item.claimed_by.includes(userId);
      return {
        ...item,
        claimed_by: claimed 
          ? item.claimed_by.filter(id => id !== userId)
          : [...item.claimed_by, userId]
      };
    }));
  };

  const calculatedSplits = calculateItemizedSplits(
    items,
    receiptData.tax_cents,
    receiptData.tip_or_service_charge_cents,
    payerId
  );

  const allClaimed = items.every(item => item.claimed_by.length > 0);

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[60] bg-white flex flex-col"
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
          <X size={24} />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">Itemized Split</h2>
        <button 
          onClick={() => onComplete(calculatedSplits.map(s => ({ user_id: s.user_id, amount_cents: s.total_cents })))}
          disabled={!allClaimed}
          className={`p-2 rounded-full transition-colors ${allClaimed ? 'text-[#10B981] hover:bg-[#10B981]/10' : 'text-gray-300 cursor-not-allowed'}`}
        >
          <Check size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900">{receiptData.merchant_name}</h3>
          <p className="text-sm text-gray-500">Tap items to claim them</p>
        </div>

        <div className="space-y-4">
          {items.map(item => (
            <div key={item.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <span className="font-medium text-gray-900">{item.name}</span>
                <span className="tabular-nums font-medium text-gray-900">{formatCurrency(item.price_cents)}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {users.map(u => {
                  const isClaimed = item.claimed_by.includes(u.user_id);
                  return (
                    <button
                      key={u.user_id}
                      onClick={() => handleToggleClaim(item.id, u.user_id)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                        isClaimed 
                          ? 'bg-[#10B981] text-white border border-[#10B981]' 
                          : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {u.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Tax</span>
            <span className="tabular-nums">{formatCurrency(receiptData.tax_cents)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Tip / Service</span>
            <span className="tabular-nums">{formatCurrency(receiptData.tip_or_service_charge_cents)}</span>
          </div>
          <div className="pt-2 border-t border-gray-100 flex justify-between font-semibold text-gray-900">
            <span>Total</span>
            <span className="tabular-nums">{formatCurrency(receiptData.total_cents)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Calculated Shares</h4>
          {calculatedSplits.map(s => {
            const user = users.find(u => u.user_id === s.user_id);
            if (!user || s.total_cents === 0) return null;
            return (
              <div key={s.user_id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-lg">
                <span className="text-gray-700">{user.name}</span>
                <div className="text-right">
                  <div className="font-medium tabular-nums text-gray-900">{formatCurrency(s.total_cents)}</div>
                  <div className="text-xs text-gray-400 tabular-nums">
                    (Sub: {formatCurrency(s.subtotal_cents)} + Tax: {formatCurrency(s.tax_cents)} + Tip: {formatCurrency(s.tip_cents)})
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
