import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThirdwebProvider } from "thirdweb/react";
import {Header} from '../components/Header'; // Adjust the path as needed
import { ThemeProvider } from "next-themes";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Public Goods Club",
  description: "PGC Members",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThirdwebProvider>
          <ThemeProvider attribute="class">
          <Header />
         <main className="flex-grow"> {children}</main>
         </ThemeProvider>
        </ThirdwebProvider>
      </body>
    </html>
  );
}
