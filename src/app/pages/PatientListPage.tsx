import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Search, Eye, Edit, Send, MoreVertical } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Link, useNavigate, useSearchParams } from "react-router";
import { patientApi } from "../../api/patientApi";
import type { PatientListItem } from "../../types/patient";

const STATUS_FILTERS = [
  { value: "all-status", label: "전체 상태" },
  { value: "today", label: "오늘 등록" },
  { value: "normal", label: "정상 복약" },
  { value: "missed", label: "복약 누락" },
  { value: "recovering", label: "회복중" },
  { value: "completed", label: "회복완료" },
];

export function PatientListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("filter") || "all-status");
  const [procedureFilter, setProcedureFilter] = useState("all-procedure");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPatients = async (search?: string, status?: string, procedure?: string) => {
    try {
      setLoading(true);
      const apiStatus = (!status || status === "all-status") ? undefined : status;
      let data = await patientApi.list(search || undefined, apiStatus);
      
      if (procedure && procedure !== "all-procedure") {
        data = data.filter(p => p.procedure === procedure);
      }
      
      setPatients(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "환자 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients(searchTerm || undefined, statusFilter, procedureFilter);
  }, [statusFilter, procedureFilter]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    loadPatients(value, statusFilter, procedureFilter);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setSearchParams(value === "all-status" ? {} : { filter: value });
  };

  const uniqueProcedures = Array.from(new Set(patients.map(p => p.procedure).filter(Boolean)));
  const activeLabel = STATUS_FILTERS.find(f => f.value === statusFilter)?.label ?? "전체 상태";

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        {/* Filters */}
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <Input
                  placeholder="환자명, 시술명으로 검색..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 bg-input-background border-border"
                />
              </div>
              <div className="flex gap-3 flex-wrap items-center">
                <Select value={procedureFilter} onValueChange={setProcedureFilter}>
                  <SelectTrigger className="w-[140px] bg-input-background border-border">
                    <SelectValue placeholder="시술 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-procedure">전체 시술</SelectItem>
                    {uniqueProcedures.map((proc, idx) => (
                      <SelectItem key={idx} value={proc as string}>{proc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Status filter pills */}
                <div className="flex gap-1.5 flex-wrap">
                  {STATUS_FILTERS.map(f => (
                    <button
                      key={f.value}
                      onClick={() => handleStatusFilter(f.value)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all border ${
                        statusFilter === f.value
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patients Table */}
        <Card className="border-border">
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                {error}
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">환자명</TableHead>
                        <TableHead>시술</TableHead>
                        <TableHead>등록일</TableHead>
                        <TableHead>시술일</TableHead>
                        <TableHead>회복 단계</TableHead>
                        <TableHead>복약 상태</TableHead>
                        <TableHead>마지막 업데이트</TableHead>
                        <TableHead className="text-right">작업</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {patients.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                            <p className="text-base font-medium">{activeLabel} 조건에 해당하는 환자가 없습니다.</p>
                          </TableCell>
                        </TableRow>
                      ) : patients.map((patient, index) => (
                        <motion.tr
                          key={patient.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.3 }}
                          className="hover:bg-muted/40 transition-colors cursor-pointer group"
                          onClick={() => navigate(`/patients/${patient.id}`)}
                        >
                          <TableCell className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {patient.name}
                          </TableCell>
                          <TableCell>{patient.procedure ?? "-"}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {patient.createdAt ?? "-"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {patient.date ?? "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-accent/50">
                              {patient.stage ?? "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={patient.medicationStatus === "정상" ? "default" : "destructive"}
                              className={patient.medicationStatus === "정상" ? "bg-teal-500" : ""}
                            >
                              {patient.medicationStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {patient.lastUpdate ?? "-"}
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8">
                                  <MoreVertical className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link to={`/patients/${patient.id}`}>
                                    <Eye className="size-4 mr-2" />
                                    상세 보기
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="size-4 mr-2" />
                                  정보 수정
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Send className="size-4 mr-2" />
                                  링크 재발송
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-muted-foreground">
                    총 <span className="font-semibold text-foreground">{patients.length}명</span>의 환자
                    {statusFilter !== "all-status" && (
                      <span className="ml-2 text-primary font-medium">({activeLabel} 필터 적용 중)</span>
                    )}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
