import {
  BarChart3,
  BookOpen,
  ClipboardList,
  Contact,
  MapPinned,
  FileText,
  FolderOpen,
  ImageIcon,
  Inbox,
  LayoutDashboard,
  Layers,
  ListOrdered,
  Link2,
  MessageSquareQuote,
  Package,
  Percent,
  Receipt,
  Settings,
  Shield,
  ScrollText,
  SlidersHorizontal,
  Star,
  Store,
  Tag,
  Ticket,
  Users,
  Workflow,
} from 'lucide-react';

export type DashboardNavIcon = typeof LayoutDashboard;

export type DashboardNavLeaf = {
  key: DashboardNavKey;
  label: string;
  href: string;
  icon: DashboardNavIcon;
};

export type DashboardNavGroup = {
  id: string;
  label: string;
  icon: DashboardNavIcon;
  items: DashboardNavLeaf[];
};

export type DashboardNavKey =
  | 'dashboard'
  | 'analytics'
  | 'orders'
  | 'coupons'
  | 'couponUsage'
  | 'products'
  | 'productReviews'
  | 'bundles'
  | 'specialOffers'
  | 'offers'
  | 'freebies'
  | 'customers'
  | 'brands'
  | 'heroBanners'
  | 'marquee'
  | 'flavors'
  | 'strengthLevels'
  | 'blogPosts'
  | 'blogCategories'
  | 'faqCategories'
  | 'faqs'
  | 'testimonials'
  | 'contactInfo'
  | 'contactFormSubmissions'
  | 'contactSocialLinks'
  | 'relatedItems'
  | 'deliveryZones'
  | 'taxRates'
  | 'pointOfSale'
  | 'pages'
  | 'adminAccounts'
  | 'changePassword';

/** Top-level link shown above grouped menus */
export const DASHBOARD_PRIMARY_LINK: DashboardNavLeaf = {
  key: 'dashboard',
  label: 'Dashboard',
  href: '/dashboard',
  icon: LayoutDashboard,
};

