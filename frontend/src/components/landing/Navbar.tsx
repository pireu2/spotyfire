"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, LogIn, LogOut, UserPlus, User, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@stackframe/stack";
import AuthModal from "@/components/auth/AuthModal";
import { useState } from "react";

export default function Navbar() {
  const user = useUser();
  const [showSignUp, setShowSignUp] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await user?.signOut();
    setShowLogoutConfirm(false);
    setShowProfileMenu(false);
    window.location.reload();
  };

  return (
    <>
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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

      {showSignUp && (
        <AuthModal
          mode="signup"
          onClose={() => setShowSignUp(false)}
        />
      )}
      {showSignIn && (
        <AuthModal
          mode="signin"
          onClose={() => setShowSignIn(false)}
        />
      )}

      <nav className="fixed top-0 left-0 right-0 z-[5000] bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/spotyfire-logo-full.png"
                  alt="SpotyFire"
                  width={180}
                  height={45}
                  className="h-12 w-auto"
                />
              </Link>
              <div className="hidden md:flex items-center gap-6 mt-1">
                <Link
                  href="/despre-noi"
                  className="text-slate-300 hover:text-white transition-colors"
                >
                  Despre Noi
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-3">
                {user ? (
                  <>
                    <Link href="/dashboard">
                      <Button className="bg-green-600 hover:bg-green-700">
                        Dashboard
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <div className="relative">
                      <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="w-10 h-10 rounded-full bg-slate-300 hover:bg-white flex items-center justify-center transition-colors"
                      >
                        <User className="h-5 w-5 text-green-600" />
                      </button>
                      <div
                        className={`fixed inset-0 z-[5000] transition-opacity duration-200 ${showProfileMenu ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                        onClick={() => setShowProfileMenu(false)}
                      />
                      <div className={`absolute right-0 top-12 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-lg z-[5001] overflow-hidden transition-all duration-200 origin-top-right ${showProfileMenu ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
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
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      className="text-slate-300 hover:text-white hover:bg-slate-800"
                      onClick={() => setShowSignIn(true)}
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      Autentificare
                    </Button>
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => setShowSignUp(true)}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Înregistrare
                    </Button>
                  </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button 
                className="md:hidden text-slate-300 hover:text-white"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900 z-[5001] p-6 flex flex-col animate-in slide-in-from-right">
          <div className="flex items-center justify-between mb-8">
            <Image
              src="/spotyfire-logo-full.png"
              alt="SpotyFire"
              width={140}
              height={35}
              className="h-10 w-auto"
            />
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-8 w-8" />
            </button>
          </div>

          <div className="flex flex-col gap-6 text-lg">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-300 hover:text-white font-medium flex items-center gap-3"
            >
              Home
            </Link>
            <Link
              href="/despre-noi"
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-300 hover:text-white font-medium flex items-center gap-3"
            >
              Despre Noi
            </Link>
          </div>

          <div className="mt-auto flex flex-col gap-4">
            {user ? (
              <>
                 <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-green-600 hover:bg-green-700 py-6 text-lg">
                    Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button 
                  variant="outline"
                  className="w-full border-slate-700 py-6 text-lg text-red-400 hover:text-red-300 hover:bg-slate-800"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowLogoutConfirm(true);
                  }}
                >
                  <LogOut className="mr-2 h-5 w-5" />
                  Log Out
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="w-full border-slate-700 py-6 text-lg text-slate-300"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowSignIn(true);
                  }}
                >
                  <LogIn className="mr-2 h-5 w-5" />
                  Autentificare
                </Button>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 py-6 text-lg"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowSignUp(true);
                  }}
                >
                  <UserPlus className="mr-2 h-5 w-5" />
                  Înregistrare
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
