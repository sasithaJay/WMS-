export const ROLES = {
  ADMIN: "ADMIN",
  COMMISSIONER: "COMMISSIONER",
  ASSISTANT_COMMISSIONER: "ASSISTANT_COMMISSIONER",
  ASSISTANT_DIRECTOR: "ASSISTANT_DIRECTOR",
  ACCOUNTANT: "ACCOUNTANT",
  ADMINISTRATIVE_OFFICER: "ADMINISTRATIVE_OFFICER",
  SECTION_HEAD: "SECTION_HEAD",
  STORE_KEEPER: "STORE_KEEPER",
  DEVELOPMENT_OFFICER: "DEVELOPMENT_OFFICER",
  OFFICER: "OFFICER",
  INSTITUTION: "INSTITUTION",
  DIVISIONAL_SECRETARIAT: "DIVISIONAL_SECRETARIAT",
} as const;

export const ROLE_LABELS: Record<string, { en: string; si: string }> = {
  ADMIN: {
    en: "System Admin",
    si: "පද්ධති පරිපාලක",
  },
  COMMISSIONER: { en: "Commissioner", si: "කොමසාරිස්" },
  ASSISTANT_COMMISSIONER: { en: "Assistant Commissioner", si: "සහකාර කොමසාරිස්" },
  ASSISTANT_DIRECTOR: { en: "Assistant Director", si: "සහකාර අධ්‍යක්ෂ" },
  ACCOUNTANT: { en: "Accountant", si: "ගණකාධිකාරී" },
  ADMINISTRATIVE_OFFICER: { en: "Administrative Officer", si: "ව්‍යවස්ථාපිත නිලධාරී" },
  SECTION_HEAD: { en: "Section Head (CC/FA)", si: "අංශ ප්‍රධානී" },
  STORE_KEEPER: { en: "Store Keeper", si: "ගබඩාරක්ෂක" },
  DEVELOPMENT_OFFICER: { en: "Development Officer", si: "සංවර්ධන නිලධාරී" },
  OFFICER: { en: "Officer", si: "නිලධාරී" },
  INSTITUTION: { en: "Institution", si: "ආයතනය" },
  DIVISIONAL_SECRETARIAT: { en: "Divisional Secretariat", si: "දිව්‍යංශ ලේකම්" },
};
