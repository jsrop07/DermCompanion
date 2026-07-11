import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Send, Save, User, Pill, Calendar, FileText, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { medicationApi } from "../../api/medicationApi";
import { patientApi } from "../../api/patientApi";
import { procedureApi } from "../../api/procedureApi";
import { recoveryGuideApi } from "../../api/recoveryGuideApi";
import type { RecoveryGuideListItem } from "../../types/recoveryGuide";
import type { MedicationMasterOut } from "../../types/medication";
import type { ProcedureMasterOut } from "../../types/procedure";

// 약물 목록은 API에서 로드

interface Medication {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  purpose: string;
  isCustom: boolean;
}

export function PatientRegistrationPage() {
  const navigate = useNavigate();
  const [commonMedications, setCommonMedications] = useState<MedicationMasterOut[]>([]);
  const [procedures, setProcedures] = useState<ProcedureMasterOut[]>([]);
  const [selectedProcedureName, setSelectedProcedureName] = useState("");
  const [recoveryGuides, setRecoveryGuides] = useState<RecoveryGuideListItem[]>([]);

  const [selectedRecoveryGuideId, setSelectedRecoveryGuideId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([
    { id: 1, name: "", dosage: "", frequency: "", purpose: "", isCustom: true },
  ]);

  // 약물 마스터 로드
  useEffect(() => {
    const loadRegistrationData = async () => {
      try {
        const [medicationData, procedureData, recoveryGuideData] =
          await Promise.all([
            medicationApi.list(),
            procedureApi.list(),
            recoveryGuideApi.list(),
          ]);

        setCommonMedications(medicationData);
        setProcedures(procedureData);
        setRecoveryGuides(recoveryGuideData);
      } catch (error) {
        toast.error("환자 등록에 필요한 데이터를 불러오지 못했습니다.");
        console.error(error);
      }
    };

    loadRegistrationData();
  }, []);

  const addMedication = () => {
    setMedications([
      ...medications,
      { id: Date.now(), name: "", dosage: "", frequency: "", purpose: "", isCustom: true },
    ]);
  };

  const removeMedication = (id: number) => {
    if (medications.length > 1) {
      setMedications(medications.filter((med) => med.id !== id));
    }
  };

  const handleMedicationSelect = (index: number, selectedValue: string) => {
    const newMedications = [...medications];
    if (selectedValue === "custom") {
      newMedications[index] = { ...newMedications[index], name: "", dosage: "", frequency: "", purpose: "", isCustom: true };
    } else {
      const commonMed = commonMedications.find((med) => med.name === selectedValue);
      if (commonMed) {
        newMedications[index] = {
          ...newMedications[index],
          name: commonMed.name,
          dosage: commonMed.default_dosage ?? "",
          frequency: commonMed.default_frequency ?? "",
          purpose: commonMed.purpose ?? "",
          isCustom: false,
        };
      }
    }
    setMedications(newMedications);
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const newMedications = [...medications];
    newMedications[index] = {
      ...newMedications[index],
      [field]: value,
    };
    setMedications(newMedications);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const nameEl = form.querySelector<HTMLInputElement>('#patientName');
    const phoneEl = form.querySelector<HTMLInputElement>('#phone');
    const birthdateEl = form.querySelector<HTMLInputElement>('#birthdate');
    const procedureDateEl = form.querySelector<HTMLInputElement>('#procedureDate');
    const procedureTimeEl = form.querySelector<HTMLInputElement>('#procedureTime');
    const notesEl = form.querySelector<HTMLTextAreaElement>('#notes');
    if (!nameEl?.value || !phoneEl?.value) {
      toast.error("환자명과 휴대폰 번호는 필수입니다.");
      return;
    }
    if (!selectedProcedureName || !procedureDateEl?.value) {
      toast.error("시술명과 시술 날짜는 필수입니다.");
      return;
    }
    if (!selectedRecoveryGuideId) {
      toast.error("회복 가이드 템플릿을 선택해주세요.");
      return;
    }
    try {
      setSubmitting(true);
      const patient = await patientApi.create({
        name: nameEl.value,
        phone: phoneEl.value,
        birthdate: birthdateEl?.value || undefined,
      });
      // 시술 추가
      if (selectedProcedureName && procedureDateEl?.value) {
        await patientApi.addProcedure(patient.id, {
          patient_id: patient.id,
          procedure_name: selectedProcedureName,
          procedure_date: procedureDateEl.value,
          procedure_time: procedureTimeEl?.value || undefined,
          notes: notesEl?.value || undefined,
          recovery_guide_id: Number(selectedRecoveryGuideId),
        });
      }
      // 복약 추가
      for (const med of medications) {
        if (med.name) {
          await patientApi.addMedication(patient.id, {
            medication_name: med.name,
            dosage: med.dosage || undefined,
            frequency: med.frequency || undefined,
            purpose: med.purpose || undefined,
          });
        }
      }
      toast.success("환자가 성공적으로 등록되었습니다!");
      navigate("/patients");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Basic Information */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-5 text-primary" />
                환자 기본 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patientName">환자명 *</Label>
                  <Input
                    id="patientName"
                    placeholder="홍길동"
                    className="bg-input-background border-border"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">휴대폰 번호 *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="010-1234-5678"
                    className="bg-input-background border-border"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthdate">생년월일</Label>
                <Input
                  id="birthdate"
                  type="date"
                  className="bg-input-background border-border"
                />
              </div>
            </CardContent>
          </Card>

          {/* Procedure Information */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                시술 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="procedureName">시술명 *</Label>
                  <Select value={selectedProcedureName} onValueChange={setSelectedProcedureName}>
                    <SelectTrigger className="bg-input-background border-border">
                      <SelectValue placeholder="시술 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {procedures.length === 0 ? (
                        <SelectItem value="__none" disabled>시술 관리에서 먼저 등록해주세요</SelectItem>
                      ) : (
                        procedures.map((proc) => (
                          <SelectItem key={proc.id} value={proc.name}>{proc.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="procedureDate">시술 날짜 *</Label>
                  <Input
                    id="procedureDate"
                    type="date"
                    className="bg-input-background border-border"
                    defaultValue="2026-04-23"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="procedureTime">시술 시간</Label>
                <Input
                  id="procedureTime"
                  type="time"
                  className="bg-input-background border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">시술 노트</Label>
                <Textarea
                  id="notes"
                  placeholder="특이사항이나 주의사항을 입력하세요"
                  className="bg-input-background border-border min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Medication Setup */}
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Pill className="size-5 text-primary" />
                  복약 정보
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMedication}
                  className="border-border"
                >
                  + 약 추가
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {medications.map((med, index) => (
                <motion.div
                  key={med.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="p-4 rounded-lg border border-border bg-muted/30 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm text-foreground">
                      약물 {index + 1}
                    </h4>
                    {medications.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMedication(med.id)}
                        className="size-8 text-muted-foreground hover:text-destructive"
                      >
                        <X className="size-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>약물 선택</Label>
                    <Select
                      value={med.isCustom ? "custom" : med.name}
                      onValueChange={(value) => handleMedicationSelect(index, value)}
                    >
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue placeholder="자주 사용하는 약물 또는 직접 입력" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">직접 입력</SelectItem>
                        {commonMedications.map((commonMed) => (
                          <SelectItem key={commonMed.name} value={commonMed.name}>
                            {commonMed.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>약물명</Label>
                      <Input
                        placeholder="예: 항생제"
                        value={med.name}
                        onChange={(e) => updateMedication(index, "name", e.target.value)}
                        className="bg-background border-border"
                        disabled={!med.isCustom}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>용량</Label>
                      <Input
                        placeholder="예: 500mg"
                        value={med.dosage}
                        onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                        className="bg-background border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>복용 빈도</Label>
                      <Select
                        value={med.frequency}
                        onValueChange={(value) => updateMedication(index, "frequency", value)}
                      >
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue placeholder="선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily-1">1일 1회</SelectItem>
                          <SelectItem value="daily-2">1일 2회</SelectItem>
                          <SelectItem value="daily-3">1일 3회</SelectItem>
                          <SelectItem value="as-needed">필요시</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>목적</Label>
                      <Input
                        placeholder="예: 감염 예방"
                        value={med.purpose}
                        onChange={(e) => updateMedication(index, "purpose", e.target.value)}
                        className="bg-background border-border"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* Recovery Guide Template */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="size-5 text-primary" />
                회복 가이드 템플릿
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recoveryTemplate">템플릿 선택</Label>
                <Select
                  value={selectedRecoveryGuideId}
                  onValueChange={setSelectedRecoveryGuideId}
                >
                  <SelectTrigger
                    id="recoveryTemplate"
                    className="bg-input-background border-border"
                  >
                    <SelectValue placeholder="회복 가이드 템플릿 선택" />
                  </SelectTrigger>

                  <SelectContent>
                    {recoveryGuides.length === 0 ? (
                      <SelectItem value="__none" disabled>
                        등록된 회복 가이드가 없습니다
                      </SelectItem>
                    ) : (
                      recoveryGuides.map((guide) => (
                        <SelectItem
                          key={guide.id}
                          value={String(guide.id)}
                        >
                          {guide.name}
                          {guide.stages > 0 ? ` · ${guide.stages}단계` : ""}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end sticky bottom-0 bg-background/80 backdrop-blur-sm p-4 -mx-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              className="border-border"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-gradient-to-r from-primary to-teal-500 hover:from-primary/90 hover:to-teal-600 gap-2"
            >
              <Save className="size-4" />
              {submitting ? "등록 중..." : "환자 등록"}
            </Button>
            <Button
              type="button"
              className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 gap-2"
            >
              <Send className="size-4" />
              등록 후 SMS 발송
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
