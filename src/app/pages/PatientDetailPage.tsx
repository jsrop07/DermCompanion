import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useParams, Link } from "react-router";
import {
  ArrowLeft,
  User,
  Phone,
  Calendar as CalendarIcon,
  FileText,
  Pill,
  Clock,
  CheckCircle2,
  XCircle,
  Edit,
  Send,
  Save,
  CalendarDays,
  List,
} from "lucide-react";
import { Calendar } from "../components/ui/calendar";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Progress } from "../components/ui/progress";
import { toast } from "sonner";
import { patientApi } from "../../api/patientApi";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import type { PatientDetailOut, PatientMedicationOut, PatientMedicationCreate, MedicationLogOut, StaffNoteOut } from "../../types/patient";

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const patientId = Number(id);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [noteContent, setNoteContent] = useState("");

  const [patient, setPatient] = useState<PatientDetailOut | null>(null);
  const [medications, setMedications] = useState<PatientMedicationOut[]>([]);
  const [medicationLogs, setMedicationLogs] = useState<MedicationLogOut[]>([]);
  const [notes, setNotes] = useState<StaffNoteOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingNote, setSavingNote] = useState(false);

  // Edit patient modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", phone: "", birthdate: "" });

  // Medication modal state
  const [medModalOpen, setMedModalOpen] = useState(false);
  const [editingMedId, setEditingMedId] = useState<number | null>(null);
  const [savingMed, setSavingMed] = useState(false);
  const [medForm, setMedForm] = useState<PatientMedicationCreate>({
    medication_name: "",
    dosage: "",
    frequency: "",
    purpose: "",
  });

  useEffect(() => {
    if (!patientId) return;
    const load = async () => {
      try {
        setLoading(true);
        const [p, meds, logs, ns] = await Promise.all([
          patientApi.get(patientId),
          patientApi.getMedications(patientId),
          patientApi.getMedicationLogs(patientId),
          patientApi.getNotes(patientId),
        ]);
        setPatient(p);
        setMedications(meds);
        setMedicationLogs(logs);
        setNotes(ns);
        if (ns.length > 0) setNoteContent(ns[0].content);
      } catch (e) {
        setError(e instanceof Error ? e.message : "환자 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [patientId]);

  const datesWithRecords = new Set(
    medicationLogs.map((r) => r.scheduled_at.split("T")[0].substring(0, 10))
  );
  const datesWithMissed = new Set(
    medicationLogs.filter((r) => r.status === "missed").map((r) => r.scheduled_at.split("T")[0].substring(0, 10))
  );
  const selectedDateRecords = selectedDate
    ? medicationLogs.filter((r) =>
        r.scheduled_at.startsWith(format(selectedDate, "yyyy-MM-dd"))
      )
    : [];

  const handleSaveNote = async () => {
    if (!noteContent.trim() || !patientId) return;
    try {
      setSavingNote(true);
      const saved = await patientApi.addNote(patientId, { content: noteContent });
      setNotes([saved, ...notes]);
      toast.success("노트가 저장되었습니다.");
    } catch {
      toast.error("노트 저장에 실패했습니다.");
    } finally {
      setSavingNote(false);
    }
  };

  const handleUpdateMedicationStatus = async (status: string) => {
    if (!patientId || !patient) return;
    try {
      await patientApi.update(patientId, { medication_status_override: status });
      setPatient({ ...patient, medication_status: status });
      toast.success(`복약 상태가 '${status}'(으)로 변경되었습니다.`);
    } catch {
      toast.error("복약 상태 변경에 실패했습니다.");
    }
  };

  const handleOpenEdit = () => {
    if (!patient) return;
    setEditForm({
      name: patient.name,
      phone: patient.phone,
      birthdate: patient.birthdate ? String(patient.birthdate) : "",
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editForm.name.trim() || !editForm.phone.trim()) {
      toast.error("환자명과 휴대폰을 입력해주세요.");
      return;
    }
    try {
      setSavingEdit(true);
      const updated = await patientApi.update(patientId, {
        name: editForm.name,
        phone: editForm.phone,
        birthdate: editForm.birthdate || undefined,
      });
      setPatient({ ...patient!, name: updated.name, phone: updated.phone, birthdate: updated.birthdate });
      setEditModalOpen(false);
      toast.success("환자 정보가 수정되었습니다.");
    } catch {
      toast.error("정보 수정에 실패했습니다.");
    } finally {
      setSavingEdit(false);
    }
  };

  const openAddMed = () => {
    setEditingMedId(null);
    setMedForm({ medication_name: "", dosage: "", frequency: "", purpose: "" });
    setMedModalOpen(true);
  };

  const openEditMed = (med: PatientMedicationOut) => {
    setEditingMedId(med.id);
    setMedForm({
      medication_name: med.medication_name,
      dosage: med.dosage || "",
      frequency: med.frequency || "",
      purpose: med.purpose || "",
    });
    setMedModalOpen(true);
  };

  const handleSaveMed = async () => {
    if (!medForm.medication_name.trim()) {
      toast.error("약물명을 입력해주세요.");
      return;
    }
    try {
      setSavingMed(true);
      if (editingMedId) {
        const updated = await patientApi.updateMedication(patientId, editingMedId, medForm);
        setMedications(medications.map(m => m.id === editingMedId ? updated : m));
        toast.success("복약 정보가 수정되었습니다.");
      } else {
        const newMed = await patientApi.addMedication(patientId, medForm);
        setMedications([...medications, newMed]);
        toast.success("약물이 추가되었습니다.");
      }
      setMedModalOpen(false);
    } catch {
      toast.error("저장에 실패했습니다.");
    } finally {
      setSavingMed(false);
    }
  };

  const handleDeleteMed = async (medId: number) => {
    if (!window.confirm("이 약물을 삭제하시겠습니까?")) return;
    try {
      await patientApi.deleteMedication(patientId, medId);
      setMedications(medications.filter(m => m.id !== medId));
      toast.success("약물이 삭제되었습니다.");
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="p-8">
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          {error ?? "환자를 찾을 수 없습니다."}
        </div>
      </div>
    );
  }

  const proc = patient.procedure;
  const recoveryTimeline = [
    { time: "3시간", title: "즉시 케어", status: "completed" },
    { time: "12시간", title: "초기 회복", status: proc?.recovery_stage === "12시간" ? "in-progress" : "pending" },
    { time: "24시간", title: "1일차", status: "pending" },
    { time: "48시간", title: "2일차", status: "pending" },
    { time: "7일", title: "1주차 검진", status: "pending" },
  ];

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        {/* Back Button & Actions */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" asChild className="gap-2">
            <Link to="/patients">
              <ArrowLeft className="size-4" />
              환자 목록으로
            </Link>
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2 border-border hover:bg-primary hover:text-primary-foreground transition-colors" onClick={handleOpenEdit}>
              <Edit className="size-4" />
              정보 수정
            </Button>
            <Button className="gap-2 bg-gradient-to-r from-primary to-teal-500">
              <Send className="size-4" />
              링크 재발송
            </Button>
          </div>
        </div>

        {/* Patient Header */}
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <div className="size-20 rounded-full bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center text-white text-2xl font-bold">
                {patient.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-3xl font-bold text-foreground mb-2">{patient.name}</h2>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <Phone className="size-4" />
                        {patient.phone}
                      </span>
                      {patient.birthdate && (
                        <span className="flex items-center gap-2">
                          <CalendarIcon className="size-4" />
                          생년월일: {patient.birthdate}
                        </span>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Badge
                        variant="default"
                        className={`text-lg px-4 py-2 cursor-pointer hover:opacity-80 transition-opacity ${patient.medication_status === "정상" ? "bg-teal-500" : "bg-destructive"}`}
                      >
                        {patient.medication_status}
                      </Badge>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleUpdateMedicationStatus("정상")}>
                        정상으로 변경
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateMedicationStatus("누락")}>
                        누락으로 변경
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {proc && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-accent/30 border border-border">
                      <p className="text-sm text-muted-foreground mb-1">시술</p>
                      <p className="font-semibold text-foreground">{proc.procedure_name}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-accent/30 border border-border">
                      <p className="text-sm text-muted-foreground mb-1">시술일</p>
                      <p className="font-semibold text-foreground">
                        {proc.procedure_date} {proc.procedure_time ?? ""}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted h-12 p-1">
            <TabsTrigger value="overview" className="text-base font-semibold px-5 h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted-foreground/20 transition-colors">개요</TabsTrigger>
            <TabsTrigger value="medications" className="text-base font-semibold px-5 h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted-foreground/20 transition-colors">복약 정보</TabsTrigger>
            <TabsTrigger value="recovery" className="text-base font-semibold px-5 h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted-foreground/20 transition-colors">회복 진행</TabsTrigger>
            <TabsTrigger value="notes" className="text-base font-semibold px-5 h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted-foreground/20 transition-colors">노트</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recovery Progress */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="size-5 text-primary" />
                    현재 회복 진행
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {proc && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{proc.recovery_stage ?? "-"}</span>
                        <span className="text-sm text-muted-foreground">{proc.recovery_progress}% 완료</span>
                      </div>
                      <Progress value={proc.recovery_progress} className="h-3" />
                    </div>
                  )}
                  <div className="space-y-3 mt-6">
                    {recoveryTimeline.slice(0, 3).map((stage) => (
                      <div
                        key={stage.time}
                        className={`flex gap-3 p-3 rounded-lg border ${
                          stage.status === "completed"
                            ? "bg-teal-50 border-teal-200"
                            : stage.status === "in-progress"
                            ? "bg-blue-50 border-blue-200"
                            : "bg-muted border-border"
                        }`}
                      >
                        <div className="flex-shrink-0">
                          {stage.status === "completed" ? (
                            <CheckCircle2 className="size-5 text-teal-600" />
                          ) : stage.status === "in-progress" ? (
                            <Clock className="size-5 text-blue-600" />
                          ) : (
                            <div className="size-5 rounded-full border-2 border-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{stage.title}</p>
                          <p className="text-xs text-muted-foreground">{stage.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Medication Overview */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="size-5 text-primary" />
                    복약 현황
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {medications.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">처방 약물이 없습니다.</p>
                  ) : (
                    medications.map((med) => (
                      <div key={med.id} className="p-4 rounded-lg border border-border bg-muted/30">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold">{med.medication_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {med.dosage} · {med.frequency}
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-background">
                            {med.adherence}%
                          </Badge>
                        </div>
                        <Progress value={med.adherence} className="h-2" />
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Medication History */}
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>복약 기록</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className={viewMode === "list" ? "bg-primary" : ""}
                    >
                      <List className="size-4 mr-2" />
                      목록
                    </Button>
                    <Button
                      variant={viewMode === "calendar" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("calendar")}
                      className={viewMode === "calendar" ? "bg-primary" : ""}
                    >
                      <CalendarDays className="size-4 mr-2" />
                      달력
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {viewMode === "list" ? (
                  <div className="space-y-3">
                    {medicationLogs.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">복약 기록이 없습니다.</p>
                    ) : (
                      medicationLogs.slice(0, 8).map((record, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20"
                        >
                          <div className="flex items-center gap-3">
                            {record.status === "completed" ? (
                              <CheckCircle2 className="size-5 text-teal-600" />
                            ) : (
                              <XCircle className="size-5 text-destructive" />
                            )}
                            <div>
                              <p className="font-medium">{record.medication_name}</p>
                              <p className="text-sm text-muted-foreground">{record.scheduled_at.replace("T", " ").substring(0, 16)}</p>
                            </div>
                          </div>
                          <Badge
                            variant={record.status === "completed" ? "default" : "destructive"}
                            className={record.status === "completed" ? "bg-teal-500" : ""}
                          >
                            {record.status === "completed" ? "복용 완료" : "누락"}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        locale={ko}
                        className="rounded-lg border border-border"
                        modifiers={{
                          hasRecords: (date) => datesWithRecords.has(format(date, "yyyy-MM-dd")),
                          hasMissed: (date) => datesWithMissed.has(format(date, "yyyy-MM-dd")),
                        }}
                        modifiersStyles={{
                          hasRecords: { backgroundColor: "rgb(20 184 166 / 0.1)", fontWeight: "600" },
                          hasMissed: { backgroundColor: "rgb(239 68 68 / 0.1)", color: "rgb(239 68 68)", fontWeight: "600" },
                        }}
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-4">
                        {selectedDate ? format(selectedDate, "yyyy년 MM월 dd일", { locale: ko }) : "날짜를 선택하세요"}
                      </h4>
                      {selectedDateRecords.length > 0 ? (
                        <div className="space-y-3">
                          {selectedDateRecords.map((record, index) => (
                            <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                              <div className="flex items-center gap-3">
                                {record.status === "completed" ? (
                                  <CheckCircle2 className="size-5 text-teal-600" />
                                ) : (
                                  <XCircle className="size-5 text-destructive" />
                                )}
                                <div>
                                  <p className="font-medium">{record.medication_name}</p>
                                  <p className="text-sm text-muted-foreground">{record.scheduled_at.substring(11, 16)}</p>
                                </div>
                              </div>
                              <Badge variant={record.status === "completed" ? "default" : "destructive"} className={record.status === "completed" ? "bg-teal-500" : ""}>
                                {record.status === "completed" ? "완료" : "누락"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">이 날짜에는 복약 기록이 없습니다.</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medications Tab */}
          <TabsContent value="medications" className="space-y-6">
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>처방 약물 목록</CardTitle>
                  <Button
                    className="gap-2 bg-gradient-to-r from-primary to-teal-500 hover:opacity-90"
                    size="sm"
                    onClick={openAddMed}
                  >
                    <Edit className="size-4" />
                    약물 추가
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {medications.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">처방 약물이 없습니다.</p>
                ) : (
                  medications.map((med) => (
                    <div key={med.id} className="p-5 rounded-lg border border-border bg-muted/20 group">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div><p className="text-sm text-muted-foreground mb-1">약물명</p><p className="font-semibold">{med.medication_name}</p></div>
                        <div><p className="text-sm text-muted-foreground mb-1">용량</p><p className="font-semibold">{med.dosage ?? "-"}</p></div>
                        <div><p className="text-sm text-muted-foreground mb-1">복용 빈도</p><p className="font-semibold">{med.frequency ?? "-"}</p></div>
                        <div><p className="text-sm text-muted-foreground mb-1">목적</p><p className="font-semibold">{med.purpose ?? "-"}</p></div>
                      </div>
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-muted-foreground">복약 순응도</span>
                          <span className="text-sm font-medium">{med.adherence}%</span>
                        </div>
                        <Progress value={med.adherence} className="h-2" />
                      </div>
                      <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="outline" size="sm" className="gap-1" onClick={() => openEditMed(med)}>
                          <Edit className="size-3" />
                          편집
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 text-destructive border-destructive hover:bg-destructive hover:text-white"
                          onClick={() => handleDeleteMed(med.id)}
                        >
                          <XCircle className="size-3" />
                          삭제
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medication Add/Edit Dialog */}
          <Dialog open={medModalOpen} onOpenChange={setMedModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingMedId ? "약물 수정" : "약물 추가"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>약물명</Label>
                  <Input
                    value={medForm.medication_name}
                    onChange={(e) => setMedForm({ ...medForm, medication_name: e.target.value })}
                    placeholder="예: 미노씬 캡슐"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>용량</Label>
                    <Input
                      value={medForm.dosage || ""}
                      onChange={(e) => setMedForm({ ...medForm, dosage: e.target.value })}
                      placeholder="예: 50mg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>빈도</Label>
                    <Input
                      value={medForm.frequency || ""}
                      onChange={(e) => setMedForm({ ...medForm, frequency: e.target.value })}
                      placeholder="예: 1일 2회"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>목적</Label>
                  <Input
                    value={medForm.purpose || ""}
                    onChange={(e) => setMedForm({ ...medForm, purpose: e.target.value })}
                    placeholder="예: 항생제"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setMedModalOpen(false)}>취소</Button>
                <Button
                  className="bg-gradient-to-r from-primary to-teal-500"
                  onClick={handleSaveMed}
                  disabled={savingMed}
                >
                  {savingMed ? "저장 중..." : "저장"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Recovery Tab */}
          <TabsContent value="recovery" className="space-y-6">
            <Card className="border-border">
              <CardHeader><CardTitle>회복 타임라인</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {recoveryTimeline.map((stage, index) => (
                    <div key={stage.time} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`size-10 rounded-full flex items-center justify-center ${
                          stage.status === "completed" ? "bg-teal-100 text-teal-600"
                          : stage.status === "in-progress" ? "bg-blue-100 text-blue-600"
                          : "bg-muted text-muted-foreground"
                        }`}>
                          {stage.status === "completed" ? <CheckCircle2 className="size-5" />
                            : stage.status === "in-progress" ? <Clock className="size-5" />
                            : <span className="text-sm font-semibold">{index + 1}</span>}
                        </div>
                        {index < recoveryTimeline.length - 1 && <div className="w-0.5 h-16 bg-border mt-2" />}
                      </div>
                      <div className="flex-1 pb-8">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold">{stage.title}</h4>
                          <Badge variant="outline" className="text-xs">{stage.time}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="size-5 text-primary" />
                  내부 노트
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="환자에 대한 특이사항이나 메모를 입력하세요..."
                  className="min-h-[200px] bg-input-background border-border"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                />
                <Button
                  className="gap-2 bg-gradient-to-r from-primary to-teal-500"
                  onClick={handleSaveNote}
                  disabled={savingNote}
                >
                  <Save className="size-4" />
                  {savingNote ? "저장 중..." : "노트 저장"}
                </Button>
                {notes.length > 0 && (
                  <div className="space-y-3 mt-4">
                    <p className="text-sm font-medium text-muted-foreground">이전 노트</p>
                    {notes.slice(1).map((note) => (
                      <div key={note.id} className="p-3 rounded-lg bg-muted/30 border border-border">
                        <p className="text-sm">{note.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">{note.created_at.substring(0, 16).replace("T", " ")}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Patient Edit Dialog */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>환자 정보 수정</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>환자명</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="홍길동"
                />
              </div>
              <div className="space-y-2">
                <Label>휴대폰 번호</Label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="010-1234-5678"
                />
              </div>
              <div className="space-y-2">
                <Label>생년월일 (선택)</Label>
                <Input
                  type="date"
                  value={editForm.birthdate}
                  onChange={(e) => setEditForm({ ...editForm, birthdate: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditModalOpen(false)}>취소</Button>
              <Button
                className="bg-gradient-to-r from-primary to-teal-500"
                onClick={handleSaveEdit}
                disabled={savingEdit}
              >
                {savingEdit ? "저장 중..." : "저장"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
