export interface ClinicInfoOut {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  detail_address?: string;
  weekday_hours?: string;
  saturday_hours?: string;
  closed_days?: string;
  lunch_hours?: string;
  notice?: string;
}

export interface ClinicInfoUpdate {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  detail_address?: string;
  weekday_hours?: string;
  saturday_hours?: string;
  closed_days?: string;
  lunch_hours?: string;
  notice?: string;
}
