"use client";

import Link from "next/link";
import {
  Shield,
  Satellite,
  FileCheck,
  ArrowRight,
  Flame,
  Droplets,
  Leaf,
  Mail,
  Bell,
  Users,
  Target,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@stackframe/stack";
import AuthModal from "@/components/auth/AuthModal";
import { useState, useEffect, useRef } from "react";
import Navbar from "./Navbar";
import { API_URL } from "@/lib/api";

function useCountUp(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [hasStarted, end, duration]);

  return { count, ref };
}

export default function HeroSection() {
  const user = useUser();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);
  const [showSignUp, setShowSignUp] = useState(false);

  const fires = useCountUp(16000, 2000);
  const floods = useCountUp(50, 2000);
  const ndvi = useCountUp(10000, 2000);

  useEffect(() => {
    const checkBackendStatus = async () => {
      const apiUrl = API_URL + "/health";

      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });
        const data = await response.json();
        setIsBackendOnline(data.status === 'healthy');
      } catch {
        setIsBackendOnline(false);
      }
    };

    checkBackendStatus();
    const interval = setInterval(checkBackendStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-900 overflow-hidden">
      <div className="absolute inset-0 bg-slate-950" />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle 1400px at 50% -20%, rgba(34, 197, 94, 0.25) 0%, transparent 70%)' }} />
      <div className="absolute inset-0 bg-grid-pattern" />
      <div className="absolute inset-0 bg-noise pointer-events-none" />

      <Navbar />

      <div className="relative z-10 container mx-auto px-6 pt-28 pb-10 text-center">


        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight pt-16">
          Protejăm Terenul Tău
          <span className="block text-green-500">Din Satelit</span>
        </h1>

        <div className={`inline-flex items-center gap-2 ${isBackendOnline === false ? 'bg-red-600/20 border-red-600/30' : 'bg-green-600/20 border-green-600/30'} border rounded-full px-4 py-2 mb-8`}>
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isBackendOnline === false ? 'bg-red-400' : 'bg-green-400'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isBackendOnline === false ? 'bg-red-500' : 'bg-green-500'}`}></span>
          </span>
          <span className={`${isBackendOnline === false ? 'text-red-400' : 'text-green-400'} text-sm font-medium`}>
            {isBackendOnline === null ? 'Verificare conexiune...' : isBackendOnline ? 'Conexiune Satelit Activă' : 'Conexiune Satelit Lipsă'}
          </span>
        </div>

        <p className="text-xl text-slate-400 mb-10 max-w-3xl mx-auto">
          Detectează incendii și inundații în timp real folosind imagini
          satelitare. Analizează sănătatea vegetației și automatizează
          cererile de despăgubire cu ajutorul AI-ului.
        </p>


        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-15">
          {user ? (
            <Link href="/dashboard">
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-lg px-8 py-6"
              >
                Lansează Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <Button
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-lg px-8 py-6"
              onClick={() => setShowSignUp(true)}
            >
              Începe Acum - Gratuit
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          )}
          <Link href="/despre-noi">
            <Button
              variant="outline"
              size="lg"
              className="bg-slate-300 text-green-600 hover:bg-white hover:text-green-600 border-slate-400 text-lg px-8 py-6"
            >
              Află Mai Multe
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-10">
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 hover:border-green-600/50 transition-colors text-left">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-orange-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Flame className="h-7 w-7 text-orange-500" />
              </div>
              <div className="flex flex-col">
                <span ref={fires.ref} className="text-orange-400 text-3xl font-bold">{fires.count}+</span>
                <span className="text-orange-400/70 text-sm">incendii detectate în ultimele 12 luni</span>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">
              Detectare Incendii
            </h3>
            <p className="text-slate-400">
              Monitorizare în timp real a incendiilor de vegetație folosind
              date termice satelitare.
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 hover:border-green-600/50 transition-colors text-left">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-blue-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Droplets className="h-7 w-7 text-blue-500" />
              </div>
              <div className="flex flex-col">
                <span ref={floods.ref} className="text-blue-400 text-3xl font-bold">{floods.count}+</span>
                <span className="text-blue-400/70 text-sm">inundații detectate în ultimele 12 luni</span>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">
              Alertă Inundații
            </h3>
            <p className="text-slate-400">
              Predicție și avertizare timpurie pentru zonele cu risc de
              inundații.
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 hover:border-green-600/50 transition-colors text-left">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-green-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Leaf className="h-7 w-7 text-green-500" />
              </div>
              <div className="flex flex-col">
                <span ref={ndvi.ref} className="text-green-400 text-3xl font-bold">{ndvi.count}+</span>
                <span className="text-green-400/70 text-sm">terenuri cu indice NDVI modificat în ultimele 12 luni</span>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">
              Sănătate Vegetație
            </h3>
            <p className="text-slate-400">
              Analiză NDVI pentru monitorizarea stării culturilor și predicții
              de recoltă.
            </p>
          </div>
        </div>


      </div>

      {showSignUp && (
        <AuthModal
          mode="signup"
          onClose={() => setShowSignUp(false)}
        />
      )}
    </div>

  );
}
