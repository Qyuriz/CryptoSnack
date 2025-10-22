export const metadata = { title: "Oroqor — Creator Studio", description: "Thread composer & planner" };

import "./globals.css";
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-gradient-to-br from-indigo-50 to-sky-50 text-neutral-900">
        {children}
      </body>
    </html>
  );
}
