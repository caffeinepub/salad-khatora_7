import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Time "mo:core/Time";
import List "mo:core/List";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";


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

  // ─── Subscription Plans ──────────────────────────────────────────────────────
  public type SubscriptionPlan = {
    id : Nat;
    name : Text;
    totalMeals : Nat;
    price : Nat;
    validityDays : Nat;
    description : Text;
  };

  // V1 type kept for stable variable compatibility (migration from old on-chain data)
  type SubscriptionV1 = {
    user : Principal;
    planType : { #weekly; #monthly };
    startDate : Time.Time;
    status : { #active; #expired };
    saladsRemaining : Nat;
  };

  public type Subscription = {
    user : Principal;
    planId : Nat;
    planName : Text;
    startDate : Time.Time;
    expiryDate : Time.Time;
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

  // V2 type (with tags)
  type MenuItemV2 = {
    id : Nat;
    name : Text;
    price : Nat;
    calories : Nat;
    protein : Nat;
    ingredients : [Text];
    tags : [Text];
    enabled : Bool;
  };

  // ─── New Bowl Size and LinkedIngredient types ─────────────────────────────
  public type BowlSize = {
    size : Text;      // "small", "medium", or "large"
    price : Nat;
    calories : Nat;
    protein : Nat;
  };

  public type LinkedIngredient = {
    ingredientId : Nat;
    quantityGrams : Nat;
  };

  // V3 MenuItem — current public type
  public type MenuItem = {
    id : Nat;
    name : Text;
    price : Nat;
    calories : Nat;
    protein : Nat;
    ingredients : [Text];
    tags : [Text];
    enabled : Bool;
    sizes : [BowlSize];
    linkedIngredients : [LinkedIngredient];
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let orders = Map.empty<Nat, Order>();
  // Legacy stable variable — keeps old type to avoid compatibility error
  let subscriptions = Map.empty<Principal, SubscriptionV1>();
  // V2 stable variable with new Subscription type
  let subscriptionsV2 = Map.empty<Principal, Subscription>();
  var subscriptionsMigrated = false;
  let subscriptionPlans = Map.empty<Nat, SubscriptionPlan>();
  var nextPlanId = 0;
  var plansSeeded = false;
  let ingredients = Map.empty<Nat, Ingredient>();
  let menuItemIngredients = List.empty<MenuItemIngredient>();

  // Legacy stable maps kept for migration
  let menuItems = Map.empty<Nat, MenuItemV1>();
  let menuItemsV2 = Map.empty<Nat, MenuItemV2>();
  // Current V3 map
  let menuItemsV3 = Map.empty<Nat, MenuItem>();

  var nextOrderId = 0;
  var nextIngredientId = 0;
  var nextMenuItemId = 0;
  var menuItemsMigrated = false;
  var menuItemsV3Migrated = false;

  // ─── Leads ───────────────────────────────────────────────────────────────────
  public type LeadStatus = { #new_; #contacted; #converted };
  public type Lead = {
    id : Nat;
    name : Text;
    mobile : Text;
    date : Time.Time;
    status : LeadStatus;
  };

  let leads = Map.empty<Nat, Lead>();
  var nextLeadId = 0;

  // ─── Reviews ─────────────────────────────────────────────────────────────────
  public type ReviewStatus = {
    #pending;
    #approved;
    #rejected;
  };

  public type Review = {
    id : Text;
    userName : Text;
    rating : Nat;
    comment : Text;
    date : Int;
    status : ReviewStatus;
  };

  public type Result<T, E> = {
    #ok : T;
    #err : E;
  };

  let reviews = Map.empty<Text, Review>();
  var reviewIdCounter : Nat = 0;

  func generateReviewId() : Text {
    reviewIdCounter += 1;
    let timestamp = Time.now();
    reviewIdCounter.toText().concat("-".concat(timestamp.toText()))
  };

  // ─── Seed Default Plans ───────────────────────────────────────────────────────
  func seedPlans() {
    if (not plansSeeded) {
      let weeklyId = nextPlanId;
      nextPlanId += 1;
      subscriptionPlans.add(weeklyId, {
        id = weeklyId;
        name = "Weekly";
        totalMeals = 6;
        price = 599;
        validityDays = 7;
        description = "6 fresh salads over 7 days. Perfect for trying healthy eating.";
      });
      let monthlyId = nextPlanId;
      nextPlanId += 1;
      subscriptionPlans.add(monthlyId, {
        id = monthlyId;
        name = "Monthly";
        totalMeals = 24;
        price = 1999;
        validityDays = 30;
        description = "24 salads over 30 days. Best value for committed healthy eaters.";
      });
      plansSeeded := true;
    };
  };

  public shared ({ caller }) func createReview(userName : Text, rating : Nat, comment : Text) : async Result<Review, Text> {
    if (caller.isAnonymous()) {
      return #err("Unauthorized: Must be authenticated to create a review");
    };
    if (rating < 1 or rating > 5) {
      return #err("Invalid rating: must be between 1 and 5");
    };
    let id = generateReviewId();
    let review : Review = {
      id;
      userName;
      rating;
      comment;
      date = Time.now();
      status = #pending;
    };
    reviews.add(id, review);
    #ok(review)
  };

  public query func getApprovedReviews() : async [Review] {
    reviews.values().toArray().filter(func(r : Review) : Bool {
      switch (r.status) {
        case (#approved) { true };
        case (_) { false };
      }
    })
  };

  public query ({ caller }) func getAllReviews() : async [Review] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all reviews");
    };
    reviews.values().toArray()
  };

  public shared ({ caller }) func updateReviewStatus(id : Text, status : ReviewStatus) : async Result<Review, Text> {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update review status");
    };
    switch (reviews.get(id)) {
      case (?review) {
        let updatedReview : Review = {
          id = review.id;
          userName = review.userName;
          rating = review.rating;
          comment = review.comment;
          date = review.date;
          status;
        };
        reviews.add(id, updatedReview);
        #ok(updatedReview)
      };
      case (null) {
        #err("Review not found")
      };
    }
  };

  public shared ({ caller }) func deleteReview(id : Text) : async Result<(), Text> {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete reviews");
    };
    switch (reviews.get(id)) {
      case (?_) {
        reviews.remove(id);
        #ok(())
      };
      case (null) {
        #err("Review not found")
      };
    }
  };

  // Migrate data from legacy maps
  system func postupgrade() {
    // V1 -> V2
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
    // V2 -> V3
    if (not menuItemsV3Migrated) {
      for ((k, v) in menuItemsV2.toArray().values()) {
        menuItemsV3.add(k, {
          id = v.id;
          name = v.name;
          price = v.price;
          calories = v.calories;
          protein = v.protein;
          ingredients = v.ingredients;
          tags = v.tags;
          enabled = v.enabled;
          sizes = [];
          linkedIngredients = [];
        });
      };
      menuItemsV3Migrated := true;
    };
    // Seed default subscription plans
    seedPlans();
    // Migrate V1 subscriptions to V2
    if (not subscriptionsMigrated) {
      for ((principal, sub) in subscriptions.toArray().values()) {
        // Only migrate if not already in V2
        if (subscriptionsV2.get(principal) == null) {
          let planId : Nat = switch (sub.planType) {
            case (#weekly) { 0 };
            case (#monthly) { 1 };
          };
          let planName : Text = switch (sub.planType) {
            case (#weekly) { "Weekly" };
            case (#monthly) { "Monthly" };
          };
          // Set expiry as startDate + 7 or 30 days
          let validityNanos : Int = switch (sub.planType) {
            case (#weekly) { 7 * 86_400_000_000_000 };
            case (#monthly) { 30 * 86_400_000_000_000 };
          };
          let expiryDate : Time.Time = sub.startDate + validityNanos;
          subscriptionsV2.add(principal, {
            user = sub.user;
            planId;
            planName;
            startDate = sub.startDate;
            expiryDate;
            status = sub.status;
            saladsRemaining = sub.saladsRemaining;
          });
        };
      };
      subscriptionsMigrated := true;
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

  // ── First-Admin Claim ──────────────────────────────────────────────────────
  public query func hasAdminBeenClaimed() : async Bool {
    firstAdminClaimed;
  };

  public shared ({ caller }) func claimFirstAdminRole() : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Must be authenticated to claim admin");
    };
    if (firstAdminClaimed) {
      Runtime.trap("Admin has already been claimed");
    };
    accessControlState.userRoles.add(caller, #admin);
    accessControlState.adminAssigned := true;
    firstAdminClaimed := true;
  };

  // Place an order — deducts 1 meal from active subscription if available
  public shared ({ caller }) func placeOrder(items : [OrderItem], totalAmount : Nat, deliveryType : DeliveryType) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can place orders");
    };
    // Block order if subscription exists but meals are exhausted
    switch (subscriptionsV2.get(caller)) {
      case (?sub) {
        let now = Time.now();
        if (sub.saladsRemaining == 0 or sub.status == #expired or sub.expiryDate <= now) {
          Runtime.trap("Your subscription has ended, please renew it to continue ordering.");
        };
      };
      case (null) {};
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

    // Deduct 1 meal from subscription if active and meals remain
    switch (subscriptionsV2.get(caller)) {
      case (?sub) {
        let now = Time.now();
        switch (sub.status) {
          case (#active) {
            if (sub.saladsRemaining > 0 and sub.expiryDate > now) {
              let remaining = Nat.sub(sub.saladsRemaining, 1);
              let newStatus : { #active; #expired } = if (remaining == 0) { #expired } else { #active };
              subscriptionsV2.add(caller, {
                user = sub.user;
                planId = sub.planId;
                planName = sub.planName;
                startDate = sub.startDate;
                expiryDate = sub.expiryDate;
                status = newStatus;
                saladsRemaining = remaining;
              });
            };
          };
          case (#expired) {};
        };
      };
      case (null) {};
    };

    // Deduct ingredients: first try V3 linkedIngredients, then fall back to old menuItemIngredients
    for (item in items.values()) {
      var deductedFromV3 = false;
      // Try V3 linked ingredients
      for ((_, menuItem) in menuItemsV3.toArray().values()) {
        if (menuItem.name == item.saladName) {
          for (link in menuItem.linkedIngredients.values()) {
            switch (ingredients.get(link.ingredientId)) {
              case (?ingredient) {
                let totalNeeded = item.quantity * link.quantityGrams;
                let newQuantity = if (ingredient.quantityInStock > totalNeeded) {
                  Nat.sub(ingredient.quantityInStock, totalNeeded)
                } else { 0 };
                ingredients.add(link.ingredientId, {
                  id = ingredient.id;
                  name = ingredient.name;
                  unit = ingredient.unit;
                  quantityInStock = newQuantity;
                  lowStockThreshold = ingredient.lowStockThreshold;
                });
              };
              case (null) {};
            };
          };
          deductedFromV3 := true;
        };
      };
      // Fallback to old menuItemIngredients
      if (not deductedFromV3) {
        for (link in menuItemIngredients.values()) {
          if (link.menuItemName == item.saladName) {
            switch (ingredients.get(link.ingredientId)) {
              case (?ingredient) {
                let totalNeeded = item.quantity * link.quantityPerOrder;
                let newQuantity = if (ingredient.quantityInStock > totalNeeded) {
                  Nat.sub(ingredient.quantityInStock, totalNeeded) } else { 0
                };
                ingredients.add(link.ingredientId, {
                  id = ingredient.id;
                  name = ingredient.name;
                  unit = ingredient.unit;
                  quantityInStock = newQuantity;
                  lowStockThreshold = ingredient.lowStockThreshold;
                });
              };
              case (null) {};
            };
          };
        };
      };
    };

    orders.add(id, newOrder);
  };

  public query ({ caller }) func getUserOrders() : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view orders");
    };
    orders.values().toArray().filter(func(order : Order) : Bool { order.user == caller });
  };

  // ─── Subscription Plans CRUD ──────────────────────────────────────────────────
  public query func getAllSubscriptionPlans() : async [SubscriptionPlan] {
    seedPlans();
    subscriptionPlans.values().toArray()
  };

  public shared ({ caller }) func createSubscriptionPlan(
    name : Text,
    totalMeals : Nat,
    price : Nat,
    validityDays : Nat,
    description : Text,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create subscription plans");
    };
    let id = nextPlanId;
    nextPlanId += 1;
    subscriptionPlans.add(id, { id; name; totalMeals; price; validityDays; description });
    id
  };

  public shared ({ caller }) func updateSubscriptionPlan(
    id : Nat,
    name : Text,
    totalMeals : Nat,
    price : Nat,
    validityDays : Nat,
    description : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update subscription plans");
    };
    switch (subscriptionPlans.get(id)) {
      case (?_) {
        subscriptionPlans.add(id, { id; name; totalMeals; price; validityDays; description });
      };
      case (null) { Runtime.trap("Plan not found") };
    };
  };

  public shared ({ caller }) func deleteSubscriptionPlan(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete subscription plans");
    };
    subscriptionPlans.remove(id);
  };

  // ─── User Subscription ────────────────────────────────────────────────────────
  public shared ({ caller }) func createSubscription(planId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create subscriptions");
    };
    seedPlans();
    switch (subscriptionPlans.get(planId)) {
      case (?plan) {
        let now = Time.now();
        // validityDays * 24 * 60 * 60 * 1_000_000_000 nanoseconds
        let expiryDate = now + plan.validityDays * 86_400_000_000_000;
        let newSubscription : Subscription = {
          user = caller;
          planId;
          planName = plan.name;
          startDate = now;
          expiryDate;
          status = #active;
          saladsRemaining = plan.totalMeals;
        };
        subscriptionsV2.add(caller, newSubscription);
      };
      case (null) { Runtime.trap("Subscription plan not found") };
    };
  };

  public query ({ caller }) func getCallerSubscription() : async ?Subscription {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view subscriptions");
    };
    subscriptionsV2.get(caller);
  };

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

  public shared ({ caller }) func saveUserProfile(profile : UserProfile) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Must be authenticated to save profile");
    };
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
    ingredients.add(id, { id; name; unit; quantityInStock; lowStockThreshold });
    id;
  };

  public shared ({ caller }) func updateIngredientStock(id : Nat, newQuantity : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update ingredient stock");
    };
    switch (ingredients.get(id)) {
      case (?ingredient) {
        ingredients.add(id, {
          id = ingredient.id;
          name = ingredient.name;
          unit = ingredient.unit;
          quantityInStock = newQuantity;
          lowStockThreshold = ingredient.lowStockThreshold;
        });
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
    menuItemIngredients.add({ menuItemName; ingredientId; quantityPerOrder });
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
    subscriptionsV2.values().toArray();
  };

  public shared ({ caller }) func updateOrderStatus(orderId : Nat, status : OrderStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update order status");
    };
    switch (orders.get(orderId)) {
      case (?order) {
        orders.add(orderId, {
          id = order.id;
          user = order.user;
          items = order.items;
          totalAmount = order.totalAmount;
          deliveryType = order.deliveryType;
          status;
          createdAt = order.createdAt;
        });
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
    switch (subscriptionsV2.get(user)) {
      case (?subscription) {
        subscriptionsV2.add(user, {
          user = subscription.user;
          planId = subscription.planId;
          planName = subscription.planName;
          startDate = subscription.startDate;
          expiryDate = subscription.expiryDate;
          status;
          saladsRemaining = subscription.saladsRemaining;
        });
      };
      case (null) {
        Runtime.trap("Subscription not found");
      };
    };
  };


  // ─── Menu Management (V3) ─────────────────────────────────────────────────
  public query func getAllMenuItems() : async [MenuItem] {
    menuItemsV3.values().toArray()
  };

  public shared ({ caller }) func addMenuItem(
    name : Text,
    price : Nat,
    calories : Nat,
    protein : Nat,
    ingredients_ : [Text],
    tags_ : [Text],
    sizes_ : [BowlSize],
    linkedIngredients_ : [LinkedIngredient],
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add menu items");
    };
    let id = nextMenuItemId;
    nextMenuItemId += 1;
    menuItemsV3.add(id, {
      id;
      name;
      price;
      calories;
      protein;
      ingredients = ingredients_;
      tags = tags_;
      enabled = true;
      sizes = sizes_;
      linkedIngredients = linkedIngredients_;
    });
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
    sizes_ : [BowlSize],
    linkedIngredients_ : [LinkedIngredient],
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update menu items");
    };
    switch (menuItemsV3.get(id)) {
      case (?item) {
        menuItemsV3.add(id, {
          id = item.id;
          name;
          price;
          calories;
          protein;
          ingredients = ingredients_;
          tags = tags_;
          enabled = item.enabled;
          sizes = sizes_;
          linkedIngredients = linkedIngredients_;
        });
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
    menuItemsV3.remove(id);
  };

  public shared ({ caller }) func toggleMenuItem(id : Nat, enabled : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can toggle menu items");
    };
    switch (menuItemsV3.get(id)) {
      case (?item) {
        menuItemsV3.add(id, {
          id = item.id;
          name = item.name;
          price = item.price;
          calories = item.calories;
          protein = item.protein;
          ingredients = item.ingredients;
          tags = item.tags;
          enabled;
          sizes = item.sizes;
          linkedIngredients = item.linkedIngredients;
        });
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
    coupons.add(id, { id; code; discountType; discountValue; expiryDate; isActive = true });
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
        coupons.add(id, {
          id = c.id;
          code = c.code;
          discountType = c.discountType;
          discountValue = c.discountValue;
          expiryDate = c.expiryDate;
          isActive;
        });
      };
      case (null) { Runtime.trap("Coupon not found") };
    };
  };

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

  // ─── Leads Management ────────────────────────────────────────────────────────
  public shared func createLead(name : Text, mobile : Text) : async Nat {
    let id = nextLeadId;
    nextLeadId += 1;
    leads.add(id, {
      id;
      name;
      mobile;
      date = Time.now();
      status = #new_;
    });
    id
  };

  public query ({ caller }) func getLeads() : async [Lead] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view leads");
    };
    leads.values().toArray()
  };

  public shared ({ caller }) func updateLeadStatus(id : Nat, status : LeadStatus) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update lead status");
    };
    switch (leads.get(id)) {
      case (?lead) {
        leads.add(id, {
          id = lead.id;
          name = lead.name;
          mobile = lead.mobile;
          date = lead.date;
          status;
        });
        true
      };
      case (null) { false };
    };
  };
  // ─────────────────────────────────────────────────────────────────────────────

};
