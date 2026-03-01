import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, MapPin, Loader2 } from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { calculateSplits, SplitMethod, SplitUser } from '../utils/splitLogic';
import { ItemizedSplitModal } from '../components/ItemizedSplitModal';

export function AddExpense() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<SplitUser[]>([]);
  const [amountInput, setAmountInput] = useState('');
  const [description, setDescription] = useState('');
  const [payerId, setPayerId] = useState('user_a'); // Default to current user
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('EQUAL');
  const [exactInputs, setExactInputs] = useState<Record<string, string>>({});
  
  // Pro Features State
  const [locationName, setLocationName] = useState('');
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  
  const [receiptData, setReceiptData] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showItemizedModal, setShowItemizedModal] = useState(false);

  const amountInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus amount input on mount
    amountInputRef.current?.focus();
    
    // Fetch users
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data.map((u: any) => ({
          user_id: u.id,
          name: u.name,
          amount_cents: 0,
          percent: 0,
          shares: 1,
          is_selected: true
        })));
      });
  }, []);

  const totalAmountCents = Math.round(parseFloat(amountInput || '0') * 100);

  // Recalculate splits when dependencies change
  useEffect(() => {
    if (splitMethod !== 'EXACT') {
      setUsers(prev => calculateSplits(totalAmountCents, payerId, splitMethod, prev));
    }
  }, [totalAmountCents, payerId, splitMethod]);

  const handleUserToggle = (userId: string) => {
    setUsers(prev => {
      const next = prev.map(u => u.user_id === userId ? { ...u, is_selected: !u.is_selected } : u);
      return calculateSplits(totalAmountCents, payerId, splitMethod, next);
    });
  };

  const handleLocationTag = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocationLat(latitude);
        setLocationLng(longitude);

        try {
          const res = await fetch('/api/location/geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: latitude, lng: longitude })
          });
          const data = await res.json();
          setLocationName(data.name);
        } catch (error) {
          console.error('Failed to geocode location', error);
          setLocationName('Unknown Location');
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error('Geolocation error', error);
        alert('Failed to get location');
        setIsLocating(false);
      }
    );
  };

  const handleReceiptScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      // Remove the data:image/jpeg;base64, prefix
      const base64Data = base64String.split(',')[1];
      
      try {
        const res = await fetch('/api/receipts/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Data,
            mimeType: file.type
          })
        });
        
        if (!res.ok) throw new Error('Failed to scan receipt');
        
        const data = await res.json();
        setReceiptData(data);
        setAmountInput((data.total_cents / 100).toString());
        setDescription(data.merchant_name);
        setShowItemizedModal(true);
      } catch (error) {
        console.error('Receipt scan error', error);
        alert('Failed to scan receipt. Please try again.');
      } finally {
        setIsScanning(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleItemizedComplete = (calculatedSplits: { user_id: string; amount_cents: number }[]) => {
    setSplitMethod('EXACT');
    setUsers(prev => prev.map(u => {
      const split = calculatedSplits.find(s => s.user_id === u.user_id);
      if (split) {
        setExactInputs(prevInputs => ({ ...prevInputs, [u.user_id]: (split.amount_cents / 100).toString() }));
        return { ...u, amount_cents: split.amount_cents, is_selected: true };
      }
      return { ...u, amount_cents: 0, is_selected: false };
    }));
    setShowItemizedModal(false);
  };

  const currentSplitSum = users.reduce((sum, u) => sum + (u.is_selected ? u.amount_cents : 0), 0);
  const leftToSplit = totalAmountCents - currentSplitSum;
  const isValid = leftToSplit === 0 && totalAmountCents > 0 && description.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValid) return;

    const payload = {
      id: crypto.randomUUID(),
      group_id: 'group_1',
      payer_id: payerId,
      description,
      amount_cents: totalAmountCents,
      location_lat: locationLat,
      location_lng: locationLng,
      location_name: locationName,
      splits: users.filter(u => u.is_selected).map(u => ({
        id: crypto.randomUUID(),
        user_id: u.user_id,
        amount_cents: u.amount_cents
      }))
    };

    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      navigate(-1);
    } else {
      console.error('Failed to save expense');
    }
  };

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-50 bg-white flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
          <X size={24} />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">Add Expense</h2>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Amount Input */}
        <div className="text-center">
          <p className="text-sm font-medium text-gray-500 mb-2">How much?</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl text-gray-400">₹</span>
            <input
              ref={amountInputRef}
              type="number"
              step="0.01"
              value={amountInput}
              onChange={e => setAmountInput(e.target.value)}
              className="text-5xl font-semibold tabular-nums text-gray-900 bg-transparent border-none outline-none w-48 text-center placeholder-gray-300"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Description & Pro Features */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What was this for?"
              className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-400"
            />
            
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleReceiptScan} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isScanning}
              className={`p-2 rounded-xl transition-colors ${isScanning ? 'text-gray-400 bg-gray-100' : 'text-[#10B981] bg-[#10B981]/10 hover:bg-[#10B981]/20'}`}
              title="Scan Receipt"
            >
              {isScanning ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
            </button>
            <button 
              onClick={handleLocationTag}
              disabled={isLocating}
              className={`p-2 rounded-xl transition-colors ${isLocating ? 'text-gray-400 bg-gray-100' : 'text-[#10B981] bg-[#10B981]/10 hover:bg-[#10B981]/20'}`}
              title="Tag Location"
            >
              {isLocating ? <Loader2 size={20} className="animate-spin" /> : <MapPin size={20} />}
            </button>
          </div>
          {locationName && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 px-2">
              <MapPin size={12} className="text-[#10B981]" />
              <span>{locationName}</span>
              <button onClick={() => { setLocationName(''); setLocationLat(null); setLocationLng(null); }} className="ml-auto text-gray-400 hover:text-gray-600">
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Payer Selection */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600 font-medium">Paid by</span>
          <select 
            value={payerId}
            onChange={e => setPayerId(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-[#10B981]/50 font-medium"
          >
            {users.map(u => (
              <option key={u.user_id} value={u.user_id}>{u.name}</option>
            ))}
          </select>
        </div>

        {/* Split Methods */}
        <div className="space-y-4">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {(['EQUAL', 'EXACT', 'PERCENT', 'SHARES'] as SplitMethod[]).map(method => (
              <button
                key={method}
                onClick={() => setSplitMethod(method)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${splitMethod === method ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {method === 'EQUAL' ? '=' : method === 'EXACT' ? '₹' : method === 'PERCENT' ? '%' : 'Shares'}
              </button>
            ))}
          </div>

          {/* Users List */}
          <div className="space-y-3">
            {users.map((u, i) => (
              <div key={u.user_id} className={`flex items-center justify-between p-3 bg-white border rounded-2xl transition-colors ${u.is_selected ? 'border-[#10B981]/30 shadow-sm' : 'border-gray-100 opacity-60'}`}>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={u.is_selected}
                    onChange={() => handleUserToggle(u.user_id)}
                    className="w-5 h-5 text-[#10B981] rounded border-gray-300 focus:ring-[#10B981]"
                  />
                  <span className="font-medium text-gray-900">{u.name}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {splitMethod === 'EQUAL' && (
                    <span className="tabular-nums text-gray-900 font-medium">
                      {u.is_selected ? formatCurrency(u.amount_cents) : '₹0.00'}
                    </span>
                  )}
                  {splitMethod === 'EXACT' && (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        disabled={!u.is_selected}
                        value={exactInputs[u.user_id] ?? (u.amount_cents / 100).toString()}
                        onChange={e => {
                          setExactInputs(prev => ({ ...prev, [u.user_id]: e.target.value }));
                          const val = Math.round(parseFloat(e.target.value || '0') * 100);
                          setUsers(prev => {
                            const next = [...prev];
                            next[i].amount_cents = val;
                            return next;
                          });
                        }}
                        className="w-20 text-right tabular-nums bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-[#10B981]"
                      />
                    </div>
                  )}
                  {splitMethod === 'PERCENT' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        disabled={!u.is_selected}
                        value={u.is_selected ? u.percent : 0}
                        onChange={e => {
                          const val = parseFloat(e.target.value || '0');
                          setUsers(prev => {
                            const next = [...prev];
                            next[i].percent = val;
                            return calculateSplits(totalAmountCents, payerId, splitMethod, next);
                          });
                        }}
                        className="w-16 text-right tabular-nums bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-[#10B981]"
                      />
                      <span className="text-gray-400">%</span>
                      <span className="w-20 text-right tabular-nums text-sm text-gray-500">
                        {formatCurrency(u.amount_cents)}
                      </span>
                    </div>
                  )}
                  {splitMethod === 'SHARES' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        disabled={!u.is_selected}
                        value={u.is_selected ? u.shares : 0}
                        onChange={e => {
                          const val = parseFloat(e.target.value || '0');
                          setUsers(prev => {
                            const next = [...prev];
                            next[i].shares = val;
                            return calculateSplits(totalAmountCents, payerId, splitMethod, next);
                          });
                        }}
                        className="w-16 text-right tabular-nums bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-[#10B981]"
                      />
                      <span className="text-gray-400 text-sm">shares</span>
                      <span className="w-20 text-right tabular-nums text-sm text-gray-500">
                        {formatCurrency(u.amount_cents)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer / Validation */}
      <div className="p-4 bg-white border-t border-gray-100 pb-6 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-500">Left to split</span>
          <span className={`text-sm font-semibold tabular-nums ${leftToSplit === 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
            {formatCurrency(leftToSplit)}
          </span>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className={`w-full py-4 rounded-2xl font-semibold text-white transition-all ${
            isValid 
              ? 'bg-[#10B981] hover:bg-[#059669] shadow-lg shadow-[#10B981]/25' 
              : 'bg-gray-300 cursor-not-allowed opacity-50'
          }`}
        >
          Save Expense
        </button>
      </div>

      {/* Itemized Split Modal */}
      <AnimatePresence>
        {showItemizedModal && receiptData && (
          <ItemizedSplitModal
            receiptData={receiptData}
            users={users.map(u => ({ user_id: u.user_id, name: u.name }))}
            payerId={payerId}
            onComplete={handleItemizedComplete}
            onClose={() => setShowItemizedModal(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
