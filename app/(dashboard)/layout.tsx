import Header from "@/components/Header";
import {auth} from "@/lib/better-auth/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import { connectToDatabase } from "@/database/mongoose";
import { UserPreferences } from "@/database/models/userPreferences.model";

const Layout = async ({ children }: { children : React.ReactNode }) => {
  const session = await auth.api.getSession({ headers: await headers() });

  if(!session?.user) redirect('/login');

  await connectToDatabase();
  const preferences = await UserPreferences.findOne({ userId: session.user.id }).lean();
  
  if (!preferences) {
    redirect('/onboarding');
  }

  const user = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
  }
  return (
    <main className="min-h-screen text-gray-400">
      <Header user={user} />
      <div className="container py-10">
        {children}
      </div>
    </main>
  )
}
export default Layout
