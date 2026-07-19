import { ROMANIAN_COUNTIES, type RomanianCounty } from "@/lib/romanian-counties";

export const COUNTY_CODE_BY_NAME: Record<RomanianCounty, string> = {
  Alba: "AB",
  Arad: "AR",
  Argeș: "AG",
  Bacău: "BC",
  Bihor: "BH",
  "Bistrița-Năsăud": "BN",
  Botoșani: "BT",
  Brăila: "BR",
  Brașov: "BV",
  București: "B",
  Buzău: "BZ",
  Călărași: "CL",
  "Caraș-Severin": "CS",
  Cluj: "CJ",
  Constanța: "CT",
  Covasna: "CV",
  Dâmbovița: "DB",
  Dolj: "DJ",
  Galați: "GL",
  Giurgiu: "GR",
  Gorj: "GJ",
  Harghita: "HR",
  Hunedoara: "HD",
  Ialomița: "IL",
  Iași: "IS",
  Ilfov: "IF",
  Maramureș: "MM",
  Mehedinți: "MH",
  Mureș: "MS",
  Neamț: "NT",
  Olt: "OT",
  Prahova: "PH",
  Sălaj: "SJ",
  "Satu Mare": "SM",
  Sibiu: "SB",
  Suceava: "SV",
  Teleorman: "TR",
  Timiș: "TM",
  Tulcea: "TL",
  Vâlcea: "VL",
  Vaslui: "VS",
  Vrancea: "VN",
};

export const COUNTY_NAME_BY_CODE: Record<string, RomanianCounty> = Object.fromEntries(
  Object.entries(COUNTY_CODE_BY_NAME).map(([name, code]) => [code, name as RomanianCounty])
) as Record<string, RomanianCounty>;

export function resolveCountyName(raw?: string | null): RomanianCounty | null {
  if (!raw?.trim()) return null;
  const normalized = raw.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");

  for (const county of ROMANIAN_COUNTIES) {
    const countyNorm = county.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
    if (countyNorm === normalized) return county;
  }

  const byCode = COUNTY_NAME_BY_CODE[raw.trim().toUpperCase()];
  return byCode ?? null;
}

export function getCountyCode(countyName: RomanianCounty): string {
  return COUNTY_CODE_BY_NAME[countyName];
}
