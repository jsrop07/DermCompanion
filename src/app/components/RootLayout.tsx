import { Outlet, Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Building2,
  BookOpen,
  Bell,
  LogOut,
  Activity,
  Pill,
  Scissors
} from "lucide-react";
import { motion } from "motion/react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";

const navItems = [
  { path: "/", label: "대시보드", icon: LayoutDashboard },
  { path: "/patients", label: "환자 목록", icon: Users },
  { path: "/register", label: "환자 등록", icon: UserPlus },
  { path: "/recovery-guide", label: "회복 가이드", icon: BookOpen },
  { path: "/medications", label: "약물 관리", icon: Pill },
  { path: "/procedure-types", label: "시술 관리", icon: Scissors },
  { path: "/clinic-info", label: "클리닉 정보", icon: Building2 },
];

export function RootLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col"
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center">
              <Activity className="size-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-teal-600 bg-clip-text text-transparent" style={{ fontFamily: 'Outfit, sans-serif' }}>
              DermCompanion
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                    ${isActive
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent'
                    }
                  `}
                >
                  <Icon className="size-5" />
                  <span className="font-medium">{item.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
            <Avatar className="size-10 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                관리
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-sidebar-foreground truncate">
                클리닉 관리자
              </p>
              <p className="text-xs text-muted-foreground truncate">
                admin@dermcompanion.kr
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="size-8 text-muted-foreground hover:text-destructive"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <motion.header
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="h-16 bg-card border-b border-border flex items-center justify-between px-8"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {navItems.find(item => item.path === location.pathname)?.label || "대시보드"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="size-5" />
              <span className="absolute top-1 right-1 size-2 bg-destructive rounded-full"></span>
            </Button>
          </div>
        </motion.header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
