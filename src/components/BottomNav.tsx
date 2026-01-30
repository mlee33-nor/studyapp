import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, BarChart3, BookOpen, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/stats', label: 'Stats', icon: BarChart3 },
    { path: '/journal', label: 'Journal', icon: BookOpen },
    { path: '/meadow', label: 'Meadow', icon: () => (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ) },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-200 safe-area-inset-bottom z-40">
      <div className="flex justify-around items-center h-20 px-4 max-w-lg mx-auto">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center gap-1 relative py-2 px-4 transition-all duration-200"
            >
              <motion.div
                animate={{
                  scale: active ? 1.1 : 1,
                  y: active ? -2 : 0
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Icon
                  className={`w-6 h-6 transition-colors ${
                    active ? 'text-pastel-green-dark' : 'text-text-secondary'
                  }`}
                  strokeWidth={active ? 2.5 : 2}
                />
              </motion.div>

              <span className={`text-xs font-medium transition-opacity ${
                active ? 'opacity-100 text-pastel-green-dark' : 'opacity-60 text-text-secondary'
              }`}>
                {item.label}
              </span>

              {active && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-pastel-green-dark rounded-t-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
