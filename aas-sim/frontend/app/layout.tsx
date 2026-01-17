import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AAS Simulation Dashboard',
  description: 'Asset Administration Shell simulation for Smart Factory usage-based billing',
};

function Navigation() {
  const navItems = [
    { href: '/', label: 'Overview', icon: '📊' },
    { href: '/composer', label: 'Job Manager', icon: '⚙️' },
    { href: '/billing', label: 'Cost Report', icon: '📈' },
  ];

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-50">
      <div className="w-full px-6">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl shadow-lg">
              <span className="text-2xl">🏭</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-700 to-primary-900 bg-clip-text text-transparent">
                AAS Simulation
              </h1>
              <p className="text-sm text-gray-600">Smart Factory Dashboard</p>
            </div>
          </div>
          <div className="flex space-x-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-primary-700 hover:bg-primary-50/50 transition-all duration-200 backdrop-blur-sm border border-transparent hover:border-primary-200/30"
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen`}>
        <Navigation />
        <main className="w-full px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}