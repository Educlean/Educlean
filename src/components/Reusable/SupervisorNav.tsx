import home from '../../assets/icons/Home.svg';
import uploadFile from '../../assets/icons/UploadFile.svg';
import createUser from '../../assets/icons/CreateUser.svg';
import calculator from '../../assets/icons/calculator.svg';
import book from '../../assets/icons/book.svg';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';

export default function SupervisorNavBar() {
  const router = useRouter();

  // Function to check if the current path matches the link path and apply the active class
  const isActive = (path: string) => router.pathname === path;

  return (
    <div className="lg:w-[300px]">
      {/* Mobile */}
      <div className="flex justify-center lg:hidden">
        <div className="bg-[var(--secondary)] flex flex-row justify-between items-center h-12 w-56 p-4 rounded-lg">
          <Link href="/supervisor/Dashboard">
            <Image src={home} alt="Home-Icon" />
          </Link>
          <Link href="/supervisor/CreateAccount">
            <Image src={createUser} alt="create-user-Icon" />
          </Link>
          <Link href="/supervisor/School">
            <Image src={book} alt="school-Icon" />
          </Link>
          <Link href="/supervisor/UploadFile">
            <Image src={uploadFile} alt="UploadFile-Icon" />
          </Link>
        </div>
      </div>

      {/* Desktop */}
      <div className="lg:flex hidden w-full h-full">
        <div className="p-10 w-full flex flex-col gap-3">
          <Link href="/supervisor/Dashboard">
            <div
              className={`flex flex-row rounded-lg px-5 py-2 gap-3 ${isActive('/supervisor/Dashboard') ? 'bg-[var(--light-gray)]' : ''
                }`}
            >
              <Image src={home} alt="Home-Icon" />
              <p>Home</p>
            </div>
          </Link>

          <Link href="/supervisor/CreateAccount">
            <div
              className={`flex flex-row rounded-lg px-5 py-2 gap-3 ${isActive('/supervisor/CreateAccount') ? 'bg-[var(--light-gray)]' : ''
                }`}
            >
              <Image src={createUser} alt="create-user-Icon" />
              <p>Create Account</p>
            </div>
          </Link>

          <Link href="/supervisor/School">
            <div
              className={`flex flex-row rounded-lg px-5 py-2 gap-3 ${isActive('/supervisor/School') ? 'bg-[var(--light-gray)]' : ''
                }`}
            >
              <Image src={book} alt="school-Icon" />
              <p>Schools</p>
            </div>
          </Link>

          <Link href="/supervisor/UploadFile">
            <div
              className={`flex flex-row rounded-lg px-5 py-2 gap-3 ${isActive('/supervisor/UploadFile') ? 'bg-[var(--light-gray)]' : ''
                }`}
            >
              <Image src={uploadFile} alt="UploadFile-Icon" />
              <p>Schedule</p>
            </div>
          </Link>

          <Link href="/supervisor/Calculator">
            <div
              className={`flex flex-row rounded-lg px-5 py-2 gap-3 ${isActive('/supervisor/Calculator') ? 'bg-[var(--light-gray)]' : ''
                }`}
            >
              <Image src={calculator} alt="calculator-Icon" />
              <p>Calculator</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
