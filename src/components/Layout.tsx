import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { CreditCard, ShoppingCart, History, LogOut, Utensils, Package2, Upload } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { logout as apiLogout } from '../lib/api';
import toast from 'react-hot-toast';
import Logo from './Logo';

export default function Layout() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);


  const navigation = [
    { name: 'Dashboard', href: '/', icon: CreditCard },
    { name: 'Point of Sale', href: '/pos', icon: ShoppingCart },
    { name: 'Lunch Service', href: '/lunch', icon: Utensils },
    { name: 'History', href: '/history', icon: History },
    // { name: 'CreateStudent', href: '/cstudent', icon: History },
    // { name: 'Bulk Upload', href: '/bulk-upload', icon: Upload },
    { name: 'Bulk Update', href: '/bulk-update', icon: Upload },
    ...(user?.role === 'ADMIN' ? [{ name: 'Products', href: '/products', icon: Package2 }] : []),
  ];

  const handleLogout = async () => {
    try {
      await apiLogout(); // Call the API logout function
      logout(); // Update the auth store state
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout properly');
      // Still clear local state even if server logout fails
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Logo />
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      `inline-flex items-center px-1 pt-1 text-sm font-medium ${
                        isActive
                          ? 'text-green-600 border-b-2 border-green-600'
                          : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`
                    }
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </NavLink>
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}