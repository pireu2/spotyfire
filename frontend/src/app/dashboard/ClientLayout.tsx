"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Shield,
  Map,
  Bell,
  FileText,
  Satellite,
  Wifi,
  LogOut,
  MapPin,
  Home,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { useUser } from "@stackframe/stack";
import { useState, useEffect } from "react";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";

import { CreditCard } from "lucide-react";

export default function ClientLayout({
  children,
  role
}: {
  children: React.ReactNode;
  role: "company" | "individual" | null;
}) {
  const user = useUser();
  const pathname = usePathname();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      const pendingMode = localStorage.getItem("spotyfire_auth_mode");
      const currentRole = (user as any).clientMetadata?.role;
      
      // If there's a pending mode in localStorage, apply it
      if (pendingMode) {
        localStorage.removeItem("spotyfire_auth_mode");
        fetch("/api/auth/role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: pendingMode })
        })
        .then(() => {
          window.location.reload();
        })
        .catch((err) => console.error("Failed to apply role:", err));
      } 
      // If user has no role at all, it means signup flow failed to set it
      // Check if there's a backup in sessionStorage
      else if (!currentRole) {
        const backupMode = sessionStorage.getItem("spotyfire_auth_mode_backup");
        if (backupMode) {
          sessionStorage.removeItem("spotyfire_auth_mode_backup");
          fetch("/api/auth/role", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mode: backupMode })
          })
          .then(() => {
            window.location.reload();
          })
          .catch((err) => console.error("Failed to apply backup role:", err));
        }
      }
    }
  }, [user]);

  const handleLogout = async () => {
    await user?.signOut();
    setShowLogoutConfirm(false);
    window.location.href = "/";
  };

  return (
    <div className="h-screen bg-slate-900 flex relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-green-900/40 via-slate-900 to-slate-950" />
      <div className="absolute inset-0 bg-green-glow" />
      <div className="absolute inset-0 bg-grid-pattern" />
      <div className="absolute inset-0 bg-noise pointer-events-none" />

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full border border-slate-700">
            <h3 className="text-xl font-semibold text-white mb-4 text-center">
              Confirmare Deconectare
            </h3>
            <p className="text-slate-400 text-center mb-6">
              Ești sigur că vrei să te deconectezi?
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Nu
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={handleLogout}
              >
                Da, Deconectează-mă
              </Button>
            </div>
          </div>
        </div>
      )}

      <aside
        className={`
        fixed md:relative inset-y-0 left-0 z-50 w-64 bg-slate-900/95 backdrop-blur border-r border-slate-700 
        flex flex-col transition-transform duration-300 ease-in-out
        ${
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        }
      `}
      >
        <div className="h-20 h-20 border-b border-slate-700 flex items-center justify-center relative">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/spotyfire-logo-full.png"
              alt="SpotyFire"
              width={0}
              height={0}
              sizes="100vw"
              className="h-12 w-auto"
            />
          </Link>
          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute right-4 top-1/2 -translate-y-1/2 md:hidden text-slate-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            <li>
              <Link
                href="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  pathname === "/dashboard"
                    ? "bg-green-600/20 text-green-500 font-medium"
                    : "text-slate-400 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <Map className="h-5 w-5" />
                Hartă Live
              </Link>
            </li>
            
            {role !== "individual" && (
              <li>
                <Link
                  href="/dashboard/terenuri"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    pathname === "/dashboard/terenuri"
                      ? "bg-green-600/20 text-green-500 font-medium"
                      : "text-slate-400 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  <MapPin className="h-5 w-5" />
                  Terenuri
                </Link>
              </li>
            )}

            <li>
                <Link
                  href="/dashboard/alerte"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    pathname === "/dashboard/alerte"
                      ? "bg-green-600/20 text-green-500 font-medium"
                      : "text-slate-400 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  <Bell className="h-5 w-5" />
                  Alerte
                </Link>
              </li>
            
            {role !== "individual" && (
              <li>
                <Link
                  href="/dashboard/asigurati"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    pathname === "/dashboard/asigurati"
                      ? "bg-green-600/20 text-green-500 font-medium"
                      : "text-slate-400 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  <User className="h-5 w-5" />
                  Asigurați
                </Link>
              </li>
            )}

            <li>
              <Link
                href="/dashboard/rapoarte"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  pathname === "/dashboard/rapoarte"
                    ? "bg-green-600/20 text-green-500 font-medium"
                    : "text-slate-400 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <FileText className="h-5 w-5" />
                Rapoarte
              </Link>
            </li>
            

          </ul>
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Satellite className="h-4 w-4 text-green-500" />
              <span className="text-sm text-slate-300">Status Conectare</span>
            </div>
            <div className="flex items-center gap-2 h-7">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs text-green-400">
                Uplink Satelit Activ
              </span>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative z-10 w-full">
        <header className="h-20 bg-slate-900/95 backdrop-blur border-b border-slate-700 flex items-center justify-between px-6 relative z-[100]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-white">
                Dashboard Monitorizare
              </h1>
              <p className="text-xs text-slate-400">
                Ultima actualizare: acum 2 minute
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-10 h-10 rounded-full bg-slate-300 hover:bg-white flex items-center justify-center transition-colors"
                >
                  <User className="h-5 w-5 text-green-600" />
                </button>
                <div
                  className={`fixed inset-0 z-[5000] transition-opacity duration-200 ${
                    showProfileMenu
                      ? "opacity-100"
                      : "opacity-0 pointer-events-none"
                  }`}
                  onClick={() => setShowProfileMenu(false)}
                />
                <div
                  className={`absolute right-0 top-12 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-lg z-[5001] overflow-hidden transition-all duration-200 origin-top-right ${
                    showProfileMenu
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-95 pointer-events-none"
                  }`}
                >
                  <div className="p-4 border-b border-slate-700">
                    <p className="text-white font-medium">
                      Bună, {user.displayName || "Utilizator"}
                    </p>
                    <p className="text-slate-400 text-sm truncate">
                      {user.primaryEmail}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setShowLogoutConfirm(true);
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 text-slate-300 hover:bg-red-600/20 hover:text-white transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-auto relative z-0">{children}</div>
      </main>
    </div>
  );
}
