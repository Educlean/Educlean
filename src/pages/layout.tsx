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

  return (
    <div>
      <Header />
      <div className="lg:flex lg:flex-row-reverse">
        <main className="lg:bg-[var(--light-gray)] flex-1">{children}</main>
        {user && renderNavigation() }
      
      </div>
    </div>
  );
}
