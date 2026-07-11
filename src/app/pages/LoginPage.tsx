import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Activity, Lock, Mail } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { authApi } from "../../api/authApi";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem("derm_token");

    if (token) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await authApi.login({ email, password });
      localStorage.setItem("derm_token", res.access_token);
      localStorage.setItem("derm_user_name", res.user_name);
      localStorage.setItem("derm_user_role", res.user_role);

      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-500 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-30" />

        <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-12 text-white">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center"
          >
            <div className="mb-6 flex justify-center">
              <div className="size-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl">
                <Activity className="size-10 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
              DermCompanion
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-md">
              피부과 시술 후 환자 케어 및 회복 관리 시스템
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-white" />
                <span className="text-white/90">환자 관리</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-white" />
                <span className="text-white/90">복약 추적</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-white" />
                <span className="text-white/90">회복 모니터링</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 lg:hidden text-center">
            <div className="inline-flex size-16 rounded-xl bg-gradient-to-br from-primary to-teal-500 items-center justify-center mb-4">
              <Activity className="size-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-teal-600 bg-clip-text text-transparent" style={{ fontFamily: 'Outfit, sans-serif' }}>
              DermCompanion
            </h2>
          </div>

          <div className="bg-card rounded-2xl shadow-xl border border-border p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">관리자 로그인</h2>
              <p className="text-muted-foreground">클리닉 스태프 전용 관리자 시스템</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">이메일 또는 관리자 ID</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="text"
                    placeholder="admin@clinic.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 bg-input-background border-border"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11 bg-input-background border-border"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-primary to-teal-500 hover:from-primary/90 hover:to-teal-600 shadow-lg shadow-primary/20"
              >
                {loading ? "로그인 중..." : "로그인"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              로그인에 문제가 있으신가요?{" "}
              <button className="text-primary hover:underline font-medium">
                관리자에게 문의
              </button>
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            © 2026 DermCompanion. 클리닉 전용 시스템
          </p>
        </motion.div>
      </div>
    </div>
  );
}
