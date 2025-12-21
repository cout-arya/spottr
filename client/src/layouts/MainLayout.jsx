import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const MainLayout = () => {
    return (
        <div className="min-h-screen bg-dark text-white flex">
            <Sidebar />
            <main className="flex-1 ml-64 relative">
                {/* Background ambient glow */}
                <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
                    <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]"></div>
                    <div className="absolute top-[40%] right-[0%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[100px]"></div>
                </div>

                <div className="relative z-10 w-full h-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
