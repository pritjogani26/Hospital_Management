// src/types.ts
export interface Doctor {
  doctor_id: number;
  full_name: string;
  gender?: string | null;      // could be name or id depending on backend
  gender_id?: number | null;   // optional if backend returns it
  email?: string | null;
  consultation_fee?: number | string | null;
  qualifications?: string[];   // array of qualification codes like ['MBBS','MD']
  [key: string]: any;
}

export interface Gender {
  gender_id: number;
  gender_value: string;
}

export interface Qualification {
  qualification_id: number;
  qualification_code: string;
  qualification_name: string;
}
