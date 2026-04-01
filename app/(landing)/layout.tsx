import "@/app/globals.css";

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen text-gray-400">
      {children}
    </main>
  );
}
