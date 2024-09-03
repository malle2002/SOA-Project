import Header from './header';
import Footer from './footer';
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className='flex flex-col justify-between min-h-screen'>
      <Header />
      <main className='mt-20 bg-white dark:bg-black'>{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
