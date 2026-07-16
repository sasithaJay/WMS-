import {
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";

import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  User,
  Building2,
  FileText,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

import { LanguageToggle } from "../components/common/LanguageToggle";

import {
  getRegistrationOptions,
  getSections,
  register,
} from "../../services/authService";

import { DISTRICTS } from "../constants/menuItems";
import { t } from "../constants/translations";

import type { Lang } from "../types";

import type {
  DsOffice,
  InstitutionType,
  RegistrationDivision,
  RegistrationRole,
  RegistrationSection,
} from "../types/auth";

type FrontendAccountType =
  | "staff"
  | "institution"
  | "ds";

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
  //registration steps

 const [dsSearch, setDsSearch] = useState("");
const [showDsOptions, setShowDsOptions] = useState(false);

  const [step, setStep] = useState(0);

 //main registration form state

  const [divisionId, setDivisionId] =
    useState<number | null>(null);

  const [accountType, setAccountType] =
    useState<FrontendAccountType | null>(null);

  const [form, setForm] =
    useState<FormState>({});

  //backend registration options

  const [divisions, setDivisions] =
    useState<RegistrationDivision[]>([]);

  const [roles, setRoles] =
    useState<RegistrationRole[]>([]);

  const [sections, setSections] =
    useState<RegistrationSection[]>([]);

  const [
    institutionTypes,
    setInstitutionTypes,
  ] = useState<InstitutionType[]>([]);

  //UI state

  const [loadingOptions, setLoadingOptions] =
    useState(true);

  const [loadingSections, setLoadingSections] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  //step title

  const steps = [
    t(lang, "Division", "කොට්ඨාශය"),
    t(lang, "Account Type", "ගිණුම් වර්ගය"),
    t(lang, "Details", "විස්තර"),
    t(lang, "Credentials", "අක්තපත්‍ර"),
  ];

  //selected role

  const selectedRole = useMemo(
    () =>
      roles.find(
        (role) =>
          role.id === Number(form.roleId),
      ),
    [roles, form.roleId],
  );

  //Whether Selected Staff Role Requires Section

  const requiresSection =
    accountType === "staff" &&
    selectedRole !== undefined &&
    !SECTIONLESS_ROLES.includes(
      selectedRole.code as
        (typeof SECTIONLESS_ROLES)[number],
    );

    const isStoreKeeper = selectedRole?.code === "STORE_KEEPER"; // confirm this is the actual code

  //Load Registration Options

  const [dsOffices, setDsOffices] =
  useState<DsOffice[]>([]);

  useEffect(() => {
  if (!isStoreKeeper) return;

  const accountSection = sections.find(
    (section) => section.id === 1,
  );

  if (accountSection && form.sectionId !== String(accountSection.id)) {
    updateField("sectionId", String(accountSection.id));
  }
}, [isStoreKeeper, sections]);

  useEffect(() => {
    const loadRegistrationOptions =
      async () => {
        try {
          setLoadingOptions(true);
          setError("");

          const data =
            await getRegistrationOptions();

          setDivisions(data.divisions);
          setRoles(data.roles);

          setInstitutionTypes(
            data.institution_types,
          );
          setDsOffices(data.ds_offices);
        } catch {
          setError(
            t(
              lang,
              "Could not load registration options.",
              "ලියාපදිංචි විකල්ප පූරණය කළ නොහැක.",
            ),
          );
        } finally {
          setLoadingOptions(false);
        }
      };

    void loadRegistrationOptions();
  }, [lang]);

  const filteredDsOffices = dsOffices.filter((office) => {
  const search = dsSearch.toLowerCase().trim();

  return (
    office.name_en.toLowerCase().includes(search) ||
    office.name_si.includes(dsSearch) ||
    office.district.toLowerCase().includes(search)
  );
});

  //Load Sections When Division Changes

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

        const data =
          await getSections(divisionId);

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

 //Update Form Field

  const updateField = (
    key: string,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  //Reusable Text Field

  const field = (
    key: string,
    label: string,
    labelSi: string,
    type = "text",
    placeholder = "",
    placeholderSi = "",
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {t(lang, label, labelSi)}
      </label>

      <input
        type={type}
        value={form[key] || ""}
        onChange={(event) =>
          updateField(
            key,
            event.target.value,
          )
        }
        placeholder={t(
          lang,
          placeholder || label,
          placeholderSi || labelSi,
        )}
        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 transition-all bg-gray-50 focus:bg-white"
      />
    </div>
  );

  //Reusable String Select

  const select = (
    key: string,
    label: string,
    labelSi: string,
    options: string[],
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {t(lang, label, labelSi)}
      </label>

      <select
        value={form[key] || ""}
        onChange={(event) =>
          updateField(
            key,
            event.target.value,
          )
        }
        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 transition-all bg-gray-50 focus:bg-white appearance-none cursor-pointer"
      >
        <option value="">
          {t(
            lang,
            `Select ${label}`,
            `${labelSi} තෝරන්න`,
          )}
        </option>

        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>
    </div>
  );

 //step validation

  const validateCurrentStep =
    (): boolean => {
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
            !form.empId
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

          if (
            requiresSection &&
            !form.sectionId
          ) {
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

        if (
          accountType === "institution"
        ) {
          if (
            !form.instName ||
            !form.institutionTypeId ||
            !form.licence ||
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

        if (accountType === "ds") {
          if (
            !form.dsOfficeId ||
            !form.dsOfficeName ||
            !form.officeAddress ||
            !form.officeContact ||
            !form.cpName ||
            !form.cpDesig ||
            !form.cpNic ||
            !form.cpPhone ||
            !form.cpEmail
          ) {
            setError(
              t(
                lang,
                "Please complete all required DS office details.",
                "කරුණාකර අවශ්‍ය සියලු DS කාර්යාල විස්තර සම්පූර්ණ කරන්න.",
              ),
            );

            return false;
          }
        }
      }

      if (step === 3) {
        if (
          !form.username ||
          !form.password ||
          !form.confirmPassword
        ) {
          setError(
            t(
              lang,
              "Please complete all credential fields.",
              "කරුණාකර සියලු අක්තපත්‍ර ක්ෂේත්‍ර සම්පූර්ණ කරන්න.",
            ),
          );

          return false;
        }

        if (
          form.password !==
          form.confirmPassword
        ) {
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

    //continue to next step

  const handleContinue = () => {
    if (!validateCurrentStep()) {
      return;
    }

    setStep((current) =>
      Math.min(3, current + 1),
    );
  };

  //submit registration form

  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      return;
    }

    if (
      !divisionId ||
      !accountType
    ) {
      return;
    }

    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      let payload:
        Record<string, unknown>;

      //staff payload

      if (accountType === "staff") {
        payload = {
          account_type: "STAFF",

          username:
            form.username,

          email:
            form.email,

          password:
            form.password,

          password_confirmation:
            form.confirmPassword,

          division_id:
            divisionId,

          role_id:
            Number(form.roleId),

          full_name:
            form.fullName,

          nic_number:
            form.nic,

          phone:
            form.phone,

          employee_number:
            form.empId,

          ...(requiresSection
            ? {
                section_id:
                  Number(form.sectionId),
              }
            : {}),
        };
      }

      //institution payload

      else if (
        accountType === "institution"
      ) {
        payload = {
          account_type:
            "INSTITUTION",

          username:
            form.username,

          email:
            form.cpEmail,

          password:
            form.password,

          password_confirmation:
            form.confirmPassword,

          division_id:
            divisionId,

          organization_name:
            form.instName,

          institution_type_id:
            Number(
              form.institutionTypeId,
            ),

          licence_number:
            form.licence,

          address:
            form.address,

          contact_number:
            form.contact,

          contact_person_name:
            form.cpName,

          contact_person_designation:
            form.cpDesig,

          contact_person_nic:
            form.cpNic,

          contact_person_phone:
            form.cpPhone,

          contact_person_email:
            form.cpEmail,
        };
      }

     //ds office payload

      else {
        payload = {
          account_type:
            "DS_OFFICE",

          username:
            form.username,

          email:
            form.cpEmail,

          password:
            form.password,

          password_confirmation:
            form.confirmPassword,

          division_id:
            divisionId,

          organization_name:
            form.dsOfficeName,

          address:
            form.officeAddress,

          contact_number:
            form.officeContact,

          contact_person_name:
            form.cpName,

          contact_person_designation:
            form.cpDesig,

          contact_person_nic:
            form.cpNic,

          contact_person_phone:
            form.cpPhone,

          contact_person_email:
            form.cpEmail,
        };
      }

      const data =
        await register(payload);

      setSuccess(data.message);

      setForm({});
      setDivisionId(null);
      setAccountType(null);
      setSections([]);
      setStep(0);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const responseData =
          error.response?.data;

        if (responseData?.errors) {
          const validationMessages =
            Object.values(
              responseData.errors,
            ).flat();

          const firstMessage =
            validationMessages.find(
              (message) =>
                typeof message === "string",
            );

          setError(
            typeof firstMessage === "string"
              ? firstMessage
              : t(
                  lang,
                  "Registration failed.",
                  "ලියාපදිංචිය අසාර්ථකයි.",
                ),
          );
        } else {
          setError(
            responseData?.message ??
              t(
                lang,
                "Registration failed.",
                "ලියාපදිංචිය අසාර්ථකයි.",
              ),
          );
        }
      } else {
        setError(
          t(
            lang,
            "An unexpected error occurred.",
            "අනපේක්ෂිත දෝෂයක් ඇතිවිය.",
          ),
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  //loading state

  if (loadingOptions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <p className="text-sm text-gray-500">
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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />

          {t(
            lang,
            "Back to Login",
            "ලොගින් වෙත ආපසු",
          )}
        </button>

        <LanguageToggle
          lang={lang}
          setLang={setLang}
        />
      </div>

      <div className="flex-1 flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-[580px] bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Progress */}
          <div className="px-8 pt-8 pb-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-5">
              {steps.map(
                (stepLabel, index) => (
                  <div
                    key={stepLabel}
                    className="flex items-center gap-2"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                        index < step
                          ? "bg-green-500 text-white"
                          : index === step
                            ? "bg-[#4295D9] text-white"
                            : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {index < step ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        index + 1
                      )}
                    </div>

                    <span
                      className={`text-xs font-medium hidden sm:block ${
                        index === step
                          ? "text-[#4295D9]"
                          : index < step
                            ? "text-green-600"
                            : "text-gray-400"
                      }`}
                    >
                      {stepLabel}
                    </span>

                    {index <
                      steps.length - 1 && (
                      <div
                        className={`h-px w-8 mx-1 hidden sm:block ${
                          index < step
                            ? "bg-green-400"
                            : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                ),
              )}
            </div>

            <h2 className="text-xl font-bold text-gray-900">
              {t(
                lang,
                "Create Account",
                "ගිණුම සාදන්න",
              )}
            </h2>

            <p className="text-sm text-gray-500 mt-0.5">
              {t(
                lang,
                `Step ${step + 1} of 4`,
                `පියවර ${step + 1} / 4`,
              )}
            </p>
          </div>

          {/* Main Form Content */}
          <div className="p-8">
            {/* Step 1 - Division */}
            {step === 0 && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  {t(
                    lang,
                    "Select the division you belong to:",
                    "ඔබ අයත් කොට්ඨාශය තෝරන්න:",
                  )}
                </p>

                {divisions.map((division) => (
                  <button
                    key={division.id}
                    type="button"
                    onClick={() =>
                      setDivisionId(
                        division.id,
                      )
                    }
                    className={`w-full p-5 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${
                      divisionId ===
                      division.id
                        ? "border-[#4295D9] bg-[#EBF4FD]"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        divisionId ===
                        division.id
                          ? "bg-[#4295D9] text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <Building2 className="w-6 h-6" />
                    </div>

                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        {lang === "en"
                          ? division.name_en
                          : division.name_si}
                      </div>
                    </div>

                    {divisionId ===
                      division.id && (
                      <CheckCircle className="w-5 h-5 text-[#4295D9] ml-auto flex-shrink-0 mt-0.5" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Step 2 - Account Type */}
            {step === 1 && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-4">
                  {t(
                    lang,
                    "Select your account type:",
                    "ඔබගේ ගිණුම් වර්ගය තෝරන්න:",
                  )}
                </p>

                {[
                  {
                    id: "staff" as const,

                    icon: (
                      <User className="w-5 h-5" />
                    ),

                    title: t(
                      lang,
                      "Staff Member",
                      "කාර්ය මණ්ඩල සාමාජිකයා",
                    ),

                    desc: t(
                      lang,
                      "Department officer or employee",
                      "දෙපාර්තමේන්තු නිලධාරී හෝ සේවකයා",
                    ),
                  },

                  {
                    id: "institution" as const,

                    icon: (
                      <Building2 className="w-5 h-5" />
                    ),

                    title: t(
                      lang,
                      "Institution",
                      "ආයතනය",
                    ),

                    desc: t(
                      lang,
                      "Children's home, remand home or other institution",
                      "ළමා නිවාස, රිමාන්ඩ් නිවාස හෝ වෙනත් ආයතනය",
                    ),
                  },

                  {
                    id: "ds" as const,

                    icon: (
                      <FileText className="w-5 h-5" />
                    ),

                    title: t(
                      lang,
                      "Divisional Secretary Office",
                      "ප්‍රාදේශීය ලේකම් කාර්යාලය",
                    ),

                    desc: t(
                      lang,
                      "Divisional Secretariat Office",
                      "ප්‍රාදේශීය ලේකම් කාර්යාලය",
                    ),
                  },
                ].map((account) => (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() =>
                      setAccountType(
                        account.id,
                      )
                    }
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${
                      accountType ===
                      account.id
                        ? "border-[#4295D9] bg-[#EBF4FD]"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        accountType ===
                        account.id
                          ? "bg-[#4295D9] text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {account.icon}
                    </div>

                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-sm">
                        {account.title}
                      </div>

                      <div className="text-xs text-gray-500 mt-0.5">
                        {account.desc}
                      </div>
                    </div>

                    {accountType ===
                      account.id && (
                      <CheckCircle className="w-5 h-5 text-[#4295D9]" />
                    )}
                  </button>
                ))}

                {accountType &&
                  accountType !==
                    "staff" && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                      <ShieldCheck className="w-3.5 h-3.5 inline mr-1" />

                      {t(
                        lang,
                        "Institution and DS office requests must be recommended by the Administrative Officer.",
                        "ආයතන හා DS ඉල්ලීම් පරිපාලන නිලධාරී විසින් නිර්දේශ කළ යුතුය.",
                      )}
                    </div>
                  )}
              </div>
            )}

            {/* Step 3 - Details */}
            {step === 2 && (
              <div className="space-y-4">
                {/* Staff */}
                {accountType ===
                  "staff" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      {field(
                        "fullName",
                        "Full Name",
                        "සම්පූර්ණ නම",
                      )}

                      {field(
                        "nic",
                        "NIC Number",
                        "ජාතික හැඳුනුම්පත් අංකය",
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {field(
                        "email",
                        "Email",
                        "විද්‍යුත් තැපෑල",
                        "email",
                      )}

                      {field(
                        "phone",
                        "Phone",
                        "දුරකථනය",
                        "tel",
                      )}
                    </div>

                    {/* Role */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t(
                          lang,
                          "Job Role",
                          "රැකියා කාර්යභාරය",
                        )}
                      </label>

                      <select
                        value={
                          form.roleId ||
                          ""
                        }
                        onChange={(
                          event,
                        ) =>
                          setForm(
                            (
                              current,
                            ) => ({
                              ...current,

                              roleId:
                                event
                                  .target
                                  .value,

                              sectionId:
                                "",
                            }),
                          )
                        }
                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-gray-50"
                      >
                        <option value="">
                          {t(
                            lang,
                            "Select Job Role",
                            "රැකියා කාර්යභාරය තෝරන්න",
                          )}
                        </option>

                        {roles
                        .filter((role) => {
                          if (divisionId === 1 && role.code === "ASSISTANT_COMMISSIONER") {
                            return false;
                          }
                          if (divisionId === 2 && role.code === "ASSISTANT_DIRECTOR") {
                            return false;
                          }
                          return true;
                        })
                        .map((role) => (
                          <option key={role.id} value={role.id}>
                            {lang === "en" ? role.name_en : role.name_si}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Section */}
                    {requiresSection && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {t(
                            lang,
                            "Section",
                            "අංශය",
                          )}
                        </label>

                        <select
                          value={
                            form.sectionId ||
                            ""
                          }
                          onChange={(
                            event,
                          ) =>
                            updateField(
                              "sectionId",
                              event.target
                                .value,
                            )
                          }
                          disabled={
                            loadingSections || isStoreKeeper
                          }
                          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-gray-50 disabled:opacity-60"
                        >
                          <option value="">
                            {loadingSections
                              ? t(
                                  lang,
                                  "Loading sections...",
                                  "අංශ පූරණය වෙමින්...",
                                )
                              : t(
                                  lang,
                                  "Select Section",
                                  "අංශය තෝරන්න",
                                )}
                          </option>

                          {sections.map(
                            (
                              section,
                            ) => (
                              <option
                                key={
                                  section.id
                                }
                                value={
                                  section.id
                                }
                              >
                                {lang ===
                                "en"
                                  ? section.name_en
                                  : section.name_si}
                              </option>
                            ),
                          )}
                        </select>
                      </div>
                    )}

                    {field(
                      "empId",
                      "Employee ID",
                      "සේවක ID",
                    )}
                  </>
                )}

                {/* Institution */}
                {accountType ===
                  "institution" && (
                  <>
                    {field(
                      "instName",
                      "Institution Name",
                      "ආයතනයේ නම",
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t(
                          lang,
                          "Institution Type",
                          "ආයතන වර්ගය",
                        )}
                      </label>

                      <select
                        value={
                          form.institutionTypeId ||
                          ""
                        }
                        onChange={(
                          event,
                        ) =>
                          updateField(
                            "institutionTypeId",
                            event.target
                              .value,
                          )
                        }
                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-gray-50"
                      >
                        <option value="">
                          {t(
                            lang,
                            "Select Institution Type",
                            "ආයතන වර්ගය තෝරන්න",
                          )}
                        </option>

                        {institutionTypes.map(
                          (type) => (
                            <option
                              key={
                                type.id
                              }
                              value={
                                type.id
                              }
                            >
                              {lang ===
                              "en"
                                ? type.name_en
                                : type.name_si}
                            </option>
                          ),
                        )}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {field(
                        "licence",
                        "Licence Number",
                        "බලපත්‍ර අංකය",
                      )}

                      {select(
                        "district",
                        "District",
                        "දිස්ත්‍රික්කය",
                        DISTRICTS,
                      )}
                    </div>

                    {field(
                      "address",
                      "Address",
                      "ලිපිනය",
                    )}

                    {field(
                      "contact",
                      "Institution Contact",
                      "ආයතන සම්බන්ධතා",
                      "tel",
                    )}

                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        {t(
                          lang,
                          "Authorised Contact Person",
                          "බලයලත් සම්බන්ධතා පුද්ගලයා",
                        )}
                      </p>

                      <div className="grid grid-cols-2 gap-4">
                        {field(
                          "cpName",
                          "Full Name",
                          "සම්පූර්ණ නම",
                        )}

                        {field(
                          "cpDesig",
                          "Designation",
                          "තනතුර",
                        )}

                        {field(
                          "cpNic",
                          "NIC",
                          "ජාතික හැඳුනුම්පත",
                        )}

                        {field(
                          "cpPhone",
                          "Phone",
                          "දුරකථනය",
                          "tel",
                        )}
                      </div>

                      {field(
                        "cpEmail",
                        "Email",
                        "විද්‍යුත් තැපෑල",
                        "email",
                      )}
                    </div>
                  </>
                )}

                {/* DS Office */}
                {accountType ===
                  "ds" && (
                  <>

                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t(
                          lang,
                          "DS Office / Division",
                          "DS කාර්යාලය / කොට්ඨාශය",
                        )}
                      </label>

                      <input
                        type="text"
                        value={dsSearch}
                        onFocus={() => setShowDsOptions(true)}
                        onChange={(event) => {
                          setDsSearch(event.target.value);
                          setShowDsOptions(true);
                        }}
                        placeholder={t(
                          lang,
                          "Search DS Office...",
                          "DS කාර්යාලය සොයන්න...",
                        )}
                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-gray-50 focus:bg-white"
                      />

                      {showDsOptions && (
                        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg">
                          {filteredDsOffices.length > 0 ? (
                            filteredDsOffices.map((office) => (
                              <button
                                key={office.id}
                                type="button"
                                onClick={() => {
                                  setForm((current) => ({
                                    ...current,
                                    dsOfficeId: String(office.id),
                                    dsOfficeName: office.name_en,
                                    district: office.district,
                                  }));

                                  setDsSearch(
                                    lang === "en"
                                      ? office.name_en
                                      : office.name_si,
                                  );

                                  setShowDsOptions(false);
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-[#EBF4FD] transition-colors border-b border-gray-100 last:border-b-0"
                              >
                                <div className="text-sm font-medium text-gray-900">
                                  {lang === "en"
                                    ? office.name_en
                                    : office.name_si}
                                </div>

                                <div className="text-xs text-gray-500 mt-0.5">
                                  {office.district}
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-sm text-gray-500">
                              {t(
                                lang,
                                "No DS offices found.",
                                "DS කාර්යාල හමු නොවීය.",
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {form.district && (
                      <div className="rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5">
                        <p className="text-xs text-gray-500">
                          {t(lang, "District", "දිස්ත්‍රික්කය")}
                        </p>

                        <p className="text-sm font-medium text-gray-800">
                          {form.district}
                        </p>
                      </div>
                    )}

                    {field(
                      "officeAddress",
                      "Office Address",
                      "කාර්යාල ලිපිනය",
                    )}

                    {field(
                      "officeContact",
                      "Office Contact Number",
                      "කාර්යාල සම්බන්ධතා",
                      "tel",
                    )}

                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        {t(
                          lang,
                          "Authorised Contact Person",
                          "බලයලත් සම්බන්ධතා පුද්ගලයා",
                        )}
                      </p>

                      <div className="grid grid-cols-2 gap-4">
                        {field(
                          "cpName",
                          "Full Name",
                          "සම්පූර්ණ නම",
                        )}

                        {field(
                          "cpDesig",
                          "Designation",
                          "තනතුර",
                        )}

                        {field(
                          "cpNic",
                          "NIC",
                          "ජාතික හැඳුනුම්පත",
                        )}

                        {field(
                          "cpPhone",
                          "Phone",
                          "දුරකථනය",
                          "tel",
                        )}
                      </div>

                      {field(
                        "cpEmail",
                        "Email",
                        "විද්‍යුත් තැපෑල",
                        "email",
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 4 - Credentials */}
            {step === 3 && (
              <div className="space-y-4">
                {field(
                  "username",
                  "Username",
                  "පරිශීලක නාමය",
                )}

                {field(
                  "password",
                  "Password",
                  "මුරපදය",
                  "password",
                )}

                {field(
                  "confirmPassword",
                  "Confirm Password",
                  "මුරපදය තහවුරු කරන්න",
                  "password",
                )}

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 flex gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />

                  <span>
                    {t(
                      lang,
                      "Your account will remain inactive until approved by the Commissioner.",
                      "ඔබගේ ගිණුම කොමසාරිස්වරයා විසින් අනුමත කරන තෙක් අක්‍රියව පවතී.",
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* API Messages */}
          {error && (
            <div className="mx-8 mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          )}

          {success && (
            <div className="mx-8 mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
              <p className="text-sm text-green-700">
                {success}
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="px-8 pb-8 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setError("");

                setStep((current) =>
                  Math.max(
                    0,
                    current - 1,
                  ),
                );
              }}
              disabled={step === 0}
              className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {t(
                lang,
                "Previous",
                "කලින්",
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                if (step < 3) {
                  handleContinue();

                  return;
                }

                void handleSubmit();
              }}
              disabled={submitting}
              className="px-6 py-2.5 bg-[#4295D9] text-white rounded-xl text-sm font-semibold hover:bg-[#3280C4] transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {step < 3
                ? t(
                    lang,
                    "Continue",
                    "ඉදිරියට",
                  )
                : submitting
                  ? t(
                      lang,
                      "Submitting...",
                      "ඉදිරිපත් කරමින්...",
                    )
                  : t(
                      lang,
                      "Submit",
                      "ඉදිරිපත් කරන්න",
                    )}

              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}