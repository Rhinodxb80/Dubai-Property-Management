export type OwnerDocumentType = "passport" | "eid" | "companyLicense";

export interface OwnerContactDetails {
  name: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
}

export interface OwnerDocumentEntry {
  name: string;
  dataUrl: string;
  uploadedAt: string;
}

export type OwnerDocumentState = Record<OwnerDocumentType, OwnerDocumentEntry | null>;

export interface StoredOwnerData {
  contact: OwnerContactDetails;
  documents: OwnerDocumentState;
}

export const OWNER_DATA_STORAGE_KEY = "adminOwnerContactDetails";

export const OWNER_DOCUMENT_LABELS: Record<OwnerDocumentType, string> = {
  passport: "Passport",
  eid: "Emirates ID",
  companyLicense: "Company License",
};

export const OWNER_DOCUMENT_ACCEPT = {
  "application/pdf": [".pdf"],
  "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp"],
} as const;

export const createEmptyOwnerContact = (): OwnerContactDetails => ({
  name: "",
  email: "",
  phone: "",
  company: "",
  notes: "",
});

export const createEmptyOwnerDocuments = (): OwnerDocumentState => ({
  passport: null,
  eid: null,
  companyLicense: null,
});