/** Grouped sidebar: each group expands to show its pages */
export const DASHBOARD_NAV_GROUPS: DashboardNavGroup[] = [
  {
    id: 'sales-catalog',
    label: 'Sales & catalog',
    icon: Package,
    items: [
      { key: 'orders', label: 'Orders', href: '/dashboard/orders', icon: ClipboardList },
      {
        key: 'analytics',
        label: 'Analytics',
        href: '/dashboard/analytics',
        icon: BarChart3,
      },
      { key: 'coupons', label: 'Coupons', href: '/dashboard/coupons', icon: Ticket },
      {
        key: 'couponUsage',
        label: 'Coupon usage',
        href: '/dashboard/coupon-usage',
        icon: ListOrdered,
      },
      { key: 'products', label: 'Products', href: '/dashboard/products', icon: Package },
      {
        key: 'productReviews',
        label: 'Product reviews',
        href: '/dashboard/product-reviews',
        icon: Star,
      },
      { key: 'bundles', label: 'Bundles', href: '/dashboard/bundles', icon: Layers },
      {
        key: 'specialOffers',
        label: 'Special offers',
        href: '/dashboard/special-offers',
        icon: Percent,
      },
      { key: 'offers', label: 'Offers', href: '/dashboard/offers', icon: Percent },
      /* Freebies — uncomment when this admin section should appear again:
      { key: 'freebies', label: 'Freebies', href: '/dashboard/freebies', icon: Gift },
      */
      { key: 'customers', label: 'Customers', href: '/dashboard/customers', icon: Users },
    ],
  },
  {
    id: 'merchandising',
    label: 'Merchandising',
    icon: Tag,
    items: [
      { key: 'brands', label: 'Brands', href: '/dashboard/brands', icon: Tag },
      {
        key: 'heroBanners',
        label: 'Hero banners',
        href: '/dashboard/hero-banners',
        icon: ImageIcon,
      },
      {
        key: 'marquee',
        label: 'Marquee',
        href: '/dashboard/marquee',
        icon: ScrollText,
      },
      { key: 'flavors', label: 'Flavors', href: '/dashboard/flavors', icon: Tag },
      {
        key: 'strengthLevels',
        label: 'Strength Levels',
        href: '/dashboard/strength-levels',
        icon: SlidersHorizontal,
      },
    ],
  },
  {
    id: 'content',
    label: 'Content',
    icon: BookOpen,
    items: [
      {
        key: 'blogPosts',
        label: 'Blog posts',
        href: '/dashboard/blog-posts',
        icon: BookOpen,
      },
      {
        key: 'blogCategories',
        label: 'Blog categories',
        href: '/dashboard/blog-categories',
        icon: FolderOpen,
      },
      {
        key: 'faqCategories',
        label: 'FAQ categories',
        href: '/dashboard/faq-categories',
        icon: FolderOpen,
      },
      {
        key: 'faqs',
        label: 'FAQ',
        href: '/dashboard/faqs',
        icon: BookOpen,
      },
      {
        key: 'testimonials',
        label: 'Testimonials',
        href: '/dashboard/testimonials',
        icon: MessageSquareQuote,
      },
      {
        key: 'pages',
        label: 'Pages',
        href: '/dashboard/pages',
        icon: FileText,
      },
    ],
  },
  {
    id: 'store-delivery',
    label: 'Store & delivery',
    icon: Store,
    items: [
      {
        key: 'contactInfo',
        label: 'Contact info',
        href: '/dashboard/contact-info',
        icon: Contact,
      },
      {
        key: 'contactFormSubmissions',
        label: 'Contact form',
        href: '/dashboard/contact-form',
        icon: Inbox,
      },
      {
        key: 'contactSocialLinks',
        label: 'Contact social links',
        href: '/dashboard/contact-social-links',
        icon: Link2,
      },
      {
        key: 'relatedItems',
        label: 'Related items',
        href: '/dashboard/related-items',
        icon: Workflow,
      },
      {
        key: 'deliveryZones',
        label: 'Delivery zones',
        href: '/dashboard/delivery-zones',
        icon: MapPinned,
      },
      {
        key: 'taxRates',
        label: 'Tax rates',
        href: '/dashboard/tax-rates',
        icon: Receipt,
      },
      {
        key: 'pointOfSale',
        label: 'Point of sale',
        href: '/dashboard/point-of-sale',
        icon: MapPinned,
      },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    items: [
      {
        key: 'adminAccounts',
        label: 'Admin accounts',
        href: '/dashboard/admin-accounts',
        icon: Shield,
      },
      {
        key: 'changePassword',
        label: 'Change password',
        href: '/dashboard/change-password',
        icon: Settings,
      },
    ],
  },
];

/** Flat list of all nav leaves (primary + every submenu page) */
export const DASHBOARD_NAV_ITEMS: DashboardNavLeaf[] = [
  DASHBOARD_PRIMARY_LINK,
  ...DASHBOARD_NAV_GROUPS.flatMap((g) => g.items),
];

/** Group id containing the current path, if any — used to auto-expand submenus */
export function dashboardNavGroupIdForPath(pathname: string): string | null {
  for (const group of DASHBOARD_NAV_GROUPS) {
    for (const item of group.items) {
      const active =
        pathname === item.href ||
        (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));
      if (active) return group.id;
    }
  }
  return null;
}

