"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";

export interface Report {
  id: string;
  title: string;
  date: Date;
  type: "manual" | "automated";
  content: string;
  propertyId?: string;
}

export type PackageType = "Basic" | "Pro" | "Enterprise" | "Per Raport";

interface ReportsContextType {
  credits: number; // Available reports
  totalReports: number; // Total included in package
  activePackage: PackageType | null;
  reports: Report[];
  addCredits: (amount: number) => void;
  activatePackage: (pkg: PackageType, hectares: number) => void;
  requestReport: (title: string, content: string, propertyId?: string) => boolean;
  addReport: (title: string, content: string, type?: "manual" | "automated", propertyId?: string) => void;
  generateAutomatedReport: (title: string, content: string, propertyId?: string) => void;
  calculatePrice: (pkg: PackageType, hectares: number) => number;
}

const ReportsContext = createContext<ReportsContextType | undefined>(undefined);

export function ReportsProvider({ children }: { children: React.ReactNode }) {
  const [credits, setCredits] = useState<number>(0);
  const [totalReports, setTotalReports] = useState<number>(0);
  const [activePackage, setActivePackage] = useState<PackageType | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedCredits = localStorage.getItem("spotyfire_credits");
    const savedTotal = localStorage.getItem("spotyfire_total_reports");
    const savedPackage = localStorage.getItem("spotyfire_package");
    const savedReports = localStorage.getItem("spotyfire_reports");

    if (savedCredits) setCredits(parseInt(savedCredits, 10));
    if (savedTotal) setTotalReports(parseInt(savedTotal, 10));
    if (savedPackage) setActivePackage(savedPackage as PackageType);

    if (savedReports) {
      try {
        const parsed = JSON.parse(savedReports);
        const hydratedReports = parsed.map((r: any) => ({
          ...r,
          date: new Date(r.date)
        }));
        setReports(hydratedReports);
      } catch (e) {
        console.error("Failed to parse reports", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("spotyfire_credits", credits.toString());
      localStorage.setItem("spotyfire_total_reports", totalReports.toString());
      if (activePackage) localStorage.setItem("spotyfire_package", activePackage);
      localStorage.setItem("spotyfire_reports", JSON.stringify(reports));
    }
  }, [credits, totalReports, activePackage, reports, isLoaded]);

  const addCredits = useCallback((amount: number) => {
    setCredits((prev) => prev + amount);
  }, []);

  const activatePackage = useCallback((pkg: PackageType, hectares: number) => {
    let reportCount = 0;
    switch (pkg) {
      case "Basic": reportCount = 5; break;
      case "Pro": reportCount = 15; break;
      case "Enterprise": reportCount = 30; break;
      case "Per Raport": reportCount = 1; break; // Assumed 1 for single report purchase
    }

    // specific logic for Per Raport: it might just add credits if intended as an add-on,
    // but for now sticking to the interface which sets active package.
    // If user wants it as add-on, we might need different logic, but following the 'popup as Alege Basic' instruction:
    setActivePackage(pkg);
    setTotalReports(reportCount);
    // If it's Per Raport, maybe we shouldn't reset credits if we want to keep previous? 
    // But sticking to simple replacement for now as per current function contract.
    setCredits(reportCount);
  }, []);

  const calculatePrice = useCallback((pkg: PackageType, hectares: number): number => {
    let basePrice = 0;
    switch (pkg) {
      case "Basic": basePrice = 29; break;
      case "Pro": basePrice = 99; break;
      case "Enterprise": basePrice = 299; break;
      case "Per Raport": return 20; // Fixed price for Per Raport
    }

    if (hectares <= 20) {
      return basePrice;
    }

    // Formula: Preț_final = Preț_pachet + k * (Hectare_peste)^α
    // k = 0.857, α = 0.833
    const extraHectares = hectares - 20;
    const k = 0.857;
    const alpha = 0.833;
    const extraCost = k * Math.pow(extraHectares, alpha);

    return parseFloat((basePrice + extraCost).toFixed(2));
  }, []);

  const requestReport = useCallback((title: string, content: string, propertyId?: string): boolean => {
    if (credits <= 0) return false;

    const newReport: Report = {
      id: crypto.randomUUID(),
      title,
      date: new Date(),
      type: "manual",
      content,
      propertyId,
    };

    setCredits((prev) => prev - 1);
    setReports((prev) => [newReport, ...prev]);
    return true;
  }, [credits]);

  const generateAutomatedReport = useCallback((title: string, content: string, propertyId?: string) => {
    const newReport: Report = {
      id: crypto.randomUUID(),
      title,
      date: new Date(),
      type: "automated",
      content,
      propertyId,
    };

    if (credits > 0) {
      setCredits((prev) => prev - 1);
    }

    setReports((prev) => [newReport, ...prev]);
  }, [credits]);

  const addReport = useCallback((title: string, content: string, type: "manual" | "automated" = "manual", propertyId?: string) => {
    const newReport: Report = {
      id: crypto.randomUUID(),
      title,
      date: new Date(),
      type,
      content,
      propertyId,
    };
    setReports((prev) => [newReport, ...prev]);
  }, []);

  const contextValue = useMemo(
    () => ({
      credits,
      totalReports,
      activePackage,
      reports,
      addCredits,
      activatePackage,
      requestReport,
      addReport,
      generateAutomatedReport,
      calculatePrice,
    }),
    [credits, totalReports, activePackage, reports, addCredits, activatePackage, requestReport, addReport, generateAutomatedReport, calculatePrice]
  );

  return (
    <ReportsContext.Provider value={contextValue}>
      {children}
    </ReportsContext.Provider>
  );
}

export function useReports() {
  const context = useContext(ReportsContext);
  if (context === undefined) {
    throw new Error("useReports must be used within a ReportsProvider");
  }
  return context;
}
