import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export function Layout() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 font-sans pb-24 selection:bg-[#10B981]/20">
      <main className="max-w-md mx-auto w-full px-4 pt-8">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
