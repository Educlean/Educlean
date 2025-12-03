import Header from "../components/Reusable/Header";
import SnavBar from "../components/Reusable/SupervisorNav";
import CleanerNav from "../components/Reusable/CleanerNav";
import { ReactNode } from "react";
import { useUser } from "../context/UserContext";


type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const { user } = useUser();

  console.log(user?.role, 'USER')
  // Function to render the appropriate navigation based on user role
  const renderNavigation = () => {

     useEffect(() => {
    if (user === null) {
      router.push("/login");
    }
  }, [user, router]);
    
    if (!user) return null;

    switch (user.role?.toLowerCase()) {
      case 'supervisor':
        return <SnavBar />;
      case 'cleaner':
        return <CleanerNav />;
      default:
        return null;
    }
  };

  if (!user) return (
    <div className="bg-white min-h-screen flex items-center justify-center rounded-lg p-6 mb-6">
      <div className="text-center py-8">
        <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-[#39B52D] rounded-full animate-spin"></div>
        <p className="mt-2 text-gray-500">Loading data...</p>
      </div>
    </div>)

  return (
    <div>
      <Header />
      <div className="lg:flex lg:flex-row-reverse">
        <main className="lg:bg-[var(--light-gray)] flex-1">{children}</main>
        {user && renderNavigation()}
      </div>
    </div>
  );
}
