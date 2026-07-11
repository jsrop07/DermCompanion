import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Scissors, Plus, Edit, Trash2, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";
import { procedureApi } from "../../api/procedureApi";
import type { ProcedureMasterOut } from "../../types/procedure";

export function ProcedureListPage() {
  const [procedures, setProcedures] = useState<ProcedureMasterOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const loadProcedures = async () => {
    try {
      setLoading(true);
      const data = await procedureApi.list();
      setProcedures(data);
    } catch {
      toast.error("시술 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProcedures();
  }, []);

  const handleEdit = (proc: ProcedureMasterOut) => {
    setEditingId(proc.id);
    setFormData({
      name: proc.name,
      description: proc.description || "",
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ name: "", description: "" });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("시술명을 입력해주세요.");
      return;
    }

    try {
      if (editingId) {
        await procedureApi.update(editingId, formData);
        toast.success("시술 정보가 수정되었습니다.");
      } else {
        await procedureApi.create(formData);
        toast.success("새 시술이 등록되었습니다.");
      }
      handleCancel();
      loadProcedures();
    } catch {
      toast.error("저장에 실패했습니다.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("정말로 이 시술을 삭제하시겠습니까?")) return;
    try {
      await procedureApi.delete(id);
      toast.success("시술이 삭제되었습니다.");
      loadProcedures();
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
            <h1 className="text-2xl font-bold mb-2">시술 관리</h1>
            <p className="text-muted-foreground">클리닉에서 제공하는 시술 종류를 등록하고 관리합니다.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <Card className="border-border lg:col-span-1 h-fit sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scissors className="size-5 text-primary" />
                {editingId ? "시술 수정" : "새 시술 등록"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>시술명</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="예: 레이저 토닝, 보톡스"
                  className="bg-input-background border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>설명 (선택)</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="시술에 대한 간략한 설명을 입력하세요."
                  className="min-h-[100px] bg-input-background border-border resize-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <Button
                  className="flex-1 bg-gradient-to-r from-primary to-teal-500 hover:opacity-90"
                  onClick={handleSave}
                >
                  <Save className="size-4 mr-2" />
                  저장
                </Button>
                {editingId && (
                  <Button variant="outline" size="icon" onClick={handleCancel}>
                    <X className="size-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* List */}
          <Card className="border-border lg:col-span-2">
            <CardHeader>
              <CardTitle>시술 목록</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : procedures.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Scissors className="size-12 mx-auto mb-3 opacity-30" />
                  <p>등록된 시술이 없습니다.</p>
                  <p className="text-sm mt-1">좌측 양식에서 시술을 등록해주세요.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {procedures.map((proc, index) => (
                    <motion.div
                      key={proc.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-lg border transition-all ${
                        editingId === proc.id
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Scissors className="size-4 text-primary flex-shrink-0" />
                            <h3 className="font-bold text-base truncate">{proc.name}</h3>
                          </div>
                          {proc.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {proc.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => handleEdit(proc)}
                          >
                            <Edit className="size-4 text-muted-foreground hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => handleDelete(proc.id)}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
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
