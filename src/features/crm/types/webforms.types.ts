export type WebFormStatus = "Draft" | "Published" | "Archived";

export type WebFormMode = "Classic" | "Conversational";

export type WebFormPageTheme = "Minimal" | "HeroBanner" | "Sidebar" | "Gradient" | "FullBleed";
export type WebFormButtonShape = "Rounded" | "Square" | "Pill";
export type WebFormFieldStyle = "Outlined" | "Filled" | "Underlined";
export type WebFormFormWidth = "Narrow" | "Medium" | "Wide";

export const BUTTON_SHAPES: { value: WebFormButtonShape; label: string }[] = [
  { value: "Rounded", label: "Rounded" },
  { value: "Square",   label: "Square" },
  { value: "Pill",     label: "Pill" },
];
export const FIELD_STYLES: { value: WebFormFieldStyle; label: string; description: string }[] = [
  { value: "Outlined",    label: "Outlined",    description: "Bordered input, classic look." },
  { value: "Filled",      label: "Filled",      description: "Soft gray fill, no border." },
  { value: "Underlined", label: "Underlined", description: "Minimal: only a bottom line." },
];
export const FORM_WIDTHS: { value: WebFormFormWidth; label: string; px: string }[] = [
  { value: "Narrow", label: "Narrow", px: "380px" },
  { value: "Medium", label: "Medium", px: "520px" },
  { value: "Wide",   label: "Wide",   px: "760px" },
];

export const WEB_FORM_PAGE_THEMES: { value: WebFormPageTheme; label: string; description: string; preview: string }[] = [
  { value: "Minimal",    label: "Minimal",    description: "Clean centered card on white. The HubSpot Forms default.", preview: "minimal" },
  { value: "HeroBanner",  label: "Hero banner", description: "Full-width header image + form. Travel-booking hero look.", preview: "hero" },
  { value: "Sidebar",    label: "Sidebar",     description: "Brand panel on the left, form on the right. Good for SaaS / quote requests.", preview: "sidebar" },
  { value: "Gradient",   label: "Gradient",    description: "Glass card on a brand-color gradient. Modern agency look.", preview: "gradient" },
  { value: "FullBleed",  label: "Full bleed",  description: "Edge-to-edge hero with a form card overlay. Event / campaign look.", preview: "bleed" },
];

export type WebFormFieldType =
  | "Text"
  | "Email"
  | "Phone"
  | "Textarea"
  | "Number"
  | "Date"
  | "Checkbox"
  | "Select"
  | "File"
  | "Url"
  | "Hidden";

export const CONTACT_FIELD_OPTIONS = [
  { value: "", label: "-- don't map --" },
  { value: "FirstName", label: "First name" },
  { value: "LastName", label: "Last name" },
  { value: "Email", label: "Email" },
  { value: "Phone", label: "Phone" },
  { value: "Company", label: "Company" },
  { value: "JobTitle", label: "Job title" },
  { value: "Message", label: "Message / notes" },
] as const;

export interface WebFormDesignConfig {
  conversationalTitle?: string;
  conversationalSubtitle?: string;
  consentEnabled?: boolean;
  consentLabel?: string;
}

export interface WebFormDto {
  id: string;
  name: string;
  description?: string | null;
  status: WebFormStatus;
  embedCode?: string | null;
  redirectUrl?: string | null;
  successMessage?: string | null;
  fields?: WebFormFieldDto[] | null;
  sendEmailNotification: boolean;
  notificationEmails?: string | null;
  createContactOnSubmit: boolean;
  createLeadOnSubmit: boolean;
  submissionCount: number;
  createdAt: string;
  hostedSlug?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  backgroundColor?: string | null;
  fontFamily?: string | null;
  preFillEnabled?: boolean;
  mode?: WebFormMode;
  designConfig?: WebFormDesignConfig | null;
  designConfigJson?: string | null;
  pageTheme?: WebFormPageTheme;
  hideFormBrandingInPageMode?: boolean;
  buttonShape?: WebFormButtonShape;
  fieldStyle?: WebFormFieldStyle;
  formWidth?: WebFormFormWidth;
  buttonColor?: string | null;
  buttonTextColor?: string | null;
  heroImageUrl?: string | null;
  pageTitle?: string | null;
  pageTagline?: string | null;
  footerText?: string | null;
  footerLinkUrl?: string | null;
  footerLinkLabel?: string | null;
  showPoweredBy?: boolean;
  companyName?: string | null;
  companyContactInfo?: string | null;
  pageBackgroundGradient?: string | null;
}

export interface WebFormFieldDto {
  id: string;
  webFormId: string;
  label: string;
  fieldKey?: string | null;
  fieldType: WebFormFieldType;
  isRequired: boolean;
  placeholder?: string | null;
  optionsJson?: string | null;
  sortOrder: number;
  validationRegex?: string | null;
  mapsToContactField?: string | null;
  columnSpan?: 1 | 2;
}

export interface CreateWebFormFieldRequest {
  label: string;
  fieldKey?: string | null;
  fieldType?: WebFormFieldType;
  isRequired?: boolean;
  placeholder?: string | null;
  optionsJson?: string | null;
  sortOrder?: number;
  validationRegex?: string | null;
  mapsToContactField?: string | null;
}

export interface CreateWebFormRequest {
  name: string;
  description?: string | null;
  redirectUrl?: string | null;
  successMessage?: string | null;
  sendEmailNotification?: boolean;
  notificationEmails?: string | null;
  createContactOnSubmit?: boolean;
  createLeadOnSubmit?: boolean;
  hostedSlug?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  backgroundColor?: string | null;
  fontFamily?: string | null;
  preFillEnabled?: boolean;
  mode?: WebFormMode;
  designConfigJson?: string | null;
  pageTheme?: WebFormPageTheme;
  hideFormBrandingInPageMode?: boolean;
  buttonShape?: WebFormButtonShape;
  fieldStyle?: WebFormFieldStyle;
  formWidth?: WebFormFormWidth;
  buttonColor?: string | null;
  buttonTextColor?: string | null;
  heroImageUrl?: string | null;
  pageTitle?: string | null;
  pageTagline?: string | null;
  footerText?: string | null;
  footerLinkUrl?: string | null;
  footerLinkLabel?: string | null;
  showPoweredBy?: boolean;
  companyName?: string | null;
  companyContactInfo?: string | null;
  pageBackgroundGradient?: string | null;
  fields?: CreateWebFormFieldRequest[] | null;
}

export interface CrmWebFormFilter {
  page?: number;
  pageSize?: number;
  status?: WebFormStatus | "All";
  search?: string;
}

export interface WebFormSubmissionDto {
  id: string;
  webFormId: string;
  dataJson?: string | null;
  submitterIp?: string | null;
  submitterUserAgent?: string | null;
  isSpam: boolean;
  createdContactId?: string | null;
  createdLeadId?: string | null;
  createdAt: string;
}

export interface WebFormSubmissionFilter {
  page?: number;
  pageSize?: number;
  isSpam?: boolean;
}

export interface WebFormSubmissionValueDto {
  id: string;
  submissionId: string;
  fieldId: string;
  fieldKey: string;
  stringValue?: string | null;
  numberValue?: number | null;
  dateValue?: string | null;
  boolValue?: boolean | null;
}

export interface WebFormSubmissionFileDto {
  id: string;
  submissionId: string;
  fieldKey: string;
  blobId: string;
  originalFileName: string;
  contentType: string;
  sizeBytes: number;
}

export interface WebFormSubmissionDetailDto extends WebFormSubmissionDto {
  values: WebFormSubmissionValueDto[];
  files: WebFormSubmissionFileDto[];
}