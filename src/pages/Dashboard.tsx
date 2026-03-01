import { useEffect, useState } from 'react';
import { formatCurrency } from '../utils/currency';
import { ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { Debt } from '../lib/algorithms/settlement';

interface User {
  id: string;
  name: string;
}

export function Dashboard() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);

  // Hardcoded for the demo, assuming we are "user_a" (Alice)
  const CURRENT_USER_ID = 'user_a';
  const GROUP_ID = 'group_1';

  useEffect(() => {
    async function fetchData() {
      try {
        const [usersRes, balancesRes] = await Promise.all([
          fetch('/api/users'),
          fetch(`/api/groups/${GROUP_ID}/balances`),
        ]);

        const usersData = await usersRes.json();
        const balancesData = await balancesRes.json();

        const userMap: Record<string, User> = {};
        usersData.forEach((u: User) => {
          userMap[u.id] = u;
        });

        setUsers(userMap);
        setDebts(balancesData.simplified_debts);
      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Calculate total balance for current user
  let totalOwedToMe = 0;
  let totalIOwe = 0;

  const myDebts = debts.filter(d => d.from === CURRENT_USER_ID);
  const myCredits = debts.filter(d => d.to === CURRENT_USER_ID);

  myDebts.forEach(d => totalIOwe += d.amount);
  myCredits.forEach(d => totalOwedToMe += d.amount);

  const netBalance = totalOwedToMe - totalIOwe;
  const isPositive = netBalance >= 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome back, {users[CURRENT_USER_ID]?.name}</p>
        </div>
        <div className="w-10 h-10 bg-[#10B981]/10 rounded-full flex items-center justify-center">
          <Wallet className="text-[#10B981]" size={20} />
        </div>
      </header>

      {/* Total Balance Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#10B981]/5 to-transparent rounded-full -mr-16 -mt-16"></div>
        
        <p className="text-sm font-medium text-gray-500 mb-1">Total Balance</p>
        <h2 className={`text-4xl font-semibold tracking-tight tabular-nums ${isPositive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
          {formatCurrency(netBalance)}
        </h2>

        <div className="flex items-center gap-6 mt-6 pt-6 border-t border-gray-50">
          <div>
            <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-1">
              <ArrowDownRight size={16} className="text-[#10B981]" />
              <span>You are owed</span>
            </div>
            <p className="text-lg font-medium tabular-nums text-gray-900">{formatCurrency(totalOwedToMe)}</p>
          </div>
          <div className="w-px h-10 bg-gray-100"></div>
          <div>
            <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-1">
              <ArrowUpRight size={16} className="text-[#EF4444]" />
              <span>You owe</span>
            </div>
            <p className="text-lg font-medium tabular-nums text-gray-900">{formatCurrency(totalIOwe)}</p>
          </div>
        </div>
      </div>

      {/* Simplified Debts List */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Settlement Plan</h3>
        {debts.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-500">You're all settled up! 🎉</p>
          </div>
        ) : (
          <div className="space-y-3">
            {debts.map((debt, i) => {
              const isMeDebtor = debt.from === CURRENT_USER_ID;
              const isMeCreditor = debt.to === CURRENT_USER_ID;
              
              // If I'm not involved, maybe show it differently or just show it normally
              // For a personal dashboard, usually you only see your own debts. 
              // But since this is a group settlement view, we show all.
              
              const debtorName = isMeDebtor ? 'You' : users[debt.from]?.name || 'Unknown';
              const creditorName = isMeCreditor ? 'You' : users[debt.to]?.name || 'Unknown';
              
              return (
                <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isMeDebtor ? 'bg-[#EF4444]/10 text-[#EF4444]' : 'bg-[#10B981]/10 text-[#10B981]'}`}>
                      {isMeDebtor ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {debtorName} <span className="text-gray-400 font-normal mx-1">owes</span> {creditorName}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold tabular-nums text-gray-900">
                    {formatCurrency(debt.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
