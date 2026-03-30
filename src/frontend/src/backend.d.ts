import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface DeliveryRecord {
    id: bigint;
    customerName: string;
    status: DeliveryStatus;
    riderId?: bigint;
    deliveryTime: Time;
    orderId: bigint;
    address: string;
    notes: string;
}
export type Time = bigint;
export interface Coupon {
    id: bigint;
    discountValue: bigint;
    expiryDate: Time;
    code: string;
    discountType: DiscountType;
    isActive: boolean;
}
export interface OrderItem {
    saladName: string;
    quantity: bigint;
    price: bigint;
}
export interface Rider {
    id: bigint;
    area: string;
    name: string;
    mobile: string;
}
export interface MenuItemIngredient {
    menuItemName: string;
    ingredientId: bigint;
    quantityPerOrder: bigint;
}
export type Result_1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: string;
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
export interface Subscription {
    status: Variant_active_expired;
    saladsRemaining: bigint;
    user: Principal;
    planType: PlanType;
    startDate: Time;
}
export interface MenuItem {
    id: bigint;
    calories: bigint;
    name: string;
    tags: Array<string>;
    enabled: boolean;
    price: bigint;
    ingredients: Array<string>;
    protein: bigint;
}
export interface UserNote {
    id: bigint;
    createdAt: Time;
    text: string;
}
export type Result = {
    __kind__: "ok";
    ok: Review;
} | {
    __kind__: "err";
    err: string;
};
export interface Lead {
    id: bigint;
    status: LeadStatus;
    date: Time;
    name: string;
    mobile: string;
}
export interface UserMeta {
    notes: Array<UserNote>;
    isVip: boolean;
}
export interface Ingredient {
    id: bigint;
    lowStockThreshold: bigint;
    quantityInStock: bigint;
    name: string;
    unit: string;
}
export type DeliveryType = {
    __kind__: "scheduled";
    scheduled: Time;
} | {
    __kind__: "instant";
    instant: null;
};
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
export interface Review {
    id: string;
    status: ReviewStatus;
    userName: string;
    date: bigint;
    comment: string;
    rating: bigint;
}
export enum DeliveryStatus {
    preparing = "preparing",
    outForDelivery = "outForDelivery",
    delivered = "delivered",
    ready = "ready"
}
export enum DiscountType {
    flat = "flat",
    percentage = "percentage"
}
export enum LeadStatus {
    new_ = "new",
    contacted = "contacted",
    converted = "converted"
}
export enum OrderStatus {
    pending = "pending",
    delivered = "delivered",
    confirmed = "confirmed"
}
export enum PlanType {
    monthly = "monthly",
    weekly = "weekly"
}
export enum ReviewStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
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
export interface backendInterface {
    addIngredient(name: string, unit: string, quantityInStock: bigint, lowStockThreshold: bigint): Promise<bigint>;
    addMenuItem(name: string, price: bigint, calories: bigint, protein: bigint, ingredients: Array<string>, tags: Array<string>): Promise<bigint>;
    addRider(name: string, mobile: string, area: string): Promise<bigint>;
    addUserNote(user: Principal, text: string): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignRider(deliveryId: bigint, riderId: bigint): Promise<void>;
    bulkAssignRider(deliveryIds: Array<bigint>, riderId: bigint): Promise<void>;
    claimFirstAdminRole(): Promise<void>;
    createCoupon(code: string, discountType: DiscountType, discountValue: bigint, expiryDate: Time): Promise<bigint>;
    createDelivery(orderId: bigint, customerName: string, address: string, deliveryTime: Time, notes: string): Promise<bigint>;
    createLead(name: string, mobile: string): Promise<bigint>;
    createReview(userName: string, rating: bigint, comment: string): Promise<Result>;
    createSubscription(planType: PlanType): Promise<void>;
    deleteCoupon(id: bigint): Promise<void>;
    deleteMenuItem(id: bigint): Promise<void>;
    deleteReview(id: string): Promise<Result_1>;
    deleteRider(id: bigint): Promise<void>;
    deleteUser(user: Principal): Promise<void>;
    deleteUserNote(user: Principal, noteId: bigint): Promise<void>;
    getAllCoupons(): Promise<Array<Coupon>>;
    getAllDeliveries(): Promise<Array<DeliveryRecord>>;
    getAllIngredients(): Promise<Array<Ingredient>>;
    getAllMenuItems(): Promise<Array<MenuItem>>;
    getAllOrders(): Promise<Array<Order>>;
    getAllReviews(): Promise<Array<Review>>;
    getAllRiders(): Promise<Array<Rider>>;
    getAllSubscriptions(): Promise<Array<Subscription>>;
    getAllUsers(): Promise<Array<{
        principal: Principal;
        profile: UserProfile;
    }>>;
    getApprovedReviews(): Promise<Array<Review>>;
    getCallerSubscription(): Promise<Subscription | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getLeads(): Promise<Array<Lead>>;
    getLowStockIngredients(): Promise<Array<Ingredient>>;
    getMenuItemIngredients(menuItemName: string): Promise<Array<MenuItemIngredient>>;
    getUserMeta(user: Principal): Promise<UserMeta>;
    getUserOrders(): Promise<Array<Order>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    hasAdminBeenClaimed(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    linkIngredientToMenuItem(menuItemName: string, ingredientId: bigint, quantityPerOrder: bigint): Promise<void>;
    placeOrder(items: Array<OrderItem>, totalAmount: bigint, deliveryType: DeliveryType): Promise<void>;
    registerUser(profile: UserProfile): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveUserProfile(profile: UserProfile): Promise<void>;
    setUserVip(user: Principal, isVip: boolean): Promise<void>;
    toggleCoupon(id: bigint, isActive: boolean): Promise<void>;
    toggleMenuItem(id: bigint, enabled: boolean): Promise<void>;
    updateDeliveryNote(id: bigint, notes: string): Promise<void>;
    updateDeliveryStatus(id: bigint, status: DeliveryStatus): Promise<void>;
    updateIngredientStock(id: bigint, newQuantity: bigint): Promise<void>;
    updateLeadStatus(id: bigint, status: LeadStatus): Promise<boolean>;
    updateMenuItem(id: bigint, name: string, price: bigint, calories: bigint, protein: bigint, ingredients: Array<string>, tags: Array<string>): Promise<void>;
    updateOrderStatus(orderId: bigint, status: OrderStatus): Promise<void>;
    updateReviewStatus(id: string, status: ReviewStatus): Promise<Result>;
    updateRider(id: bigint, name: string, mobile: string, area: string): Promise<void>;
    updateSubscriptionStatus(user: Principal, status: Variant_active_expired): Promise<void>;
    updateUserProfile(profile: UserProfile): Promise<void>;
    updateUserProfileByAdmin(user: Principal, profile: UserProfile): Promise<void>;
    validateCoupon(code: string): Promise<Coupon>;
}
