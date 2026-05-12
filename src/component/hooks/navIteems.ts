import { SettingsIcon } from "lucide-react";
import DashboardIcon from "../../assets/Icon/DashboardIcon";
import ProductsIcon from "../../assets/Icon/ProductsIcon";
import ReportsIcon from "../../assets/Icon/ReportsIcon";
import ExpensesIcon from "../../assets/Icon/SettingIcon";
import StockIcon from "../../assets/Icon/StockIcon";
import TransactionsIcon from "../../assets/Icon/TransactionsIcon";


export const navItems = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: DashboardIcon,
    badge: 'New',
  },

  {
    label: 'Finance',
    icon: TransactionsIcon,
    children: [
      {
        label: 'Transactions',
        path: '/transactions',
        icon: TransactionsIcon,
      },
      {
        label: 'Expenses',
        path: '/expenses',
        icon: ExpensesIcon,
      },
    ],
  },

  {
    label: 'Products',
    icon: ProductsIcon,
    children: [
      {
        label: 'All Products',
        path: '/products',
        icon: ProductsIcon,
      },
      {
        label: 'Stock Inventory',
        path: '/inventory',
        icon: StockIcon,
      },
    ],
  },

  {
    label: 'Reports',
    path: '/reports',
    icon: ReportsIcon,
    badge: 'Live',
  },

  {
    label: 'Settings',
    path: '/settings',
    icon: SettingsIcon,
  },
]