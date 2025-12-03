import type { Metadata } from "next";

import "./globals.css"; 

import { Inter } from "next/font/google"; 
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nexus RAG",
  description: "Sistema de Inteligencia Artificial",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    
    <html lang="es" className="dark">
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        {children}
      </body>
    </html>
  );
}