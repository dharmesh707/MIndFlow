import localFont from "next/font/local";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { ClerkProvider } from "@clerk/nextjs";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "MindFlow Frontend",
  description: "MindFlow Dashboard UI",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gray-50 text-gray-900 flex`}
        >
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden relative max-h-screen overflow-y-auto">
          {children}
        </div>
      </body>
    </html>
    </ClerkProvider>
  );
}
