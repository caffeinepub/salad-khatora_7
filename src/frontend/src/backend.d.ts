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

export interface MenuItem {
    id: bigint;
    name: string;
    price: bigint;
    calories: bigint;
    protein: bigint;
    ingredients: Array<string>;
    tags: Array<string>;
    enabled: boolean;
}

export enum DeliveryStatus {
    preparing = "preparing",
    ready = "ready",
    outForDelivery = "outForDelivery",
    delivered = "delivered"
}
export interface Rider {
    id: bigint;
    name: string;
    mobile: string;
    area: string;
}
export interface DeliveryRecord {
    id: bigint;
    orderId: bigint;
    customerName: string;
    address: string;
    deliveryTime: bigint;
    status: DeliveryStatus;
    riderId: bigint | null;
    notes: string;
}

export type LeadStatus = "new_" | "contacted" | "converted";
export interface Lead {
    id: bigint;
    name: string;
    mobile: string;
    date: bigint;
    status: LeadStatus;
}

export interface backendInterface {
    _initializeAccessControlWithSecret(userSecret: string): Promise<void>;
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
    saveUserProfile(profile: UserProfile): Promise<void>;
    updateIngredientStock(id: bigint, newQuantity: bigint): Promise<void>;
    updateOrderStatus(orderId: bigint, status: OrderStatus): Promise<void>;
    updateSubscriptionStatus(user: Principal, status: Variant_active_expired): Promise<void>;
    updateUserProfile(profile: UserProfile): Promise<void>;
    getAllMenuItems(): Promise<Array<MenuItem>>;
    addMenuItem(name: string, price: bigint, calories: bigint, protein: bigint, ingredients: Array<string>, tags: Array<string>): Promise<bigint>;
    updateMenuItem(id: bigint, name: string, price: bigint, calories: bigint, protein: bigint, ingredients: Array<string>, tags: Array<string>): Promise<void>;
    deleteMenuItem(id: bigint): Promise<void>;
    toggleMenuItem(id: bigint, enabled: boolean): Promise<void>;
    addRider(name: string, mobile: string, area: string): Promise<bigint>;
    updateRider(id: bigint, name: string, mobile: string, area: string): Promise<void>;
    deleteRider(id: bigint): Promise<void>;
    getAllRiders(): Promise<Array<Rider>>;
    createDelivery(orderId: bigint, customerName: string, address: string, deliveryTime: bigint, notes: string): Promise<bigint>;
    updateDeliveryStatus(id: bigint, status: DeliveryStatus): Promise<void>;
    assignRider(deliveryId: bigint, riderId: bigint): Promise<void>;
    bulkAssignRider(deliveryIds: Array<bigint>, riderId: bigint): Promise<void>;
    updateDeliveryNote(id: bigint, notes: string): Promise<void>;
    getAllDeliveries(): Promise<Array<DeliveryRecord>>;
    setUserVip(user: Principal, isVip: boolean): Promise<void>;
    addUserNote(user: Principal, text: string): Promise<bigint>;
    deleteUserNote(user: Principal, noteId: bigint): Promise<void>;
    getUserMeta(user: Principal): Promise<{ isVip: boolean; notes: Array<{ id: bigint; text: string; createdAt: bigint }> }>;
    deleteUser(user: Principal): Promise<void>;
    updateUserProfileByAdmin(user: Principal, profile: UserProfile): Promise<void>;
    createCoupon(code: string, discountType: DiscountType, discountValue: bigint, expiryDate: bigint): Promise<bigint>;
    getAllCoupons(): Promise<Array<Coupon>>;
    deleteCoupon(id: bigint): Promise<void>;
    toggleCoupon(id: bigint, isActive: boolean): Promise<void>;
    validateCoupon(code: string): Promise<Coupon>;
    createLead(name: string, mobile: string): Promise<bigint>;
    getLeads(): Promise<Array<Lead>>;
    updateLeadStatus(id: bigint, status: LeadStatus): Promise<boolean>;
}
