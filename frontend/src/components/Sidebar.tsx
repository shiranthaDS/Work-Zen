'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  FiChevronRight
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

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
        fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-40 transform transition-transform duration-300
        lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <FiUsers className="text-white" size={20} />
            </div>
            <div>
              <h1 className="font-bold text-xl text-gray-800">WorkZen</h1>
              <p className="text-xs text-gray-500">Employee Management</p>
            </div>
          </Link>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-100px)]">
          {menuItems.map((item) => (
            <div key={item.name}>
              {item.submenu ? (
                <>
                  <button
                    onClick={() => toggleSubmenu(item.name)}
                    className={`w-full sidebar-item ${isActive(item.href) ? 'sidebar-item-active' : ''}`}
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
                              ? 'bg-primary-100 text-primary-700 font-medium' 
                              : 'text-gray-600 hover:bg-gray-100'
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
                  className={`sidebar-item ${isActive(item.href) ? 'sidebar-item-active' : ''}`}
                >
                  <item.icon size={20} />
                  <span>{item.name}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
