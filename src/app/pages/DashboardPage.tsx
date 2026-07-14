import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Users, Activity, AlertCircle, TrendingUp, ArrowRight, Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Link, useNavigate } from "react-router";
import { dashboardApi } from "../../api/dashboardApi";
import type { DashboardSummary, DashboardAlert, PatientListItem } from "../../types/dashboard";

type DashboardStatConfig = {
  key: keyof DashboardSummary;
  title: string;
  icon: typeof Users;
  color: string;
};

const statConfig: DashboardStatConfig[] = [
  {
    key: "today_patients",
    title: "오늘 등록 환자",
    icon: Users,
    color: "from-cyan-500 to-blue-500",
  },
  {
    key: "active_recovery_patients",
    title: "활성 회복 환자",
    icon: Activity,
    color: "from-teal-500 to-emerald-500",
  },
  {
    key: "delayed_medication_patients",
    title: "지연 복용 환자",
    icon: Clock,
    color: "from-yellow-500 to-amber-500",
  },
  {
    key: "missed_medication_patients",
    title: "복약 누락 환자",
    icon: AlertCircle,
    color: "from-orange-500 to-red-500",
  },
];

export function DashboardPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentPatients, setRecentPatients] = useState<PatientListItem[]>([]);
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleStatClick = (
    key: string,
  ) => {
    if (key === "today_patients") {
      navigate(
        "/patients?filter=today",
      );
    } else if (
      key
      === "active_recovery_patients"
    ) {
      navigate(
        "/patients?filter=recovering",
      );
    } else if (
      key
      === "delayed_medication_patients"
    ) {
      navigate(
        "/patients?filter=delayed",
      );
    } else if (
      key
      === "missed_medication_patients"
    ) {
      navigate(
        "/patients?filter=missed",
      );
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [sum, patients, alts] = await Promise.all([
          dashboardApi.getSummary(),
          dashboardApi.getRecentPatients(),
          dashboardApi.getAlerts(),
        ]);
        setSummary(sum);
        setRecentPatients(patients);
        setAlerts(alts);
      } catch (e) {
        setError(e instanceof Error ? e.message : "데이터를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">데이터 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {statConfig.map((stat, index) => {
          const Icon = stat.icon;
          const value = summary ? summary[stat.key] : 0;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
            >
              <Card
                className="border-border hover:shadow-lg transition-all duration-300 overflow-hidden group cursor-pointer"
                onClick={() => handleStatClick(stat.key)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-2">
                        {stat.title}
                      </p>
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold text-foreground">
                          {value}
                        </h3>
                        <span className="text-sm font-medium text-primary flex items-center gap-1">
                          <TrendingUp className="size-3" />
                        </span>
                      </div>
                    </div>
                    <div className={`size-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="size-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Patients Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>최근 환자</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/patients">
                  전체 보기
                  <ArrowRight className="size-4 ml-2" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>환자명</TableHead>
                      <TableHead>시술</TableHead>
                      <TableHead>시술일</TableHead>
                      <TableHead>회복 단계</TableHead>
                      <TableHead>복약 상태</TableHead>
                      <TableHead>마지막 업데이트</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPatients.map((patient) => (
                      <TableRow
                        key={patient.id}
                        className="hover:bg-muted/30 cursor-pointer"
                        onClick={() => navigate(`/patients/${patient.id}`)}
                      >
                        <TableCell className="font-medium">
                          <span className="hover:text-primary">
                            {patient.name}
                          </span>
                        </TableCell>
                        <TableCell>{patient.procedure ?? "-"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {patient.date ?? "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-accent/50">
                            {patient.stage ?? "-"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              patient.medicationStatus === "정상"
                                ? "bg-teal-500 text-white"
                                : patient.medicationStatus
                                  === "지연"
                                  ? "bg-amber-500 text-white"
                                  : "bg-destructive text-white"
                            }
                          >
                            {patient.medicationStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {patient.lastUpdate ?? "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Alerts & Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="space-y-6"
        >
          {/* Quick Actions */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>빠른 작업</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-start h-auto py-3 bg-gradient-to-r from-primary to-teal-500 hover:from-primary/90 hover:to-teal-600">
                <Link to="/register">
                  <Users className="size-5 mr-3" />
                  새 환자 등록
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start h-auto py-3 border-border hover:bg-accent">
                <Link to="/patients">
                  <Activity className="size-5 mr-3" />
                  환자 목록 보기
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start h-auto py-3 border-border hover:bg-accent">
                <Link to="/recovery-guide">
                  <Calendar className="size-5 mr-3" />
                  회복 가이드 관리
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Alerts */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>최근 알림</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {alerts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">알림이 없습니다.</p>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex gap-3 p-3 rounded-lg bg-accent/30 border border-border/50 hover:bg-accent/50 transition-colors"
                  >
                    <div className={`size-2 rounded-full mt-2 flex-shrink-0 ${alert.type === "medication" ? "bg-orange-500" : "bg-blue-500"
                      }`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground">{alert.patient}</p>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
