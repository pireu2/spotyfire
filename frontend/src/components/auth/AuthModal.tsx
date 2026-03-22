"use client";

import { SignUp, SignIn } from "@stackframe/stack";
import { useState, useEffect } from "react";
import { Building2, UserRound } from "lucide-react";

type AuthMode = "company" | "individual";

interface AuthModalProps {
  mode: "signup" | "signin";
  onClose: () => void;
}

export default function AuthModal({ mode, onClose }: AuthModalProps) {
  const [authMode, setAuthMode] = useState<AuthMode>("company");

  useEffect(() => {
    localStorage.setItem("spotyfire_auth_mode", authMode);
    sessionStorage.setItem("spotyfire_auth_mode_backup", authMode);
  }, [authMode]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* CSS overrides for Stack auth components */}
      <style>{`
        /* Make the Stack root children participate directly in the wrapper's flex layout */
        .auth-modal-wrapper > .stack-scope.flex.flex-col.items-stretch {
          display: contents;
        }
        /* Hide the GitHub OAuth button and its style tag (children 1 and 2 inside inner OAuth container) */
        .auth-modal-wrapper .gap-4.flex.flex-col.items-stretch.stack-scope .gap-4.flex.flex-col.items-stretch.stack-scope > :nth-child(1),
        .auth-modal-wrapper .gap-4.flex.flex-col.items-stretch.stack-scope .gap-4.flex.flex-col.items-stretch.stack-scope > :nth-child(2) {
          display: none !important;
        }
        /* Hide the original "Or continue with" separator */
        .auth-modal-wrapper .flex.items-center.justify-center.my-6.stack-scope {
          display: none !important;
        }
        
        /* --- EXPLICIT ORDERING --- */
        /* Header stays on top */
        .auth-modal-wrapper > .stack-scope > .text-center.mb-6 { order: 1; margin-bottom: 24px; }
        /* Toggle button */
        .auth-toggle-container { order: 2; margin-bottom: 20px; }
        /* Policy code input */
        .auth-policy-container { order: 3; margin-bottom: 16px; width: 100%; display: flex; flex-direction: column; }
        /* Form comes after policy code */
        .auth-modal-wrapper > .stack-scope > form { order: 4; }
        /* Extra info (terms) */
        .auth-modal-wrapper > .stack-scope > .flex.flex-col.items-center.text-center { order: 5; margin-top: 16px; }
        /* OAuth container at the bottom */
        .auth-modal-wrapper > .stack-scope > .gap-4.flex.flex-col.items-stretch.stack-scope {
          order: 6;
          margin-top: 16px;
        }
        
        /* Add "Sau continuă cu" separator above the Google button */
        .auth-modal-wrapper > .stack-scope > .gap-4.flex.flex-col.items-stretch.stack-scope::before {
          content: 'Sau continuă cu';
          display: block;
          text-align: center;
          color: #71717a;
          font-size: 0.875rem;
          margin-bottom: 12px;
        }
      `}</style>
      <div className="auth-modal-wrapper flex flex-col bg-slate-800 rounded-2xl py-6 px-10 max-w-md w-full max-h-[90vh] overflow-y-auto relative border border-slate-700 text-white [&_input]:text-black [&_button]:text-current">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-2xl z-10"
        >
          ×
        </button>

        {/* Toggle between Company and Individual */}
        <div className="auth-toggle-container">
          <div className="flex bg-slate-900/70 rounded-xl p-1 border border-slate-700/50">
            <button
              onClick={() => setAuthMode("company")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                authMode === "company"
                  ? "bg-green-600 text-white shadow-lg shadow-green-600/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Building2 className="h-5 w-5" />
              <span>Companie de Asigurare</span>
            </button>
            <button
              onClick={() => setAuthMode("individual")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                authMode === "individual"
                  ? "bg-green-600 text-white shadow-lg shadow-green-600/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <UserRound className="h-5 w-5" />
              <span>Persoana Fizică</span>
            </button>
          </div>
        </div>



        {mode === "signup" && (
          <SignUp
            firstTab="password"
            extraInfo={
              <p className="text-slate-400 text-xs text-center mt-2">
                Prin înregistrare, accepți{" "}
                <a href="/terms" className="text-green-500 hover:underline">
                  Termenii și Condițiile
                </a>
              </p>
            }
          />
        )}
        {mode === "signin" && <SignIn firstTab="password" />}
      </div>
    </div>
  );
}
