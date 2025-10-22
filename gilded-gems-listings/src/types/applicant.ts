export type RequiredDocumentsState = {
  passport: boolean;
  eid: boolean;
  visa: boolean;
  salaryConfirmation: boolean;
  bankStatement: boolean;
};

export interface Applicant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  job: string | null;
  address: string | null;
  property_id: string | null;
  created_at: string;
  move_in_date: string | null;
  required_documents: RequiredDocumentsState | null;
}
