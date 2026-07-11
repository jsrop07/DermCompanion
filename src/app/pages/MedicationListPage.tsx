import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Pill, Plus, Edit, Trash2, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { medicationApi } from "../../api/medicationApi";
import type { MedicationMasterOut } from "../../types/medication";

export function MedicationListPage() {
  const [medications, setMedications] = useState<MedicationMasterOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    default_dosage: "",
    default_frequency: "",
    purpose: "",
  });

  const loadMedications = async () => {
    try {
      setLoading(true);
      const data = await medicationApi.list();
      setMedications(data);
    } catch {
      toast.error("약물 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedications();
  }, []);

  const handleEdit = (med: MedicationMasterOut) => {
    setEditingId(med.id);
    setFormData({
      name: med.name,
      default_dosage: med.default_dosage || "",
      default_frequency: med.default_frequency || "",
      purpose: med.purpose || "",
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ name: "", default_dosage: "", default_frequency: "", purpose: "" });
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("약물명을 입력해주세요.");
      return;
    }
    
    try {
      if (editingId) {
        await medicationApi.update(editingId, formData);
        toast.success("약물 정보가 수정되었습니다.");
      } else {
        await medicationApi.create(formData);
        toast.success("새 약물이 등록되었습니다.");
      }
      handleCancel();
      loadMedications();
    } catch {
      toast.error("저장에 실패했습니다.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("정말로 이 약물을 삭제하시겠습니까?")) return;
    try {
      await medicationApi.delete(id);
      toast.success("약물이 삭제되었습니다.");
      loadMedications();
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  };

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
            <h1 className="text-2xl font-bold mb-2">약물 관리</h1>
            <p className="text-muted-foreground">클리닉에서 처방하는 약물 목록을 관리합니다.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-border lg:col-span-1 h-fit sticky top-6">
            <CardHeader>
              <CardTitle>{editingId ? "약물 수정" : "새 약물 등록"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>약물명</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="예: 미노씬 캡슐"
                />
              </div>
              <div className="space-y-2">
                <Label>기본 용량</Label>
                <Input
                  value={formData.default_dosage}
                  onChange={(e) => setFormData({ ...formData, default_dosage: e.target.value })}
                  placeholder="예: 50mg"
                />
              </div>
              <div className="space-y-2">
                <Label>기본 빈도</Label>
                <Input
                  value={formData.default_frequency}
                  onChange={(e) => setFormData({ ...formData, default_frequency: e.target.value })}
                  placeholder="예: 1일 2회"
                />
              </div>
              <div className="space-y-2">
                <Label>목적</Label>
                <Input
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  placeholder="예: 항생제"
                />
              </div>
              
              <div className="pt-4 flex gap-2">
                <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleSave}>
                  <Save className="size-4 mr-2" />
                  저장
                </Button>
                {editingId && (
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="size-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border lg:col-span-2">
            <CardHeader>
              <CardTitle>약물 목록</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : medications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  등록된 약물이 없습니다.
                </div>
              ) : (
                <div className="space-y-4">
                  {medications.map((med) => (
                    <div key={med.id} className="p-4 rounded-lg border border-border bg-card flex items-start justify-between hover:border-primary/50 transition-colors">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Pill className="size-4 text-primary" />
                          <h3 className="font-bold text-lg">{med.name}</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground mt-2">
                          <div><span className="font-medium mr-1">용량:</span>{med.default_dosage || "-"}</div>
                          <div><span className="font-medium mr-1">빈도:</span>{med.default_frequency || "-"}</div>
                          <div><span className="font-medium mr-1">목적:</span>{med.purpose || "-"}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(med)}>
                          <Edit className="size-4 text-muted-foreground hover:text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(med.id)}>
                          <Trash2 className="size-4 text-destructive hover:text-destructive/80" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
