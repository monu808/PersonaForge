import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./navbar";
import { Footer } from "./footer";

interface LayoutProps {
  publicOnly?: boolean;
}

export function Layout({ publicOnly = false }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar publicOnly={publicOnly} />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}