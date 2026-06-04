import { Outlet } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#020617] transition-colors duration-300">
      <Header />
      <main className="flex-1">
        {/* Child routes (Home, SignIn, etc.) will render right here */}
        <Outlet /> 
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;