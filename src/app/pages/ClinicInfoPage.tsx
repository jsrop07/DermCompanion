import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Building2, Phone, MapPin, Clock, Save, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";
import { clinicApi } from "../../api/clinicApi";
import type { ClinicInfoOut, ClinicInfoUpdate } from "../../types/clinic";

export function ClinicInfoPage() {
  const [clinic, setClinic] = useState<ClinicInfoOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // form state
  const [form, setForm] = useState<ClinicInfoUpdate>({
    name: "",
    phone: "",
    email: "",
    address: "",
    detail_address: "",
    weekday_hours: "",
    saturday_hours: "",
    closed_days: "",
    lunch_hours: "",
    notice: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await clinicApi.get();
        setClinic(data);
        setForm({
          name: data.name,
          phone: data.phone ?? "",
          email: data.email ?? "",
          address: data.address ?? "",
          detail_address: data.detail_address ?? "",
          weekday_hours: data.weekday_hours ?? "",
          saturday_hours: data.saturday_hours ?? "",
          closed_days: data.closed_days ?? "",
          lunch_hours: data.lunch_hours ?? "",
          notice: data.notice ?? "",
        });
      } catch {
        // 클리닉 정보가 없으면 기본값 유지
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const updated = await clinicApi.update(form);
      setClinic(updated);
      toast.success("클리닉 정보가 저장되었습니다.");
    } catch {
      toast.error("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const update = (field: keyof ClinicInfoUpdate, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        <form onSubmit={handleSave} className="space-y-6">
          {/* Basic Information */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="size-5 text-primary" />
                기본 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clinicName">클리닉 이름 *</Label>
                <Input
                  id="clinicName"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  className="bg-input-background border-border"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">대표 전화번호 *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      className="pl-10 bg-input-background border-border"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    className="bg-input-background border-border"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">주소 *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input
                    id="address"
                    value={form.address}
                    onChange={(e) => update("address", e.target.value)}
                    className="pl-10 bg-input-background border-border"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="detailAddress">상세 주소</Label>
                <Input
                  id="detailAddress"
                  value={form.detail_address}
                  onChange={(e) => update("detail_address", e.target.value)}
                  className="bg-input-background border-border"
                />
              </div>
            </CardContent>
          </Card>

          {/* Business Hours */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="size-5 text-primary" />
                운영 시간
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weekdayHours">평일</Label>
                  <Input
                    id="weekdayHours"
                    value={form.weekday_hours}
                    onChange={(e) => update("weekday_hours", e.target.value)}
                    className="bg-input-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="saturdayHours">토요일</Label>
                  <Input
                    id="saturdayHours"
                    value={form.saturday_hours}
                    onChange={(e) => update("saturday_hours", e.target.value)}
                    className="bg-input-background border-border"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="closedDays">휴진일</Label>
                <Input
                  id="closedDays"
                  value={form.closed_days}
                  onChange={(e) => update("closed_days", e.target.value)}
                  className="bg-input-background border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lunchHours">점심 시간</Label>
                <Input
                  id="lunchHours"
                  value={form.lunch_hours}
                  onChange={(e) => update("lunch_hours", e.target.value)}
                  className="bg-input-background border-border"
                />
              </div>
            </CardContent>
          </Card>

          {/* Notice */}
          <Card className="border-border">
            <CardHeader><CardTitle>안내사항</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notice">환자 안내 문구</Label>
                <Textarea
                  id="notice"
                  value={form.notice}
                  onChange={(e) => update("notice", e.target.value)}
                  className="min-h-[120px] bg-input-background border-border"
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          {clinic && (
            <Card className="border-border bg-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="size-5 text-primary" />
                  환자용 화면 미리보기
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-6 rounded-lg bg-white border-2 border-primary/20 shadow-lg">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-4 border-b border-border">
                      <div className="size-12 rounded-lg bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center">
                        <Building2 className="size-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-foreground">{form.name}</h3>
                        <p className="text-sm text-muted-foreground">피부과 전문 클리닉</p>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-3">
                        <Phone className="size-4 text-primary mt-0.5 flex-shrink-0" />
                        <div><p className="text-muted-foreground">전화</p><p className="font-medium">{form.phone}</p></div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="size-4 text-primary mt-0.5 flex-shrink-0" />
                        <div><p className="text-muted-foreground">주소</p><p className="font-medium">{form.address}<br />{form.detail_address}</p></div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Clock className="size-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-muted-foreground">운영시간</p>
                          <p className="font-medium">
                            평일 {form.weekday_hours}<br />
                            토요일 {form.saturday_hours}<br />
                            점심시간 {form.lunch_hours}
                          </p>
                        </div>
                      </div>
                    </div>
                    {form.notice && (
                      <div className="pt-4 border-t border-border">
                        <p className="text-sm text-muted-foreground">{form.notice}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end sticky bottom-0 bg-background/80 backdrop-blur-sm p-4 -mx-4 border-t border-border">
            <Button type="button" variant="outline" className="border-border">
              취소
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="gap-2 bg-gradient-to-r from-primary to-teal-500 hover:from-primary/90 hover:to-teal-600"
            >
              <Save className="size-4" />
              {saving ? "저장 중..." : "저장"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
