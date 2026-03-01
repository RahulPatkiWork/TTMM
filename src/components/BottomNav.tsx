import { NavLink } from 'react-router-dom';
import { Home, Users, PlusCircle, Activity, User } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function BottomNav() {
  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Friends', path: '/friends', icon: Users },
    { name: 'Add', path: '/add', icon: PlusCircle, isPrimary: true },
    { name: 'Activity', path: '/activity', icon: Activity },
    { name: 'Account', path: '/account', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-6 pt-2 px-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
      <div className="max-w-md mx-auto flex justify-between items-center pb-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center w-16 gap-1 transition-colors',
                  isActive ? 'text-[#10B981]' : 'text-gray-400 hover:text-gray-600',
                  item.isPrimary && 'text-[#10B981]'
                )
              }
            >
              {item.isPrimary ? (
                <div className="bg-[#10B981] text-white p-3 rounded-full shadow-md -mt-6 border-4 border-white">
                  <Icon size={24} />
                </div>
              ) : (
                <>
                  <Icon size={24} />
                  <span className="text-[10px] font-medium">{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
