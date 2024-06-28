import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThirdwebProvider } from "thirdweb/react";
import {Header} from '../components/Header'; // Adjust the path as needed

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Public Goods Club",
  description: "IYKYK",
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
          <Header />
          {children}
        </ThirdwebProvider>
      </body>
    </html>
  );
}
