import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import List "mo:core/List";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";

// Mixins must be imported directly from their file path
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";



actor {
  // Initialize the user system state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Track whether the one-time first-admin claim has been used
  var firstAdminClaimed = false;

  public type UserProfile = {
    name : Text;
    mobile : Text;
    email : Text;
    address : Text;
    heightCm : Nat;
    weightKg : Nat;
    age : Nat;
    dietaryPreferences : [Text];
    dietaryRestrictions : [Text];
  };

  public type OrderItem = {
    saladName : Text;
    quantity : Nat;
    price : Nat;
  };

  public type OrderStatus = {
    #pending;
    #confirmed;
    #delivered;
  };

  public type Order = {
    id : Nat;
    user : Principal;
    items : [OrderItem];
    totalAmount : Nat;
    deliveryType : {
      #instant;
      #scheduled : Time.Time;
    };
    status : OrderStatus;
    createdAt : Time.Time;
  };

  public type Subscription = {
    user : Principal;
    planType : {
      #weekly;
      #monthly;
    };
    startDate : Time.Time;
    status : {
      #active;
      #expired;
    };
    saladsRemaining : Nat;
  };

  public type Ingredient = {
    id : Nat;
    name : Text;
    unit : Text;
    quantityInStock : Nat;
    lowStockThreshold : Nat;
  };

  public type MenuItemIngredient = {
    menuItemName : Text;
    ingredientId : Nat;
    quantityPerOrder : Nat;
  };

  public type LeadStatus = {
    #new_;
    #contacted;
    #converted;
  };

  public type Lead = {
    id : Nat;
    name : Text;
    mobile : Text;
    date : Time.Time;
    status : LeadStatus;
  };

  // V1 type kept for stable variable compatibility (migration)
  type MenuItemV1 = {
    id : Nat;
    name : Text;
    price : Nat;
    calories : Nat;
    protein : Nat;
    ingredients : [Text];
    enabled : Bool;
  };

  // Current MenuItem type (with tags)
  public type MenuItem = {
    id : Nat;
    name : Text;
    price : Nat;
    calories : Nat;
    protein : Nat;
    ingredients : [Text];
    tags : [Text];
    enabled : Bool;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let orders = Map.empty<Nat, Order>();
  let subscriptions = Map.empty<Principal, Subscription>();
  let ingredients = Map.empty<Nat, Ingredient>();
  let menuItemIngredients = List.empty<MenuItemIngredient>();

  // Legacy stable map (old type, no tags) — kept for migration from previous deployment
  let menuItems = Map.empty<Nat, MenuItemV1>();
  // Current stable map (new type, with tags)
  let menuItemsV2 = Map.empty<Nat, MenuItem>();

  var nextOrderId = 0;
  var nextIngredientId = 0;
  var nextMenuItemId = 0;
  let leads = Map.empty<Nat, Lead>();
  var nextLeadId = 0;

  // Migration flag: ensures we only migrate once
  var menuItemsMigrated = false;

  // Migrate data from legacy menuItems (V1, no tags) into menuItemsV2 (with tags)
  system func postupgrade() {
    if (not menuItemsMigrated) {
      for ((k, v) in menuItems.toArray().values()) {
        menuItemsV2.add(k, {
          id = v.id;
          name = v.name;
          price = v.price;
          calories = v.calories;
          protein = v.protein;
          ingredients = v.ingredients;
          tags = [];
          enabled = v.enabled;
        });
      };
      menuItemsMigrated := true;
    };
  };

  public type DeliveryType = {
    #instant;
    #scheduled : Time.Time;
  };

  public type PlanType = {
    #weekly;
    #monthly;
  };

  // ── First-Admin Claim ─────────────────────────────────────────────────────────────────────────────────
  // Returns true if an admin has already been claimed (no more claims allowed)
  public query func hasAdminBeenClaimed() : async Bool {
    firstAdminClaimed;
  };

  // One-time function: the first authenticated user to call this becomes admin.
  // After that, it is permanently locked.
  public shared ({ caller }) func claimFirstAdminRole() : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Must be authenticated to claim admin");
    };
    if (firstAdminClaimed) {
      Runtime.trap("Admin has already been claimed");
    };
    // Grant admin role directly
    accessControlState.userRoles.add(caller, #admin);
    accessControlState.adminAssigned := true;
    firstAdminClaimed := true;
  };
  // ─────────────────────────────────────────────────────────────────────────

  // Place an order (user must be authenticated)
  public shared ({ caller }) func placeOrder(items : [OrderItem], totalAmount : Nat, deliveryType : DeliveryType) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can place orders");
    };
    let id = nextOrderId;
    nextOrderId += 1;

    let newOrder : Order = {
      id;
      user = caller;
      items;
      totalAmount;
      deliveryType;
      status = #pending;
      createdAt = Time.now();
    };

    // Deduct ingredients from inventory
    for (item in items.values()) {
      for (link in menuItemIngredients.values()) {
        if (link.menuItemName == item.saladName) {
          switch (ingredients.get(link.ingredientId)) {
            case (?ingredient) {
              let totalNeeded = item.quantity * link.quantityPerOrder;
              let newQuantity = if (ingredient.quantityInStock > totalNeeded) {
                Nat.sub(ingredient.quantityInStock, totalNeeded) } else { 0
              };
              let updatedIngredient : Ingredient = {
                id = ingredient.id;
                name = ingredient.name;
                unit = ingredient.unit;
                quantityInStock = newQuantity;
                lowStockThreshold = ingredient.lowStockThreshold;
              };
              ingredients.add(link.ingredientId, updatedIngredient);
            };
            case (null) {};
          };
        };
      };
    };

    orders.add(id, newOrder);
  };

  // Get all orders for the caller
  public query ({ caller }) func getUserOrders() : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view orders");
    };
    orders.values().toArray().filter(func(order : Order) : Bool { order.user == caller });
  };

  // Create a subscription for the caller
  public shared ({ caller }) func createSubscription(planType : PlanType) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create subscriptions");
    };
    let newSubscription : Subscription = {
      user = caller;
      planType;
      startDate = Time.now();
      status = #active;
      saladsRemaining = switch (planType) {
        case (#weekly) { 7 };
        case (#monthly) { 30 };
      };
    };

    subscriptions.add(caller, newSubscription);
  };

  // Get the caller's subscription
  public query ({ caller }) func getCallerSubscription() : async ?Subscription {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view subscriptions");
    };
    subscriptions.get(caller);
  };

  // Register a new user or update profile
  public shared ({ caller }) func registerUser(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can register");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // saveUserProfile: upsert profile for the caller.
  // Auto-registers the user with #user role if not yet registered.
  public shared ({ caller }) func saveUserProfile(profile : UserProfile) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Must be authenticated to save profile");
    };
    // Auto-register with user role if caller has no role yet
    switch (accessControlState.userRoles.get(caller)) {
      case (null) {
        accessControlState.userRoles.add(caller, #user);
      };
      case (?_) {};
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (caller.isAnonymous()) {
      return null;
    };
    userProfiles.get(caller);
  };

  public shared ({ caller }) func updateUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update their profile");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // Ingredient management
  public shared ({ caller }) func addIngredient(name : Text, unit : Text, quantityInStock : Nat, lowStockThreshold : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add ingredients");
    };
    let id = nextIngredientId;
    nextIngredientId += 1;

    let ingredient : Ingredient = {
      id;
      name;
      unit;
      quantityInStock;
      lowStockThreshold;
    };

    ingredients.add(id, ingredient);
    id;
  };

  public shared ({ caller }) func updateIngredientStock(id : Nat, newQuantity : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update ingredient stock");
    };
    switch (ingredients.get(id)) {
      case (?ingredient) {
        let updatedIngredient : Ingredient = {
          id = ingredient.id;
          name = ingredient.name;
          unit = ingredient.unit;
          quantityInStock = newQuantity;
          lowStockThreshold = ingredient.lowStockThreshold;
        };
        ingredients.add(id, updatedIngredient);
      };
      case (null) {
        Runtime.trap("Ingredient not found");
      };
    };
  };

  public shared ({ caller }) func linkIngredientToMenuItem(menuItemName : Text, ingredientId : Nat, quantityPerOrder : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can link ingredients to menu items");
    };
    let link : MenuItemIngredient = {
      menuItemName;
      ingredientId;
      quantityPerOrder;
    };
    menuItemIngredients.add(link);
  };

  public query ({ caller }) func getAllIngredients() : async [Ingredient] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view ingredients");
    };
    ingredients.values().toArray();
  };

  public query ({ caller }) func getLowStockIngredients() : async [Ingredient] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view low stock ingredients");
    };
    ingredients.values().toArray().filter(
      func(ingredient) {
        ingredient.quantityInStock <= ingredient.lowStockThreshold;
      }
    );
  };

  public query ({ caller }) func getMenuItemIngredients(menuItemName : Text) : async [MenuItemIngredient] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view menu item ingredients");
    };
    menuItemIngredients.toArray().filter(
      func(link) { link.menuItemName == menuItemName }
    );
  };

  // Admin queries
  public query ({ caller }) func getAllOrders() : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all orders");
    };
    orders.values().toArray();
  };

  public query ({ caller }) func getAllUsers() : async [{ principal : Principal; profile : UserProfile }] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all users");
    };
    userProfiles.toArray().map(
      func((principal, profile)) {
        { principal; profile };
      }
    );
  };

  public query ({ caller }) func getAllSubscriptions() : async [Subscription] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all subscriptions");
    };
    subscriptions.values().toArray();
  };

  public shared ({ caller }) func updateOrderStatus(orderId : Nat, status : OrderStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update order status");
    };
    switch (orders.get(orderId)) {
      case (?order) {
        let updatedOrder : Order = {
          id = order.id;
          user = order.user;
          items = order.items;
          totalAmount = order.totalAmount;
          deliveryType = order.deliveryType;
          status;
          createdAt = order.createdAt;
        };
        orders.add(orderId, updatedOrder);
      };
      case (null) {
        Runtime.trap("Order not found");
      };
    };
  };

  public shared ({ caller }) func updateSubscriptionStatus(user : Principal, status : { #active; #expired }) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update subscription status");
    };
    switch (subscriptions.get(user)) {
      case (?subscription) {
        let updatedSubscription : Subscription = {
          user = subscription.user;
          planType = subscription.planType;
          startDate = subscription.startDate;
          status;
          saladsRemaining = subscription.saladsRemaining;
        };
        subscriptions.add(user, updatedSubscription);
      };
      case (null) {
        Runtime.trap("Subscription not found");
      };
    };
  };

  // ─── Leads ───────────────────────────────────────────────────────────────────
  public shared func saveLead(name : Text, mobile : Text) : async Nat {
    let id = nextLeadId;
    nextLeadId += 1;
    let lead : Lead = {
      id;
      name;
      mobile;
      date = Time.now();
      status = #new_;
    };
    leads.add(id, lead);
    id
  };

  public query ({ caller }) func getAllLeads() : async [Lead] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view leads");
    };
    leads.values().toArray()
  };

  public shared ({ caller }) func updateLeadStatus(id : Nat, status : LeadStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update lead status");
    };
    switch (leads.get(id)) {
      case (?lead) {
        let updatedLead : Lead = {
          id = lead.id;
          name = lead.name;
          mobile = lead.mobile;
          date = lead.date;
          status;
        };
        leads.add(id, updatedLead);
      };
      case (null) {
        Runtime.trap("Lead not found");
      };
    };
  };

  // ─── Menu Management ──────────────────────────────────────────────────────────
  // Public query: anyone can browse the menu (reads from V2 map with tags)
  public query func getAllMenuItems() : async [MenuItem] {
    menuItemsV2.values().toArray()
  };

  public shared ({ caller }) func addMenuItem(
    name : Text,
    price : Nat,
    calories : Nat,
    protein : Nat,
    ingredients_ : [Text],
    tags_ : [Text],
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add menu items");
    };
    let id = nextMenuItemId;
    nextMenuItemId += 1;
    let item : MenuItem = {
      id;
      name;
      price;
      calories;
      protein;
      ingredients = ingredients_;
      tags = tags_;
      enabled = true;
    };
    menuItemsV2.add(id, item);
    id
  };

  public shared ({ caller }) func updateMenuItem(
    id : Nat,
    name : Text,
    price : Nat,
    calories : Nat,
    protein : Nat,
    ingredients_ : [Text],
    tags_ : [Text],
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update menu items");
    };
    switch (menuItemsV2.get(id)) {
      case (?item) {
        let updated : MenuItem = {
          id = item.id;
          name;
          price;
          calories;
          protein;
          ingredients = ingredients_;
          tags = tags_;
          enabled = item.enabled;
        };
        menuItemsV2.add(id, updated);
      };
      case (null) {
        Runtime.trap("Menu item not found");
      };
    };
  };

  public shared ({ caller }) func deleteMenuItem(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete menu items");
    };
    menuItemsV2.remove(id);
  };

  public shared ({ caller }) func toggleMenuItem(id : Nat, enabled : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can toggle menu items");
    };
    switch (menuItemsV2.get(id)) {
      case (?item) {
        let updated : MenuItem = {
          id = item.id;
          name = item.name;
          price = item.price;
          calories = item.calories;
          protein = item.protein;
          ingredients = item.ingredients;
          tags = item.tags;
          enabled;
        };
        menuItemsV2.add(id, updated);
      };
      case (null) {
        Runtime.trap("Menu item not found");
      };
    };
  };


  // ─── Coupons / Offers ────────────────────────────────────────────────────────
  public type DiscountType = {
    #percentage;
    #flat;
  };

  public type Coupon = {
    id : Nat;
    code : Text;
    discountType : DiscountType;
    discountValue : Nat;
    expiryDate : Time.Time;
    isActive : Bool;
  };

  let coupons = Map.empty<Nat, Coupon>();
  var nextCouponId = 0;

  public shared ({ caller }) func createCoupon(
    code : Text,
    discountType : DiscountType,
    discountValue : Nat,
    expiryDate : Time.Time,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create coupons");
    };
    let id = nextCouponId;
    nextCouponId += 1;
    let coupon : Coupon = {
      id;
      code;
      discountType;
      discountValue;
      expiryDate;
      isActive = true;
    };
    coupons.add(id, coupon);
    id
  };

  public query ({ caller }) func getAllCoupons() : async [Coupon] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view coupons");
    };
    coupons.values().toArray()
  };

  public shared ({ caller }) func deleteCoupon(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete coupons");
    };
    coupons.remove(id);
  };

  public shared ({ caller }) func toggleCoupon(id : Nat, isActive : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can toggle coupons");
    };
    switch (coupons.get(id)) {
      case (?c) {
        let updated : Coupon = {
          id = c.id;
          code = c.code;
          discountType = c.discountType;
          discountValue = c.discountValue;
          expiryDate = c.expiryDate;
          isActive;
        };
        coupons.add(id, updated);
      };
      case (null) { Runtime.trap("Coupon not found") };
    };
  };

  // Public: anyone can validate a coupon code (returns coupon or traps with reason)
  public query func validateCoupon(code : Text) : async Coupon {
    let now = Time.now();
    for ((_, c) in coupons.toArray().values()) {
      if (c.code == code) {
        if (not c.isActive) {
          Runtime.trap("Coupon is inactive");
        };
        if (c.expiryDate < now) {
          Runtime.trap("Coupon has expired");
        };
        return c;
      };
    };
    Runtime.trap("Invalid coupon code");
  };


  // ─── Delivery Management ─────────────────────────────────────────────────────
  public type Rider = {
    id : Nat;
    name : Text;
    mobile : Text;
    area : Text;
  };

  public type DeliveryStatus = {
    #preparing;
    #ready;
    #outForDelivery;
    #delivered;
  };

  public type DeliveryRecord = {
    id : Nat;
    orderId : Nat;
    customerName : Text;
    address : Text;
    deliveryTime : Time.Time;
    status : DeliveryStatus;
    riderId : ?Nat;
    notes : Text;
  };

  let riders = Map.empty<Nat, Rider>();
  var nextRiderId = 0;
  let deliveryRecords = Map.empty<Nat, DeliveryRecord>();
  var nextDeliveryId = 0;

  public shared ({ caller }) func addRider(name : Text, mobile : Text, area : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    let id = nextRiderId;
    nextRiderId += 1;
    riders.add(id, { id; name; mobile; area });
    id
  };

  public shared ({ caller }) func updateRider(id : Nat, name : Text, mobile : Text, area : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    switch (riders.get(id)) {
      case (?_) { riders.add(id, { id; name; mobile; area }) };
      case (null) { Runtime.trap("Rider not found") };
    };
  };

  public shared ({ caller }) func deleteRider(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    riders.remove(id);
  };

  public query ({ caller }) func getAllRiders() : async [Rider] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    riders.values().toArray()
  };

  public shared ({ caller }) func createDelivery(
    orderId : Nat,
    customerName : Text,
    address : Text,
    deliveryTime : Time.Time,
    notes : Text,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    let id = nextDeliveryId;
    nextDeliveryId += 1;
    deliveryRecords.add(id, {
      id; orderId; customerName; address; deliveryTime;
      status = #preparing; riderId = null; notes;
    });
    id
  };

  public shared ({ caller }) func updateDeliveryStatus(id : Nat, status : DeliveryStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    switch (deliveryRecords.get(id)) {
      case (?d) {
        deliveryRecords.add(id, {
          id = d.id; orderId = d.orderId; customerName = d.customerName;
          address = d.address; deliveryTime = d.deliveryTime;
          status; riderId = d.riderId; notes = d.notes;
        });
      };
      case (null) { Runtime.trap("Delivery not found") };
    };
  };

  public shared ({ caller }) func assignRider(deliveryId : Nat, riderId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    switch (deliveryRecords.get(deliveryId)) {
      case (?d) {
        deliveryRecords.add(deliveryId, {
          id = d.id; orderId = d.orderId; customerName = d.customerName;
          address = d.address; deliveryTime = d.deliveryTime;
          status = d.status; riderId = ?riderId; notes = d.notes;
        });
      };
      case (null) { Runtime.trap("Delivery not found") };
    };
  };

  public shared ({ caller }) func bulkAssignRider(deliveryIds : [Nat], riderId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    for (deliveryId in deliveryIds.values()) {
      switch (deliveryRecords.get(deliveryId)) {
        case (?d) {
          deliveryRecords.add(deliveryId, {
            id = d.id; orderId = d.orderId; customerName = d.customerName;
            address = d.address; deliveryTime = d.deliveryTime;
            status = d.status; riderId = ?riderId; notes = d.notes;
          });
        };
        case (null) {};
      };
    };
  };

  public shared ({ caller }) func updateDeliveryNote(id : Nat, notes : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    switch (deliveryRecords.get(id)) {
      case (?d) {
        deliveryRecords.add(id, {
          id = d.id; orderId = d.orderId; customerName = d.customerName;
          address = d.address; deliveryTime = d.deliveryTime;
          status = d.status; riderId = d.riderId; notes;
        });
      };
      case (null) { Runtime.trap("Delivery not found") };
    };
  };

  public query ({ caller }) func getAllDeliveries() : async [DeliveryRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    deliveryRecords.values().toArray()
  };


  // ─── Customer Management ──────────────────────────────────────────────────────

  public type UserNote = {
    id : Nat;
    text : Text;
    createdAt : Time.Time;
  };

  public type UserMeta = {
    isVip : Bool;
    notes : [UserNote];
  };

  let userMeta = Map.empty<Principal, UserMeta>();
  var nextNoteId = 0;

  func getOrInitMeta(principal : Principal) : UserMeta {
    switch (userMeta.get(principal)) {
      case (?m) { m };
      case (null) { { isVip = false; notes = [] } };
    };
  };

  public shared ({ caller }) func setUserVip(user : Principal, isVip : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    let meta = getOrInitMeta(user);
    userMeta.add(user, { isVip; notes = meta.notes });
  };

  public shared ({ caller }) func addUserNote(user : Principal, text : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    let meta = getOrInitMeta(user);
    let noteId = nextNoteId;
    nextNoteId += 1;
    let newNote : UserNote = { id = noteId; text; createdAt = Time.now() };
    let buf = meta.notes.toVarArray<UserNote>();
    let newLen = buf.size() + 1;
    let updatedNotes : [UserNote] = Array.tabulate<UserNote>(newLen, func i { if (i < buf.size()) { buf[i] } else { newNote } });
    userMeta.add(user, { isVip = meta.isVip; notes = updatedNotes });
    noteId
  };

  public shared ({ caller }) func deleteUserNote(user : Principal, noteId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    let meta = getOrInitMeta(user);
    let updatedNotes = meta.notes.filter(func(n : UserNote) : Bool { n.id != noteId });
    userMeta.add(user, { isVip = meta.isVip; notes = updatedNotes });
  };

  public query ({ caller }) func getUserMeta(user : Principal) : async UserMeta {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    getOrInitMeta(user)
  };

  public shared ({ caller }) func deleteUser(user : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    userProfiles.remove(user);
    userMeta.remove(user);
  };

  public shared ({ caller }) func updateUserProfileByAdmin(user : Principal, profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    userProfiles.add(user, profile);
  };

};
