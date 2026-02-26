/** Company logo paths for badges and setup. Single source of truth. */
export const COMPANY_LOGO_MAP: Record<string, string> = {
  google: "/assets/logos/google.png",
  meta: "/assets/logos/meta.png",
  amazon: "/assets/logos/amazon.svg",
}

type CompanyId = "google" | "meta" | "amazon"

type CompanyInterviewConfig = {
  /** Whether the live interview UI should show worked examples for the problem statement. */
  showExamplesDuringInterview: boolean
}

const DEFAULT_INTERVIEW_CONFIG: CompanyInterviewConfig = {
  showExamplesDuringInterview: true,
}

const COMPANY_INTERVIEW_CONFIG: Record<CompanyId, CompanyInterviewConfig> = {
  google: {
    // Google interviewers typically do not show example IO in the prompt.
    showExamplesDuringInterview: false,
  },
  meta: {
    showExamplesDuringInterview: true,
  },
  amazon: {
    showExamplesDuringInterview: true,
  },
}

export function companyAllowsExamples(companyId?: string): boolean {
  if (!companyId) return DEFAULT_INTERVIEW_CONFIG.showExamplesDuringInterview
  const config = COMPANY_INTERVIEW_CONFIG[companyId as CompanyId]
  return (config ?? DEFAULT_INTERVIEW_CONFIG).showExamplesDuringInterview
}
