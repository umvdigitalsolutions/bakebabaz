export type NavLink = { label: string; href: string };

export const primaryNav: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Our story", href: "/our-story" },
  { label: "Customize", href: "/customize-your-cake" },
  { label: "Contact", href: "/contact" },
];

export const footerNav: NavLink[] = [
  { label: "Shop", href: "/shop" },
  { label: "Our story", href: "/our-story" },
  { label: "Customize a cake", href: "/customize-your-cake" },
  { label: "Contact", href: "/contact" },
];

export const policyNav: NavLink[] = [
  { label: "Privacy Policy", href: "/policies/privacy" },
  { label: "Terms", href: "/policies/terms" },
  { label: "Shipping & Delivery", href: "/policies/shipping" },
  { label: "Cancellation", href: "/policies/cancellation" },
  { label: "Refund Policy", href: "/policies/refund" },
];
