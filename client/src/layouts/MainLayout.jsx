import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const MainLayout = () => {
    return (
        <div className="min-h-[100dvh] bg-dark text-white flex flex-col lg:flex-row pb-16 lg:pb-0">
            <Sidebar />
            <main className="flex-1 w-full lg:ml-56 relative flex flex-col items-center">
                <div className="relative w-full h-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
