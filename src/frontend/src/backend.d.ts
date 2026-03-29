import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Subscription {
    status: Variant_active_expired;
    saladsRemaining: bigint;
    user: Principal;
    planType: Variant_monthly_weekly;
    startDate: Time;
}
export type Time = bigint;
export interface Ingredient {
    id: bigint;
    lowStockThreshold: bigint;
    quantityInStock: bigint;
    name: string;
    unit: string;
}
export interface OrderItem {
    saladName: string;
    quantity: bigint;
    price: bigint;
}
export interface MenuItemIngredient {
    menuItemName: string;
    ingredientId: bigint;
    quantityPerOrder: bigint;
}
export type DeliveryType = {
    __kind__: "scheduled";
    scheduled: Time;
} | {
    __kind__: "instant";
    instant: null;
};
export interface Order {
    id: bigint;
    status: OrderStatus;
    createdAt: Time;
    user: Principal;
    deliveryType: {
        __kind__: "scheduled";
        scheduled: Time;
    } | {
        __kind__: "instant";
        instant: null;
    };
    totalAmount: bigint;
    items: Array<OrderItem>;
}
export interface UserProfile {
    age: bigint;
    heightCm: bigint;
    dietaryPreferences: Array<string>;
    name: string;
    email: string;
    weightKg: bigint;
    dietaryRestrictions: Array<string>;
    address: string;
    mobile: string;
}
export enum OrderStatus {
    pending = "pending",
    delivered = "delivered",
    confirmed = "confirmed"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_active_expired {
    active = "active",
    expired = "expired"
}
export enum Variant_monthly_weekly {
    monthly = "monthly",
    weekly = "weekly"
}
export type PlanType = Variant_monthly_weekly;

export type DiscountType = { __kind__: "percentage"; percentage: null } | { __kind__: "flat"; flat: null };
export interface Coupon {
    id: bigint;
    code: string;
    discountType: DiscountType;
    discountValue: bigint;
    expiryDate: bigint;
    isActive: boolean;
}
export interface backendInterface {
    addIngredient(name: string, unit: string, quantityInStock: bigint, lowStockThreshold: bigint): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    claimFirstAdminRole(): Promise<void>;
    createSubscription(planType: PlanType): Promise<void>;
    getAllIngredients(): Promise<Array<Ingredient>>;
    getAllOrders(): Promise<Array<Order>>;
    getAllSubscriptions(): Promise<Array<Subscription>>;
    getAllUsers(): Promise<Array<{
        principal: Principal;
        profile: UserProfile;
    }>>;
    getCallerSubscription(): Promise<Subscription | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getLowStockIngredients(): Promise<Array<Ingredient>>;
    getMenuItemIngredients(menuItemName: string): Promise<Array<MenuItemIngredient>>;
    getUserOrders(): Promise<Array<Order>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    hasAdminBeenClaimed(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    linkIngredientToMenuItem(menuItemName: string, ingredientId: bigint, quantityPerOrder: bigint): Promise<void>;
    placeOrder(items: Array<OrderItem>, totalAmount: bigint, deliveryType: DeliveryType): Promise<void>;
    registerUser(profile: UserProfile): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateIngredientStock(id: bigint, newQuantity: bigint): Promise<void>;
    updateOrderStatus(orderId: bigint, status: OrderStatus): Promise<void>;
    updateSubscriptionStatus(user: Principal, status: Variant_active_expired): Promise<void>;
    updateUserProfile(profile: UserProfile): Promise<void>;
    createCoupon(code: string, discountType: DiscountType, discountValue: bigint, expiryDate: bigint): Promise<bigint>;
    getAllCoupons(): Promise<Array<Coupon>>;
    deleteCoupon(id: bigint): Promise<void>;
    toggleCoupon(id: bigint, isActive: boolean): Promise<void>;
    validateCoupon(code: string): Promise<Coupon>;
}
