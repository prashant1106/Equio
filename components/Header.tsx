import Link from "next/link";
import Image from "next/image";
import NavItems from "@/components/NavItems";
import UserDropdown from "@/components/UserDropdown";
import { searchStocks } from "@/lib/actions/finnhub.actions";

const Header = async ({ user }: { user: User }) => {
  const initialStocks = await searchStocks();
  return (
    <header className="sticky top-0 header flex items-center h-16">
      <div className="container header-wrapper flex items-center justify-between">
        
        <Link href="/" className="flex items-center">
          <Image
            src="/assets/icons/logo.svg"
            alt="Equio logo"
            width={160}
            height={48}
            priority
            className="h-12 sm:h-14 w-auto cursor-pointer -mt-8"
          />
        </Link>

        <nav className="hidden sm:block">
          <NavItems initialStocks={initialStocks}/>
        </nav>

        <UserDropdown user={user} initialStocks={initialStocks}/>
      </div>
    </header>
  );
};

export default Header