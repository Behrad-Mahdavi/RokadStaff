"use client";

import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Load saved sidebar preference
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("rokad_sidebar_open");
      if (saved !== null) {
        setIsSidebarOpen(saved === "true");
      }
    } catch {}
  }, []);

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("rokad_sidebar_open", String(next));
      } catch {}
      return next;
    });
  };

  return (
    <div className="min-h-screen flex bg-[#F8F9FA] dark:bg-[#0B0F17] text-ink-normal dark:text-gray-100 relative transition-colors duration-200">
      {/* Desktop Sidebar (hidden on mobile, collapsible with smooth transition on desktop) */}
      <div
        className={`hidden lg:block shrink-0 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "w-72" : "w-0 overflow-hidden"
        }`}
      >
        <div
          className={`fixed inset-y-0 right-0 w-72 h-screen z-30 transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <Sidebar />
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer (visible when toggled on <lg) */}
      <div
        className={`fixed inset-y-0 right-0 z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <Sidebar onCloseMobile={() => setIsMobileMenuOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden transition-all duration-300">
        <Navbar
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onToggleSidebar={handleToggleSidebar}
          isSidebarOpen={isSidebarOpen}
        />
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
