import { apiClient } from "./client";
import type { ClinicInfoOut, ClinicInfoUpdate } from "../types/clinic";

export const clinicApi = {
  get: () => apiClient.get<ClinicInfoOut>("/clinic"),
  update: (data: ClinicInfoUpdate) => apiClient.put<ClinicInfoOut>("/clinic", data),
};
