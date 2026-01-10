'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  FiHome, 
  FiUsers, 
  FiBriefcase, 
  FiCalendar, 
  FiClock, 
  FiDollarSign,
  FiMessageSquare,
  FiMenu,
  FiX,
  FiChevronDown,
  FiChevronRight,
  FiLogOut
} from 'react-icons/fi';

const menuItems = [
  { name: 'Dashboard', href: '/', icon: FiHome },
  { 
    name: 'Employees', 
    href: '/employees', 
    icon: FiUsers,
    submenu: [
      { name: 'All Employees', href: '/employees' },
      { name: 'Add Employee', href: '/employees/add' },
    ]
  },
  { 
    name: 'Job & Organization', 
    href: '/job-data', 
    icon: FiBriefcase,
    submenu: [
      { name: 'All Job Data', href: '/job-data' },
      { name: 'Add Job Data', href: '/job-data/add' },
    ]
  },
  { 
    name: 'Attendance', 
    href: '/attendance', 
    icon: FiClock,
    submenu: [
      { name: 'Attendance Records', href: '/attendance' },
      { name: 'Mark Attendance', href: '/attendance/add' },
    ]
  },
  { 
    name: 'Leave Management', 
    href: '/leaves', 
    icon: FiCalendar,
    submenu: [
      { name: 'Leave Requests', href: '/leaves' },
      { name: 'Apply Leave', href: '/leaves/add' },
      { name: 'Leave Balances', href: '/leaves/balances' },
      { name: 'Add Balance', href: '/leaves/balances/add' },
    ]
  },
  { 
    name: 'Payroll', 
    href: '/payroll', 
    icon: FiDollarSign,
    submenu: [
      { name: 'Payroll Records', href: '/payroll' },
      { name: 'Create Payroll', href: '/payroll/add' },
      { name: 'Salary Structures', href: '/payroll/salary-structures' },
      { name: 'Add Salary Structure', href: '/payroll/salary-structures/add' },
    ]
  },
  { name: 'AI Assistant', href: '/chat', icon: FiMessageSquare },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [username, setUsername] = useState<string | null>(null);

  // Get username from localStorage
  useState(() => {
    if (typeof window !== 'undefined') {
      setUsername(localStorage.getItem('username'));
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    router.push('/login');
  };

  const toggleSubmenu = (name: string) => {
    setExpandedItems(prev => 
      prev.includes(name) 
        ? prev.filter(item => item !== name)
        : [...prev, name]
    );
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md"
      >
        {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-gray-900 shadow-xl z-40 transform transition-transform duration-300
        lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-gray-800">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <FiUsers className="text-white" size={20} />
            </div>
            <div>
              <h1 className="font-bold text-xl text-white">WorkZen</h1>
              <p className="text-xs text-gray-400">Employee Management</p>
            </div>
          </Link>
          
          {/* User info */}
          <div className="mt-4 pt-4 border-t border-gray-800">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">{username?.[0]?.toUpperCase() || 'A'}</span>
              </div>
              <span className="text-gray-300">{username || 'Admin'}</span>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-200px)]">
          {menuItems.map((item) => (
            <div key={item.name}>
              {item.submenu ? (
                <>
                  <button
                    onClick={() => toggleSubmenu(item.name)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive(item.href) ? 'bg-primary-600 text-white font-medium' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                  >
                    <item.icon size={20} />
                    <span className="flex-1 text-left">{item.name}</span>
                    {expandedItems.includes(item.name) ? (
                      <FiChevronDown size={16} />
                    ) : (
                      <FiChevronRight size={16} />
                    )}
                  </button>
                  {expandedItems.includes(item.name) && (
                    <div className="ml-9 mt-1 space-y-1">
                      {item.submenu.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`block px-4 py-2 rounded-lg text-sm transition-colors
                            ${pathname === subItem.href 
                              ? 'bg-primary-600 text-white font-medium' 
                              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            }`}
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive(item.href) ? 'bg-primary-600 text-white font-medium' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                >
                  <item.icon size={20} />
                  <span>{item.name}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>
        
        {/* Logout button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800 bg-gray-900">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
          >
            <FiLogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