export function isDashboardNavLeafActive(pathname: string, href: string): boolean {
  return pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`));
}

export const DASHBOARD_PAGE_META: Record<
  string,
  { title: string; description: string }
> = {
  '/dashboard': {
    title: 'E-Commerce Dashboard',
    description: 'Performance overview for your storefront',
  },
  '/dashboard/orders': {
    title: 'Orders',
    description: 'Track and manage all incoming orders',
  },
  '/dashboard/coupons': {
    title: 'Coupons',
    description: 'Browse promotional codes (GET /coupons/admin)',
  },
  '/dashboard/coupon-usage': {
    title: 'Coupon usage',
    description: 'All coupon redemptions (GET /coupons/admin/usage)',
  },
  '/dashboard/products': {
    title: 'Products',
    description: 'Manage catalog items and pricing',
  },
  '/dashboard/product-reviews': {
    title: 'Product reviews',
    description: 'Moderate customer reviews and pending submissions',
  },
  '/dashboard/bundles': {
    title: 'Bundles',
    description: 'View product bundles and pack pricing',
  },
  '/dashboard/special-offers': {
    title: 'Special offers',
    description: 'Manage timed promotions and offer pricing',
  },
  '/dashboard/offers': {
    title: 'Offers',
    description: 'Manage backend offers and product links',
  },
  /* '/dashboard/freebies': {
    title: 'Freebies',
    description: 'Manage freebie catalog SKUs and storefront user eligibility',
  }, */
  '/dashboard/customers': {
    title: 'Customers',
    description: 'Browse storefront accounts from GET /users/admin (newest first)',
  },
  '/dashboard/analytics': {
    title: 'Analytics',
    description: 'Deep dive into business analytics',
  },
  '/dashboard/reports': {
    title: 'Reports',
    description: 'Generate and export business reports',
  },
  '/dashboard/brands': {
    title: 'Brands',
    description: 'View brand performance and revenue',
  },
  '/dashboard/hero-banners': {
    title: 'Hero banners',
    description: 'Manage homepage carousel slides and scheduling',
  },
  '/dashboard/marquee': {
    title: 'Marquee',
    description: 'Create and edit top banner marquee lines (GET/POST/PATCH/DELETE /marque)',
  },
  '/dashboard/flavors': {
    title: 'Flavors',
    description: 'Create and manage flavor options',
  },
  '/dashboard/strength-levels': {
    title: 'Strength Levels',
    description: 'Define product strength levels',
  },
  '/dashboard/blog-posts': {
    title: 'Blog posts',
    description: 'Create posts and review published content from the public API',
  },
  '/dashboard/blog-categories': {
    title: 'Blog categories',
    description: 'Organize blog posts with categories',
  },
  '/dashboard/faq-categories': {
    title: 'FAQ categories',
    description: 'Manage FAQ category groups used by the FAQ section',
  },
  '/dashboard/faqs': {
    title: 'FAQ',
    description: 'Manage FAQ entries shown in the public FAQ page',
  },
  '/dashboard/testimonials': {
    title: 'Testimonials',
    description: 'Manage customer quotes and ratings shown on the site',
  },
  '/dashboard/contact-info': {
    title: 'Contact info',
    description: 'Manage phone, email, and other contact lines for the public contact page',
  },
  '/dashboard/contact-form': {
    title: 'Contact form',
    description: 'List submissions from GET /contact-form/admin (newest first)',
  },
  '/dashboard/contact-social-links': {
    title: 'Contact social links',
    description: 'Manage social profile URLs shown on the public contact page',
  },
  '/dashboard/related-items': {
    title: 'Related items',
    description: 'Manage cross-links between products, bundles, and special offers',
  },
  '/dashboard/delivery-zones': {
    title: 'Delivery zones',
    description: 'Manage delivery areas, pricing, and visibility',
  },
  '/dashboard/tax-rates': {
    title: 'Tax rates',
    description: 'Create and manage tax rates per delivery zone',
  },
  '/dashboard/point-of-sale': {
    title: 'Point of sale',
    description: 'Manage retail locations and map data shown on the storefront',
  },
  '/dashboard/pages': {
    title: 'Pages',
    description: 'Manage static pages and HTML content shown on the storefront',
  },
  '/dashboard/admin-accounts': {
    title: 'Admin accounts',
    description: 'List dashboard admins from GET /auth/admin (newest first)',
  },
  '/dashboard/change-password': {
    title: 'Settings',
    description: 'Change admin password with OTP verification',
  },
};
