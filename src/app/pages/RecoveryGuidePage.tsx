import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { BookOpen, Plus, Edit, Trash2, Save, Clock, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";
import { recoveryGuideApi } from "../../api/recoveryGuideApi";
import type { RecoveryGuideListItem, RecoveryGuideStepOut } from "../../types/recoveryGuide";

const PRESET_STAGES = [
  { id: "3h", label: "3시간", icon: "⏰" },
  { id: "12h", label: "12시간", icon: "🌙" },
  { id: "24h", label: "24시간 (1일)", icon: "☀️" },
  { id: "48h", label: "48시간 (2일)", icon: "📅" },
  { id: "72h", label: "72시간 (3일)", icon: "📆" },
  { id: "7d", label: "7일 (1주)", icon: "📊" },
  { id: "14d", label: "14일 (2주)", icon: "📈" },
];

const NEW_STEP_ID = "__new__";

export function RecoveryGuidePage() {
  const [templates, setTemplates] = useState<RecoveryGuideListItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [selectedStageId, setSelectedStageId] = useState<string>(NEW_STEP_ID);
  const [steps, setSteps] = useState<RecoveryGuideStepOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingStepId, setDeletingStepId] = useState<number | null>(null);

  const [editingStep, setEditingStep] = useState<{
    time_stage: string;
    title: string;
    precautions: string;
    recommendations: string;
    warning_symptoms: string;
  }>({ time_stage: "", title: "", precautions: "", recommendations: "", warning_symptoms: "" });

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      loadSteps(selectedTemplate);
    } else {
      setSteps([]);
    }
  }, [selectedTemplate]);

  useEffect(() => {
    if (selectedStageId === NEW_STEP_ID) {
      setEditingStep({ time_stage: "", title: "", precautions: "", recommendations: "", warning_symptoms: "" });
      return;
    }
    const step = steps.find((s) => s.time_stage === selectedStageId);
    if (step) {
      setEditingStep({
        time_stage: step.time_stage,
        title: step.title ?? "",
        precautions: step.precautions ?? "",
        recommendations: step.recommendations ?? "",
        warning_symptoms: step.warning_symptoms ?? "",
      });
    } else {
      const preset = PRESET_STAGES.find(t => t.id === selectedStageId);
      setEditingStep({ time_stage: preset ? preset.label : selectedStageId, title: "", precautions: "", recommendations: "", warning_symptoms: "" });
    }
  }, [selectedStageId, steps]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await recoveryGuideApi.list();
      setTemplates(data);
      if (data.length > 0) setSelectedTemplate(data[0].id);
    } catch {
      toast.error("회복 가이드를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const loadSteps = async (guideId: number) => {
    try {
      const data = await recoveryGuideApi.getSteps(guideId);
      setSteps(data);
      if (data.length > 0) {
        setSelectedStageId(data[0].time_stage);
      } else {
        setSelectedStageId(NEW_STEP_ID);
      }
    } catch {
      toast.error("단계를 불러오지 못했습니다.");
    }
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;
    if (!editingStep.time_stage.trim()) {
      toast.error("시간대 / 단계명을 입력해주세요.");
      return;
    }
    try {
      setSaving(true);
      const existingStep = steps.find((s) => s.time_stage === selectedStageId && selectedStageId !== NEW_STEP_ID);
      const sortOrder = steps.length + 1;

      if (existingStep) {
        const updated = await recoveryGuideApi.updateStep(selectedTemplate, existingStep.id, {
          ...editingStep,
          sort_order: sortOrder,
        });
        setSteps(steps.map((s) => (s.id === updated.id ? updated : s)));
        setSelectedStageId(updated.time_stage);
        toast.success("회복 가이드가 저장되었습니다.");
      } else {
        const created = await recoveryGuideApi.addStep(selectedTemplate, {
          ...editingStep,
          sort_order: sortOrder,
        });
        setSteps([...steps, created]);
        setSelectedStageId(created.time_stage);
        setTemplates(templates.map((t) =>
          t.id === selectedTemplate ? { ...t, stages: t.stages + 1 } : t
        ));
        toast.success("새 단계가 추가되었습니다.");
      }
    } catch {
      toast.error("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStep = async () => {
    const step = steps.find(s => s.time_stage === selectedStageId);
    if (!step || !selectedTemplate) return;
    if (!window.confirm(`'${step.time_stage}' 단계를 삭제하시겠습니까?`)) return;
    try {
      setDeletingStepId(step.id);
      // deleteStep API 필요 - 없으면 직접 호출
      await recoveryGuideApi.deleteStep(selectedTemplate, step.id);
      const remaining = steps.filter(s => s.id !== step.id);
      setSteps(remaining);
      setSelectedStageId(remaining.length > 0 ? remaining[0].time_stage : NEW_STEP_ID);
      setTemplates(templates.map((t) =>
        t.id === selectedTemplate ? { ...t, stages: Math.max(0, t.stages - 1) } : t
      ));
      toast.success("단계가 삭제되었습니다.");
    } catch {
      toast.error("단계 삭제에 실패했습니다.");
    } finally {
      setDeletingStepId(null);
    }
  };

  const handleAddNewStep = () => {
    setSelectedStageId(NEW_STEP_ID);
  };

  const handleCreateTemplate = async () => {
    const name = window.prompt("새 템플릿 이름을 입력하세요:");
    if (!name) return;
    try {
      const created = await recoveryGuideApi.create({ name, procedure_type: 'laser' });
      setTemplates([...templates, { id: created.id, name: created.name, procedure_type: created.procedure_type, stages: 0, lastModified: new Date().toISOString().split('T')[0] }]);
      setSelectedTemplate(created.id);
      toast.success("템플릿이 생성되었습니다.");
    } catch {
      toast.error("템플릿 생성에 실패했습니다.");
    }
  };

  const handleEditTemplate = async () => {
    const template = templates.find((t) => t.id === selectedTemplate);
    if (!template) return;
    const name = window.prompt("새 템플릿 이름을 입력하세요:", template.name);
    if (!name || name === template.name) return;
    try {
      await recoveryGuideApi.update(template.id, { name, procedure_type: template.procedure_type });
      setTemplates(templates.map((t) => (t.id === template.id ? { ...t, name } : t)));
      toast.success("템플릿 이름이 변경되었습니다.");
    } catch {
      toast.error("템플릿 이름 변경에 실패했습니다.");
    }
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;
    if (!window.confirm("정말로 이 템플릿을 삭제하시겠습니까?")) return;
    try {
      await recoveryGuideApi.delete(selectedTemplate);
      const filtered = templates.filter((t) => t.id !== selectedTemplate);
      setTemplates(filtered);
      setSelectedTemplate(filtered.length > 0 ? filtered[0].id : null);
      toast.success("템플릿이 삭제되었습니다.");
    } catch {
      toast.error("템플릿 삭제에 실패했습니다.");
    }
  };

  const selectedTemplateName = templates.find((t) => t.id === selectedTemplate)?.name;
  const isNewStep = selectedStageId === NEW_STEP_ID;
  const currentStepHasData = !isNewStep && steps.some(s => s.time_stage === selectedStageId);

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">시술 종류별 회복 가이드 템플릿을 관리합니다</p>
          </div>
          <Button className="gap-2 bg-gradient-to-r from-primary to-teal-500" onClick={handleCreateTemplate}>
            <Plus className="size-4" />
            새 템플릿
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Template List */}
            <Card className="border-border lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">템플릿 목록</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {templates.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">템플릿이 없습니다</p>
                ) : (
                  templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        selectedTemplate === template.id
                          ? "bg-primary/10 border-primary shadow-sm"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <p className="font-semibold text-sm mb-1">{template.name}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{template.stages}개 단계</span>
                        <span>{template.lastModified}</span>
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Template Editor */}
            {selectedTemplate ? (
              <div className="lg:col-span-3 space-y-6">
                <Card className="border-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="size-5 text-primary" />
                        {selectedTemplateName}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-2" onClick={handleEditTemplate}>
                          <Edit className="size-4" />
                          편집
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive" onClick={handleDeleteTemplate}>
                          <Trash2 className="size-4" />
                          삭제
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>템플릿 이름</Label>
                        <Input
                          value={selectedTemplateName ?? ""}
                          readOnly
                          className="bg-input-background border-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>시술 유형</Label>
                        <Select defaultValue={templates.find((t) => t.id === selectedTemplate)?.procedure_type ?? "laser"}>
                          <SelectTrigger className="bg-input-background border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="laser">레이저 시술</SelectItem>
                            <SelectItem value="injection">주사 시술</SelectItem>
                            <SelectItem value="intensive">집중 치료</SelectItem>
                            <SelectItem value="custom">기타</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Time Stages */}
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="size-5 text-primary" />
                      시간대별 가이드
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Stage Tabs */}
                    <div className="flex flex-wrap gap-2">
                      {steps.map((step) => {
                        const preset = PRESET_STAGES.find(t => t.id === step.time_stage);
                        const icon = preset ? preset.icon : "⏳";
                        return (
                          <button
                            key={step.time_stage}
                            onClick={() => setSelectedStageId(step.time_stage)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all relative ${
                              selectedStageId === step.time_stage
                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                : "border-border hover:bg-muted/50 bg-muted/20"
                            }`}
                          >
                            <span>{icon}</span>
                            <span>{step.time_stage}</span>
                            <div className="absolute -top-1 -right-1 size-2 bg-teal-500 rounded-full" />
                          </button>
                        );
                      })}
                      {/* Add new step button */}
                      <button
                        onClick={handleAddNewStep}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all border-dashed ${
                          isNewStep
                            ? "bg-primary/10 border-primary text-primary"
                            : "border-border hover:bg-muted/50 text-muted-foreground"
                        }`}
                      >
                        <Plus className="size-4" />
                        단계 추가
                      </button>
                    </div>

                    {/* Stage Editor */}
                    <div className="p-6 rounded-lg border border-border bg-muted/30 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold flex items-center gap-2 text-base">
                          {isNewStep ? "➕ 새 단계 추가" : `✏️ 단계 편집: ${editingStep.time_stage}`}
                        </h4>
                        {!isNewStep && currentStepHasData && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-destructive border-destructive hover:bg-destructive hover:text-white"
                            onClick={handleDeleteStep}
                            disabled={deletingStepId !== null}
                          >
                            <X className="size-3.5" />
                            이 단계 삭제
                          </Button>
                        )}
                      </div>

                      <div className="space-y-4">
                        {/* Time stage input - always editable */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="font-semibold">시간대 / 단계명 <span className="text-destructive">*</span></Label>
                            <Input
                              value={editingStep.time_stage}
                              onChange={(e) => setEditingStep({ ...editingStep, time_stage: e.target.value })}
                              placeholder="예: 3시간, 12시간, 1일차..."
                              className="bg-background border-border"
                            />
                            {/* Preset shortcuts */}
                            <div className="flex flex-wrap gap-1 mt-1">
                              {PRESET_STAGES.map(p => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => setEditingStep({ ...editingStep, time_stage: p.label })}
                                  className="text-xs px-2 py-0.5 rounded border border-border bg-muted/50 hover:bg-muted hover:text-foreground text-muted-foreground transition-colors"
                                >
                                  {p.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>단계 제목 (선택)</Label>
                            <Input
                              value={editingStep.title}
                              onChange={(e) => setEditingStep({ ...editingStep, title: e.target.value })}
                              placeholder="예: 즉시 케어"
                              className="bg-background border-border"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>주의사항</Label>
                          <Textarea
                            value={editingStep.precautions}
                            onChange={(e) => setEditingStep({ ...editingStep, precautions: e.target.value })}
                            className="min-h-[100px] bg-background border-border"
                            placeholder="- 주의사항을 입력하세요"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>권장사항</Label>
                          <Textarea
                            value={editingStep.recommendations}
                            onChange={(e) => setEditingStep({ ...editingStep, recommendations: e.target.value })}
                            className="min-h-[100px] bg-background border-border"
                            placeholder="- 권장사항을 입력하세요"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>주의 증상</Label>
                          <Textarea
                            value={editingStep.warning_symptoms}
                            onChange={(e) => setEditingStep({ ...editingStep, warning_symptoms: e.target.value })}
                            className="min-h-[80px] bg-background border-border"
                            placeholder="즉시 연락이 필요한 증상..."
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end sticky bottom-0 bg-background/80 backdrop-blur-sm p-4 -mx-4 border-t border-border">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="gap-2 bg-gradient-to-r from-primary to-teal-500 hover:from-primary/90 hover:to-teal-600"
                  >
                    <Save className="size-4" />
                    {saving ? "저장 중..." : isNewStep ? "단계 추가하기" : "변경사항 저장"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="lg:col-span-3 flex items-center justify-center py-24 text-muted-foreground">
                <div className="text-center">
                  <BookOpen className="size-12 mx-auto mb-3 opacity-30" />
                  <p>템플릿을 선택하거나 새로 만들어주세요.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
