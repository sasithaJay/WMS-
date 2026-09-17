import {
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";

import {
  ChevronLeft,
  ChevronRight,
  Check,
  User,
  Building2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  LockKeyhole,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from "lucide-react";

import { LanguageToggle } from "../components/common/LanguageToggle";

import {
  getRegistrationOptions,
  getSections,
  register,
} from "../../services/authService";

import { t } from "../constants/translations";

import type { Lang } from "../types";

import type {
  Institution,
  InstitutionType,
  RegistrationDivision,
  RegistrationRole,
  RegistrationSection,
} from "../types/auth";

type FrontendAccountType =
  | "staff"
  | "institution";

type FormState = Record<string, string>;

const SECTIONLESS_ROLES = [
  "ASSISTANT_COMMISSIONER",
  "ASSISTANT_DIRECTOR",
  "ADMINISTRATIVE_OFFICER",
  "ACCOUNTANT",
] as const;

export function RegisterPage({
  lang,
  setLang,
  onBack,
}: {
  lang: Lang;
  setLang: (lang: Lang) => void;
  onBack: () => void;
}) {
  // registration steps
  const [step, setStep] = useState(0);

  // main registration form state
  const [divisionId, setDivisionId] = useState<number | null>(null);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [accountType, setAccountType] = useState<FrontendAccountType | null>(null);
  const [form, setForm] = useState<FormState>({});

  // backend registration options
  const [divisions, setDivisions] = useState<RegistrationDivision[]>([]);
  const [roles, setRoles] = useState<RegistrationRole[]>([]);
  const [sections, setSections] = useState<RegistrationSection[]>([]);
  const [institutionTypes, setInstitutionTypes] = useState<InstitutionType[]>([]);

  // UI state
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingSections, setLoadingSections] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // step titles
  const steps = [
    t(lang, "Division", "කොට්ඨාශය"),
    t(lang, "Account Type", "ගිණුම් වර්ගය"),
    t(lang, "Details", "විස්තර"),
    t(lang, "Credentials", "අක්තපත්‍ර"),
  ];

  // selected role
  const selectedRole = useMemo(
    () => roles.find((role) => role.id === Number(form.roleId)),
    [roles, form.roleId],
  );

  const selectedDivision = useMemo(
    () => divisions.find((division) => division.id === divisionId),
    [divisions, divisionId],
  );

  // Whether Selected Staff Role Requires Section
  const requiresSection =
    accountType === "staff" &&
    selectedRole !== undefined &&
    !SECTIONLESS_ROLES.includes(
      selectedRole.code as (typeof SECTIONLESS_ROLES)[number],
    );

  const isStoreKeeper = selectedRole?.code === "STORE_KEEPER";

  useEffect(() => {
    if (selectedRole?.code !== "STORE_KEEPER") {
      return;
    }

    if (!selectedDivision || sections.length === 0) {
      return;
    }

    let targetSection;

    if (selectedDivision.code === "SOCIAL_SERVICES") {
      targetSection = sections.find(
        (section) => section.code === "SOCIAL_ACCOUNTS",
      );
    } else if (selectedDivision.code === "CHILD_SERVICES") {
      targetSection = sections.find(
        (section) => section.code === "CHILD_INSTITUTE",
      );
    }

    if (targetSection) {
      updateField("sectionId", targetSection.id.toString());
    }
  }, [selectedRole, selectedDivision, sections]);

  // Load Registration Options
  useEffect(() => {
    const loadRegistrationOptions = async () => {
      try {
        setLoadingOptions(true);
        setError("");

        const data = await getRegistrationOptions();

        setDivisions(data.divisions);
        setInstitutions(data.institutions);
        setRoles(data.roles);
        setInstitutionTypes(data.institution_types);
      } catch {
        setError(
          t(
            lang,
            "Could not load registration options.",
            "ලියාපදිංචි විකල්ප පූරණය කළ නොහැක.",
          ),
        );
      } fontFinally: {
        setLoadingOptions(false);
      }
    };

    void loadRegistrationOptions();
  }, [lang]);

  const filteredInstitutions = useMemo(
    () => institutions.filter((inst) => inst.division_id === divisionId),
    [institutions, divisionId],
  );

  const selectedInstitution = useMemo(
    () => institutions.find((inst) => inst.id === Number(form.institutionId)),
    [institutions, form.institutionId],
  );

  // Load Sections When Division Changes
  useEffect(() => {
    if (!divisionId) {
      setSections([]);
      setForm((current) => ({
        ...current,
        sectionId: "",
      }));
      return;
    }

    const loadSections = async () => {
      try {
        setLoadingSections(true);
        setError("");

        const data = await getSections(divisionId);

        setSections(data);
        setForm((current) => ({
          ...current,
          sectionId: "",
        }));
      } catch {
        setSections([]);
        setError(
          t(
            lang,
            "Could not load sections.",
            "අංශ පූරණය කළ නොහැක.",
          ),
        );
      } finally {
        setLoadingSections(false);
      }
    };

    void loadSections();
  }, [divisionId, lang]);

  // Update Form Field
  const updateField = (key: string, value: string) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  // Reusable Form Input Field
  const renderInputField = (
    key: string,
    label: string,
    labelSi: string,
    type = "text",
    placeholder = "",
    placeholderSi = "",
  ) => (
    <div>
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
        {t(lang, label, labelSi)}
      </label>

      <input
        type={type}
        value={form[key] || ""}
        onChange={(event) => updateField(key, event.target.value)}
        placeholder={t(
          lang,
          placeholder || label,
          placeholderSi || labelSi,
        )}
        className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-white placeholder:text-slate-700 outline-none transition-all duration-200 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
      />
    </div>
  );

  // Step Validation
  const validateCurrentStep = (): boolean => {
    setError("");

    if (step === 0) {
      if (!divisionId) {
        setError(
          t(
            lang,
            "Please select a division.",
            "කරුණාකර කොට්ඨාශයක් තෝරන්න.",
          ),
        );
        return false;
      }
    }

    if (step === 1) {
      if (!accountType) {
        setError(
          t(
            lang,
            "Please select an account type.",
            "කරුණාකර ගිණුම් වර්ගයක් තෝරන්න.",
          ),
        );
        return false;
      }
    }

    if (step === 2) {
      if (accountType === "staff") {
        if (
          !form.fullName ||
          !form.nic ||
          !form.email ||
          !form.phone ||
          !form.roleId ||
          !form.empId ||
          !form.salaryNumber
        ) {
          setError(
            t(
              lang,
              "Please complete all required staff details.",
              "කරුණාකර අවශ්‍ය සියලු කාර්ය මණ්ඩල විස්තර සම්පූර්ණ කරන්න.",
            ),
          );
          return false;
        }

        if (requiresSection && !form.sectionId) {
          setError(
            t(
              lang,
              "Please select a section.",
              "කරුණාකර අංශයක් තෝරන්න.",
            ),
          );
          return false;
        }
      }

      if (accountType === "institution") {
        if (
          !form.institutionId ||
          !form.institutionTypeId ||
          !form.address ||
          !form.contact ||
          !form.cpName ||
          !form.cpDesig ||
          !form.cpNic ||
          !form.cpPhone ||
          !form.cpEmail
        ) {
          setError(
            t(
              lang,
              "Please complete all required institution details.",
              "කරුණාකර අවශ්‍ය සියලු ආයතන විස්තර සම්පූර්ණ කරන්න.",
            ),
          );
          return false;
        }
      }
    }

    if (step === 3) {
      const hasUsername =
        accountType === "staff" ? !!form.salaryNumber : !!form.username;

      if (!hasUsername || !form.password || !form.confirmPassword) {
        setError(
          t(
            lang,
            "Please complete all credential fields.",
            "කරුණාකර සියලු අක්තපත්‍ර ක්ෂේත්‍ර සම්පූර්ණ කරන්න.",
          ),
        );
        return false;
      }

      if (form.password !== form.confirmPassword) {
        setError(
          t(
            lang,
            "Passwords do not match.",
            "මුරපද දෙක එකිනෙකට නොගැලපේ.",
          ),
        );
        return false;
      }
    }

    return true;
  };

  const handleContinue = () => {
    if (!validateCurrentStep()) {
      return;
    }
    setStep((current) => Math.min(3, current + 1));
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep() || !divisionId || !accountType) {
      return;
    }

    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      let payload: Record<string, unknown>;

      if (accountType === "staff") {
        payload = {
          account_type: "STAFF",
          username: `SWPCS-${form.salaryNumber}`,
          email: form.email,
          password: form.password,
          password_confirmation: form.confirmPassword,
          division_id: divisionId,
          role_id: Number(form.roleId),
          full_name: form.fullName,
          nic_number: form.nic,
          phone: form.phone,
          employee_number: form.empId,
          salary_number: form.salaryNumber,
          ...(requiresSection ? { section_id: Number(form.sectionId) } : {}),
        };
      } else {
        payload = {
          account_type: "INSTITUTION",
          username: form.username,
          email: form.cpEmail,
          password: form.password,
          password_confirmation: form.confirmPassword,
          institution_id: Number(form.institutionId),
          institution_type_id: Number(form.institutionTypeId),
          address: form.address,
          contact_number: form.contact,
          contact_person_name: form.cpName,
          contact_person_designation: form.cpDesig,
          contact_person_nic: form.cpNic,
          contact_person_phone: form.cpPhone,
          contact_person_email: form.cpEmail,
        };
      }

      const data = await register(payload);

      setSuccess(data.message);
      setForm({});
      setDivisionId(null);
      setAccountType(null);
      setSections([]);
      setStep(0);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const responseData = error.response?.data;

        if (responseData?.errors) {
          const validationMessages = Object.values(responseData.errors).flat();
          const firstMessage = validationMessages.find(
            (message) => typeof message === "string",
          );

          setError(
            typeof firstMessage === "string"
              ? firstMessage
              : t(lang, "Registration failed.", "ලියාපදිංචිය අසාර්ථකයි."),
          );
        } else {
          setError(
            responseData?.message ??
              t(lang, "Registration failed.", "ලියාපදිංචිය අසාර්ථකයි."),
          );
        }
      } else {
        setError(
          t(lang, "An unexpected error occurred.", "අනපේක්ෂිත දෝෂයක් ඇතිවිය."),
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingOptions) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-slate-300">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <p className="text-sm font-medium">
          {t(
            lang,
            "Loading registration options...",
            "ලියාපදිංචි විකල්ප පූරණය වෙමින්...",
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white antialiased">
      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[140px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[140px]" />
      </div>

      {/* Header */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6 sm:px-10">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {t(lang, "Back to Login", "ලොගින් වෙත ආපසු")}
        </button>

        <LanguageToggle lang={lang} setLang={setLang} />
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full relative z-10 flex flex-col justify-center">
        {/* Page Heading */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-3 shadow-lg">
            <Building2 className="w-6 h-6" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {t(lang, "Create your account", "ඔබගේ ගිණුම සාදන්න")}
          </h1>

          <p className="mt-1.5 text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            {t(
              lang,
              "Complete the registration process to access the Warehouse Management System.",
              "ගබඩා කළමනාකරණ පද්ධතියට ප්‍රවේශ වීමට ලියාපදිංචි වීම සම්පූර්ණ කරන්න.",
            )}
          </p>
        </div>

        {/* Main Form Container */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl">
          {/* Progress Stepper Bar */}
          <div className="p-6 sm:p-8 border-b border-slate-800 bg-slate-950/40">
            <div className="grid grid-cols-4 gap-2 relative">
              {steps.map((stepLabel, index) => {
                const completed = index < step;
                const active = index === step;

                return (
                  <div key={stepLabel} className="flex flex-col items-center">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                        completed
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : active
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-4 ring-blue-500/10"
                            : "bg-slate-800 text-slate-500 border border-slate-700/50"
                      }`}
                    >
                      {completed ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        index + 1
                      )}
                    </div>

                    <span
                      className={`mt-2 text-[11px] font-semibold text-center hidden sm:block ${
                        active
                          ? "text-blue-400"
                          : completed
                            ? "text-emerald-400"
                            : "text-slate-500"
                      }`}
                    >
                      {stepLabel}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Progress Bar Line */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-[11px] font-semibold mb-1.5">
                <span className="text-slate-400">
                  {t(
                    lang,
                    `Step ${step + 1} of 4`,
                    `පියවර ${step + 1} / 4`,
                  )}
                </span>
                <span className="text-blue-400">
                  {Math.round(((step + 1) / 4) * 100)}%
                </span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${((step + 1) / 4) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Dynamic Form Content */}
          <div className="p-6 sm:p-8">
            {/* STEP 1: DIVISION */}
            {step === 0 && (
              <div className="animate-in fade-in duration-300">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-white">
                    {t(lang, "Select your division", "ඔබගේ කොට්ඨාශය තෝරන්න")}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {t(
                      lang,
                      "Choose the division associated with your account.",
                      "ඔබගේ ගිණුමට අදාළ කොට්ඨාශය තෝරන්න.",
                    )}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {divisions.map((division) => {
                    const selected = divisionId === division.id;

                    return (
                      <button
                        key={division.id}
                        type="button"
                        onClick={() => {
                          setDivisionId(division.id);
                          setForm((current) => ({
                            ...current,
                            institutionId: "",
                          }));
                        }}
                        className={`group p-5 rounded-2xl border text-left transition-all duration-200 flex items-center gap-4 ${
                          selected
                            ? "border-blue-500 bg-blue-500/10 shadow-lg ring-1 ring-blue-500/20"
                            : "border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-800/40"
                        }`}
                      >
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                            selected
                              ? "bg-blue-600 text-white"
                              : "bg-slate-800 text-slate-400 group-hover:text-slate-200"
                          }`}
                        >
                          <Building2 className="w-5 h-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-white truncate">
                            {lang === "en"
                              ? division.name_en
                              : division.name_si}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {t(
                              lang,
                              "Government Division",
                              "රාජ්‍ය කොට්ඨාශය",
                            )}
                          </p>
                        </div>

                        {selected && (
                          <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2: ACCOUNT TYPE */}
            {step === 1 && (
              <div className="animate-in fade-in duration-300">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-white">
                    {t(lang, "Choose account type", "ගිණුම් වර්ගය තෝරන්න")}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {t(
                      lang,
                      "Select the type of account you want to register.",
                      "ඔබ ලියාපදිංචි කිරීමට අවශ්‍ය ගිණුම් වර්ගය තෝරන්න.",
                    )}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    {
                      id: "staff" as const,
                      icon: <User className="w-5 h-5" />,
                      title: t(
                        lang,
                        "Staff Member",
                        "කාර්ය මණ්ඩල සාමාජිකයා",
                      ),
                      desc: t(
                        lang,
                        "For department officers and employees.",
                        "දෙපාර්තමේන්තු නිලධාරීන් සහ සේවකයින් සඳහා.",
                      ),
                    },
                    {
                      id: "institution" as const,
                      icon: <Building2 className="w-5 h-5" />,
                      title: t(lang, "Institution", "ආයතනය"),
                      desc: t(
                        lang,
                        "For registered institutions.",
                        "ලියාපදිංචි ආයතන සඳහා.",
                      ),
                    },
                  ].map((account) => {
                    const selected = accountType === account.id;

                    return (
                      <button
                        key={account.id}
                        type="button"
                        onClick={() => setAccountType(account.id)}
                        className={`group p-5 rounded-2xl border text-left transition-all duration-200 flex items-start gap-4 ${
                          selected
                            ? "border-blue-500 bg-blue-500/10 shadow-lg ring-1 ring-blue-500/20"
                            : "border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-800/40"
                        }`}
                      >
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                            selected
                              ? "bg-blue-600 text-white"
                              : "bg-slate-800 text-slate-400 group-hover:text-slate-200"
                          }`}
                        >
                          {account.icon}
                        </div>

                        <div className="flex-1">
                          <p className="font-semibold text-sm text-white">
                            {account.title}
                          </p>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            {account.desc}
                          </p>
                        </div>

                        {selected && (
                          <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {accountType === "institution" && (
                  <div className="mt-5 flex gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed">
                      {t(
                        lang,
                        "Institution office requests must be recommended by the Administrative Officer.",
                        "ආයතන ඉල්ලීම් පරිපාලන නිලධාරී විසින් නිර්දේශ කළ යුතුය.",
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: DETAILS */}
            {step === 2 && (
              <div className="animate-in fade-in duration-300">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-white">
                    {t(lang, "Enter your details", "ඔබගේ විස්තර ඇතුළත් කරන්න")}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {t(
                      lang,
                      "Provide the required information for your account.",
                      "ඔබගේ ගිණුම සඳහා අවශ්‍ය තොරතුරු ලබා දෙන්න.",
                    )}
                  </p>
                </div>

                <div className="space-y-4">
                  {/* STAFF DETAILS */}
                  {accountType === "staff" && (
                    <>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {renderInputField(
                          "fullName",
                          "Full Name",
                          "සම්පූර්ණ නම",
                        )}
                        {renderInputField(
                          "nic",
                          "NIC Number",
                          "ජාතික හැඳුනුම්පත් අංකය",
                        )}
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        {renderInputField(
                          "email",
                          "Email",
                          "විද්‍යුත් තැපෑල",
                          "email",
                        )}
                        {renderInputField(
                          "phone",
                          "Phone",
                          "දුරකථනය",
                          "tel",
                        )}
                      </div>

                      {/* Job Role Selection */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          {t(lang, "Job Role", "රැකියා කාර්යභාරය")}
                        </label>
                        <select
                          value={form.roleId || ""}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              roleId: event.target.value,
                              sectionId: "",
                            }))
                          }
                          className="w-full h-11 px-3.5 rounded-xl border border-slate-800 bg-slate-800/50 text-sm text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        >
                          <option value="" className="bg-slate-900">
                            {t(
                              lang,
                              "Select Job Role",
                              "රැකියා කාර්යභාරය තෝරන්න",
                            )}
                          </option>
                          {roles
                            .filter((role) => {
                              if (
                                divisionId === 1 &&
                                role.code === "ASSISTANT_COMMISSIONER"
                              )
                                return false;
                              if (
                                divisionId === 2 &&
                                (role.code === "ASSISTANT_DIRECTOR" ||
                                  role.code === "ACCOUNTANT")
                              )
                                return false;
                              if (
                                divisionId === 2 &&
                                (role.code === "SSO" || role.code === "HQSSO")
                              )
                                return false;
                              if (divisionId === 1 && role.code === "SPO")
                                return false;
                              return true;
                            })
                            .map((role) => (
                              <option
                                key={role.id}
                                value={role.id}
                                className="bg-slate-900"
                              >
                                {lang === "en" ? role.name_en : role.name_si}
                              </option>
                            ))}
                        </select>
                      </div>

                      {/* Section Selection */}
                      {requiresSection && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            {t(lang, "Section", "අංශය")}
                          </label>
                          <select
                            value={form.sectionId || ""}
                            onChange={(event) =>
                              updateField("sectionId", event.target.value)
                            }
                            disabled={loadingSections || isStoreKeeper}
                            className="w-full h-11 px-3.5 rounded-xl border border-slate-800 bg-slate-800/50 text-sm text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50"
                          >
                            <option value="" className="bg-slate-900">
                              {loadingSections
                                ? t(
                                    lang,
                                    "Loading sections...",
                                    "අංශ පූරණය වෙමින්...",
                                  )
                                : t(lang, "Select Section", "අංශය තෝරන්න")}
                            </option>
                            {sections.map((section) => (
                              <option
                                key={section.id}
                                value={section.id}
                                className="bg-slate-900"
                              >
                                {lang === "en"
                                  ? section.name_en
                                  : section.name_si}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="grid sm:grid-cols-2 gap-4">
                        {renderInputField(
                          "empId",
                          "Employee ID",
                          "සේවක ID",
                        )}
                        {renderInputField(
                          "salaryNumber",
                          "Salary Number",
                          "වැටුප් අංකය",
                        )}
                      </div>
                    </>
                  )}

                  {/* INSTITUTION DETAILS */}
                  {accountType === "institution" && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          {t(lang, "Institution", "ආයතනය")}
                        </label>
                        <select
                          value={form.institutionId || ""}
                          onChange={(event) =>
                            updateField("institutionId", event.target.value)
                          }
                          disabled={filteredInstitutions.length === 0}
                          className="w-full h-11 px-3.5 rounded-xl border border-slate-800 bg-slate-800/50 text-sm text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50"
                        >
                          <option value="" className="bg-slate-900">
                            {filteredInstitutions.length === 0
                              ? t(
                                  lang,
                                  "No institutions found for this division",
                                  "මෙම කොට්ඨාශය සඳහා ආයතන හමු නොවීය",
                                )
                              : t(lang, "Select Institution", "ආයතනය තෝරන්න")}
                          </option>
                          {filteredInstitutions.map((inst) => (
                            <option
                              key={inst.id}
                              value={inst.id}
                              className="bg-slate-900"
                            >
                              {lang === "en" ? inst.name_en : inst.name_si}
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedInstitution && (
                        <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3.5">
                          <p className="text-[11px] text-slate-400">
                            {t(lang, "District", "දිස්ත්‍රික්කය")}
                          </p>
                          <p className="text-xs font-semibold text-slate-200 mt-0.5">
                            {selectedInstitution.district}
                          </p>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          {t(lang, "Institution Type", "ආයතන වර්ගය")}
                        </label>
                        <select
                          value={form.institutionTypeId || ""}
                          onChange={(event) =>
                            updateField(
                              "institutionTypeId",
                              event.target.value,
                            )
                          }
                          className="w-full h-11 px-3.5 rounded-xl border border-slate-800 bg-slate-800/50 text-sm text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        >
                          <option value="" className="bg-slate-900">
                            {t(
                              lang,
                              "Select Institution Type",
                              "ආයතන වර්ගය තෝරන්න",
                            )}
                          </option>
                          {institutionTypes.map((type) => (
                            <option
                              key={type.id}
                              value={type.id}
                              className="bg-slate-900"
                            >
                              {lang === "en" ? type.name_en : type.name_si}
                            </option>
                          ))}
                        </select>
                      </div>

                      {renderInputField("address", "Address", "ලිපිනය")}
                      {renderInputField(
                        "contact",
                        "Institution Contact",
                        "ආයතන සම්බන්ධතා",
                        "tel",
                      )}

                      <div className="pt-3 border-t border-slate-800/80 mt-2">
                        <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3">
                          {t(
                            lang,
                            "Authorised Contact Person",
                            "බලයලත් සම්බන්ධතා පුද්ගලයා",
                          )}
                        </p>

                        <div className="grid sm:grid-cols-2 gap-4">
                          {renderInputField("cpName", "Full Name", "සම්පූර්ණ නම")}
                          {renderInputField("cpDesig", "Designation", "තනතුර")}
                          {renderInputField("cpNic", "NIC", "ජාතික හැඳුනුම්පත")}
                          {renderInputField(
                            "cpPhone",
                            "Phone",
                            "දුරකථනය",
                            "tel",
                          )}
                        </div>

                        <div className="mt-4">
                          {renderInputField(
                            "cpEmail",
                            "Email",
                            "විද්‍යුත් තැපෑල",
                            "email",
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* STEP 4: CREDENTIALS */}
            {step === 3 && (
              <div className="animate-in fade-in duration-300">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-white">
                    {t(
                      lang,
                      "Create your credentials",
                      "ඔබගේ අක්තපත්‍ර සාදන්න",
                    )}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {t(
                      lang,
                      "Set a secure password for your account.",
                      "ඔබගේ ගිණුම සඳහා ආරක්ෂිත මුරපදයක් සකසන්න.",
                    )}
                  </p>
                </div>

                {/* Username Preview Box */}
                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 mb-5 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                      {t(lang, "Generated Username", "පරිශීලක නාමය")}
                    </p>
                    <p className="text-sm font-mono font-bold text-blue-300 mt-0.5">
                      {accountType === "staff"
                        ? form.salaryNumber
                          ? `SWPCS-${form.salaryNumber}`
                          : "—"
                        : selectedInstitution
                          ? `SWPCS-${selectedInstitution.id}`
                          : "—"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {renderInputField(
                    "password",
                    "Password",
                    "මුරපදය",
                    "password",
                  )}
                  {renderInputField(
                    "confirmPassword",
                    "Confirm Password",
                    "මුරපදය තහවුරු කරන්න",
                    "password",
                  )}
                </div>

                <div className="mt-5 flex gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed">
                    {t(
                      lang,
                      "Your account will remain inactive until it is approved by the Commissioner.",
                      "කොමසාරිස්වරයා විසින් අනුමත කරන තෙක් ඔබගේ ගිණුම අක්‍රියව පවතී.",
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="mx-6 sm:mx-8 mb-4 flex items-start gap-2.5 rounded-xl border border-red-900/50 bg-red-950/40 p-3.5">
              <div className="w-4 h-4 shrink-0 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-bold mt-0.5">
                !
              </div>
              <p className="text-xs font-medium text-red-300 leading-relaxed">
                {error}
              </p>
            </div>
          )}

          {success && (
            <div className="mx-6 sm:mx-8 mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-900/50 bg-emerald-950/40 p-3.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <p className="text-xs font-medium text-emerald-300 leading-relaxed">
                {success}
              </p>
            </div>
          )}

          {/* Bottom Actions Bar */}
          <div className="px-6 sm:px-8 py-5 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setError("");
                setStep((current) => Math.max(0, current - 1));
              }}
              disabled={step === 0 || submitting}
              className="h-10 px-4 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              {t(lang, "Previous", "පෙර")}
            </button>

            <button
              type="button"
              onClick={() => {
                if (step < 3) {
                  handleContinue();
                } else {
                  void handleSubmit();
                }
              }}
              disabled={submitting}
              className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {step < 3 ? (
                <>
                  <span>{t(lang, "Continue", "ඉදිරියට")}</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              ) : submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {t(lang, "Submitting...", "ඉදිරිපත් කරමින්...")}
                  </span>
                </>
              ) : (
                <>
                  <span>{t(lang, "Create Account", "ගිණුම සාදන්න")}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Security Footer Notice */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>
            {t(
              lang,
              "Secure registration • Authorized government users",
              "ආරක්ෂිත ලියාපදිංචිය • අවසර ලත් රාජ්‍ය පරිශීලකයින්",
            )}
          </span>
        </div>
      </main>
    </div>
  );
}