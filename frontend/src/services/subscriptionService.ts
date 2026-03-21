import { Subscription, PackageType } from "@/types";

export class SubscriptionService {
  private static readonly STORAGE_PREFIX = "spotyfire_subscription_";

  static getSubscription(propertyId: string): Subscription | null {
    if (typeof window === "undefined") return null;

    const key = `${this.STORAGE_PREFIX}${propertyId}`;
    const stored = localStorage.getItem(key);

    if (!stored) return null;

    try {
      const data = JSON.parse(stored);
      return {
        ...data,
        createdAt: new Date(data.createdAt),
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      };
    } catch {
      return null;
    }
  }

  static setSubscription(propertyId: string, subscription: Subscription): void {
    if (typeof window === "undefined") return;

    const key = `${this.STORAGE_PREFIX}${propertyId}`;
    localStorage.setItem(key, JSON.stringify(subscription));
  }

  static deleteSubscription(propertyId: string): void {
    if (typeof window === "undefined") return;

    const key = `${this.STORAGE_PREFIX}${propertyId}`;
    localStorage.removeItem(key);
  }

  static getAllSubscriptions(): Record<string, Subscription> {
    if (typeof window === "undefined") return {};

    const subscriptions: Record<string, Subscription> = {};

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.STORAGE_PREFIX)) {
        const propertyId = key.replace(this.STORAGE_PREFIX, "");
        const sub = this.getSubscription(propertyId);
        if (sub) subscriptions[propertyId] = sub;
      }
    }

    return subscriptions;
  }

  static decrementReports(propertyId: string): boolean {
    const subscription = this.getSubscription(propertyId);
    if (!subscription || subscription.reportsLeft <= 0) return false;

    const updated: Subscription = {
      ...subscription,
      reportsUsed: subscription.reportsUsed + 1,
      reportsLeft: subscription.reportsLeft - 1,
    };

    this.setSubscription(propertyId, updated);
    return true;
  }

  static addReports(propertyId: string, count: number): boolean {
    const subscription = this.getSubscription(propertyId);
    if (!subscription) return false;

    const updated: Subscription = {
      ...subscription,
      reportsLeft: subscription.reportsLeft + count,
    };

    this.setSubscription(propertyId, updated);
    return true;
  }

  static createSubscription(
    propertyId: string,
    package_: PackageType,
    hectares: number,
  ): Subscription {
    const reportsMap: Record<PackageType, number> = {
      Basic: 5,
      Pro: 15,
      Enterprise: 30,
      "Per Raport": 1,
    };

    const reportsIncluded = reportsMap[package_] || 5;

    const subscription: Subscription = {
      id: `${propertyId}-${Date.now()}`,
      propertyId,
      package: package_,
      reportsIncluded,
      reportsUsed: 0,
      reportsLeft: reportsIncluded,
      createdAt: new Date(),
      hectares,
    };

    this.setSubscription(propertyId, subscription);
    return subscription;
  }

  static upgradeSubscription(
    propertyId: string,
    newPackage: PackageType,
  ): Subscription | null {
    const current = this.getSubscription(propertyId);
    if (!current) return null;

    const reportsMap: Record<PackageType, number> = {
      Basic: 5,
      Pro: 15,
      Enterprise: 30,
      "Per Raport": 1,
    };

    const newReportsIncluded = reportsMap[newPackage] || 5;
    const additionalReports = newReportsIncluded - current.reportsIncluded;

    const updated: Subscription = {
      ...current,
      package: newPackage,
      reportsIncluded: newReportsIncluded,
      reportsLeft: current.reportsLeft + additionalReports,
    };

    this.setSubscription(propertyId, updated);
    return updated;
  }

  static isSubscriptionExpired(subscription: Subscription): boolean {
    if (!subscription.expiresAt) return false;
    return new Date() > subscription.expiresAt;
  }

  static hasAvailableReports(propertyId: string): boolean {
    const subscription = this.getSubscription(propertyId);
    return subscription ? subscription.reportsLeft > 0 : false;
  }

  static getUsagePercentage(propertyId: string): number {
    const subscription = this.getSubscription(propertyId);
    if (!subscription || subscription.reportsIncluded === 0) return 0;

    return (subscription.reportsUsed / subscription.reportsIncluded) * 100;
  }
}
