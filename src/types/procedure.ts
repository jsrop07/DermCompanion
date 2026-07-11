export interface ProcedureMasterOut {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface ProcedureMasterCreate {
  name: string;
  description?: string;
}
