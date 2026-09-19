/**
 * Importing this module registers every schema on the Mongoose connection,
 * which `populate()` requires even for models a given route never touches.
 */
export { AddOn } from "./AddOn";
export { Admin } from "./Admin";
export { Banner } from "./Banner";
export { Cart } from "./Cart";
export { Category } from "./Category";
export { Coupon, CouponRedemption } from "./Coupon";
export { CustomCakeRequest } from "./CustomCakeRequest";
export { CustomizationOption } from "./CustomizationOption";
export { DeliverySlot } from "./DeliverySlot";
export { DeliveryZone } from "./DeliveryZone";
export { Media } from "./Media";
export { Order } from "./Order";
export { PricingRule } from "./PricingRule";
export { Product } from "./Product";
export { Review } from "./Review";
export { StoreSettings } from "./StoreSettings";
export { User } from "./User";
