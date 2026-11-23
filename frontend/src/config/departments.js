/**
 * Frontend Departments, Sections & Senders Configuration
 * Single source of truth for College & Hospital Outgoing Sections and Incoming Senders.
 */

// 1. INCOMING Senders (50 Institutional Entities with spelling corrections)
export const INCOMING_SENDERS = [
  "Anatomy",
  "Biochemistry",
  "Pharmacology",
  "Pathology",
  "Microbiology",
  "Forensic Medicine",
  "Community Medicine",
  "Physiology",
  "General Medicine",
  "General Surgery",
  "O & G",
  "Paediatrics",
  "Orthopaedics",
  "Ophthalmology",
  "ENT",
  "Hepatology",
  "Emergency Medicine",
  "Anaesthesiology",
  "Radiodiagnosis",
  "Dermatology",
  "Psychiatry",
  "Dentistry",
  "Neurosurgery",
  "SGE",
  "Paediatric Surgery",
  "Urology",
  "Medical Oncology",
  "Surgical Oncology",
  "Radiation Oncology",
  "Nephrology",
  "Medical Gastroenterology",
  "Neurology",
  "Cardio Thoracic Surgery",
  "Cardiology",
  "Plastic Surgery",
  "Vascular Surgery",
  "TB & Respiratory Dept",
  "Blood Bank",
  "Physical Medicine",
  "Geriatrics",
  "DEIC",
  "Radiology Physicist",
  "ART",
  "CSSD",
  "Medical Store",
  "Surgical Store",
  "MRD",
  "RMO Office",
  "Matron Office",
  "MS Office"
];

// 2. OUTGOING COLLEGE SECTIONS (24 Sections)
export const COLLEGE_SECTIONS = [
  {
    code: "COL-E1",
    name: "College - E1 section",
    category: "College",
    username: "college_e1",
    description: "Dean, VP, Professor, Assoc.Prof Establishment and SC section"
  },
  {
    code: "COL-E2",
    name: "College - E2 section",
    category: "College",
    username: "college_e2",
    description: "Ministerial staff Establishment, FC Surrender of posts and Revival"
  },
  {
    code: "COL-E3",
    name: "College - E3 section",
    category: "College",
    username: "college_e3",
    description: "JR, SR & Tutor Establishment"
  },
  {
    code: "COL-E4",
    name: "College - E4 section",
    category: "College",
    username: "college_e4",
    description: "Asst.Professor (Clinical & Non-clinical) Establishment"
  },
  {
    code: "COL-E5-E6",
    name: "College - E5 & E6 section",
    category: "College",
    username: "college_e5_e6",
    description: "Paramedical Staffs Establishment, RTI, e-office & IFHRMS"
  },
  {
    code: "COL-E7",
    name: "College - E7 section",
    category: "College",
    username: "college_e7",
    description: "Basic Servants & Driver"
  },
  {
    code: "COL-CASH",
    name: "College - Cash section",
    category: "College",
    username: "college_cash",
    description: "Cash, Perm. Adv."
  },
  {
    code: "COL-A1",
    name: "College - A1 section",
    category: "College",
    username: "college_a1",
    description: "Audit, Budget and Contingent Bill Section"
  },
  {
    code: "COL-A2",
    name: "College - A2 section",
    category: "College",
    username: "college_a2",
    description: "Clinical AP, SR & JR Salary Bills"
  },
  {
    code: "COL-A3",
    name: "College - A3 section",
    category: "College",
    username: "college_a3",
    description: "Non-clinical AP & Tutor, Ministerial & Basic Servants Bill & E-SR"
  },
  {
    code: "COL-A4",
    name: "College - A4 section",
    category: "College",
    username: "college_a4",
    description: "Professors, Assoc.Prof, Paramedical Bills and IT returns"
  },
  {
    code: "COL-A5",
    name: "College - A5 section",
    category: "College",
    username: "college_a5",
    description: "PG Bill, TA Bills, Loans and Advances"
  },
  {
    code: "COL-ME1",
    name: "College - ME-I section",
    category: "College",
    username: "college_me1",
    description: "MBBS and CRRI"
  },
  {
    code: "COL-ME1-1",
    name: "College - ME-I(I) section",
    category: "College",
    username: "college_me1_1",
    description: "All Schemes and Scholarships"
  },
  {
    code: "COL-ME2",
    name: "College - ME-II section",
    category: "College",
    username: "college_me2",
    description: "PG, Stipend Bills"
  },
  {
    code: "COL-NMC",
    name: "College - NMC section",
    category: "College",
    username: "college_nmc",
    description: "NMC and University related works"
  },
  {
    code: "COL-PME1",
    name: "College - PME-I section",
    category: "College",
    username: "college_pme1",
    description: "Paramedical Degree Course"
  },
  {
    code: "COL-PME2",
    name: "College - PME- II section",
    category: "College",
    username: "college_pme2",
    description: "Diploma and Certificate Course"
  },
  {
    code: "COL-PD",
    name: "College - P&D section",
    category: "College",
    username: "college_pd",
    description: "Civil & Electrical"
  },
  {
    code: "COL-S1",
    name: "College - S1 section",
    category: "College",
    username: "college_s1",
    description: "S1 – Stores and equipments"
  },
  {
    code: "COL-S2",
    name: "College - S2 section",
    category: "College",
    username: "college_s2",
    description: "S2 – Library, furniture, Electricals and Electronic items"
  },
  {
    code: "COL-S3",
    name: "College - S3 section",
    category: "College",
    username: "college_s3",
    description: "Stationery"
  },
  {
    code: "COL-S4",
    name: "College - S4 section",
    category: "College",
    username: "college_s4",
    description: "Vehicle"
  },
  {
    code: "COL-S5",
    name: "College - S5 section",
    category: "College",
    username: "college_s5",
    description: "CM Cell Petition, GDP"
  }
];

// 3. OUTGOING HOSPITAL SECTIONS (25 Sections)
export const HOSPITAL_SECTIONS = [
  {
    code: "HOSP-E1-1",
    name: "Hospital - E1 (1)",
    category: "Hospital",
    username: "hospital_e1_1",
    description: "Doctors Establishment"
  },
  {
    code: "HOSP-E1-2",
    name: "Hospital - E1 (2)",
    category: "Hospital",
    username: "hospital_e1_2",
    description: "Paramedical staff Establishment"
  },
  {
    code: "HOSP-E2",
    name: "Hospital - E2",
    category: "Hospital",
    username: "hospital_e2",
    description: "Ministerial Staff Establishment, Pay Authorisation, TMT"
  },
  {
    code: "HOSP-E3",
    name: "Hospital - E3",
    category: "Hospital",
    username: "hospital_e3",
    description: "Regular Staff Nurse Establishment"
  },
  {
    code: "HOSP-E4",
    name: "Hospital - E4",
    category: "Hospital",
    username: "hospital_e4",
    description: "NS Gr- I, II, Contract Basis Staff Nurse Establishment, SC Section"
  },
  {
    code: "HOSP-E5",
    name: "Hospital - E5",
    category: "Hospital",
    username: "hospital_e5",
    description: "LGS Establishment"
  },
  {
    code: "HOSP-S1",
    name: "Hospital - S1",
    category: "Hospital",
    username: "hospital_s1",
    description: "Medical Store"
  },
  {
    code: "HOSP-S2",
    name: "Hospital - S2",
    category: "Hospital",
    username: "hospital_s2",
    description: "Surgical Store"
  },
  {
    code: "HOSP-S3",
    name: "Hospital - S3",
    category: "Hospital",
    username: "hospital_s3",
    description: "Diet"
  },
  {
    code: "HOSP-S5",
    name: "Hospital - S5",
    category: "Hospital",
    username: "hospital_s5",
    description: "Linen, NHIS Card, FSK & Purchase of Electronics items"
  },
  {
    code: "HOSP-S6",
    name: "Hospital - S6",
    category: "Hospital",
    username: "hospital_s6",
    description: "Stationery, Generator, Vehicle, Quarters & Medical Reimbursement"
  },
  {
    code: "HOSP-CMCHIS1",
    name: "Hospital - CMCHIS (1)",
    category: "Hospital",
    username: "hospital_cmchis1",
    description: "Nephrology, Urology, Paediatric Surgery, Paediatrics, General Surgery, General Medicine, O & G, Biochemistry, Pathology, Microbiology, Radiology, Radiation Oncology, CMCHIS Salary & Cashbook"
  },
  {
    code: "HOSP-CMCHIS2",
    name: "Hospital - CMCHIS (2)",
    category: "Hospital",
    username: "hospital_cmchis2",
    description: "Orthopaedics, Neurosurgery, Vascular Surgery, Plastic Surgery, Cardiology, ENT, Dental, Ophthalmology, Anaesthesiology, Forensic Medicine, Surgical Gastroenterology, Psychiatry, Blood Bank, Minutes of Meeting"
  },
  {
    code: "HOSP-PD",
    name: "Hospital - P & D",
    category: "Hospital",
    username: "hospital_pd",
    description: "Civil and Electrical"
  },
  {
    code: "HOSP-HD",
    name: "Hospital - H & D",
    category: "Hospital",
    username: "hospital_hd",
    description: "Contract staff appointment, outsourcing salary, RO Plant, Clinical Training"
  },
  {
    code: "HOSP-A1",
    name: "Hospital - A1",
    category: "Hospital",
    username: "hospital_a1",
    description: "Staff Nurse Bill"
  },
  {
    code: "HOSP-A2",
    name: "Hospital - A2",
    category: "Hospital",
    username: "hospital_a2",
    description: "Ministerial & Paramedical Bill"
  },
  {
    code: "HOSP-A3",
    name: "Hospital - A3",
    category: "Hospital",
    username: "hospital_a3",
    description: "Doctors & LGS Bill"
  },
  {
    code: "HOSP-A4",
    name: "Hospital - A4",
    category: "Hospital",
    username: "hospital_a4",
    description: "Cash"
  },
  {
    code: "HOSP-A5",
    name: "Hospital - A5",
    category: "Hospital",
    username: "hospital_a5",
    description: "Audit & Budget"
  },
  {
    code: "HOSP-A6",
    name: "Hospital - A6",
    category: "Hospital",
    username: "hospital_a6",
    description: "Contingent Bill section, Medical board typing"
  },
  {
    code: "HOSP-A7",
    name: "Hospital - A7",
    category: "Hospital",
    username: "hospital_a7",
    description: "CEMONC & Family Planning"
  },
  {
    code: "HOSP-A8",
    name: "Hospital - A8",
    category: "Hospital",
    username: "hospital_a8",
    description: "Medical Board"
  },
  {
    code: "HOSP-A9",
    name: "Hospital - A9",
    category: "Hospital",
    username: "hospital_a9",
    description: "RTI, CM Cell & GDP petition"
  },
  {
    code: "HOSP-A10",
    name: "Hospital - A10",
    category: "Hospital",
    username: "hospital_a10",
    description: "NHM and TNHSRB staff salary, NK48, SNA Sparsh"
  }
];

export const ALL_SECTIONS = [...COLLEGE_SECTIONS, ...HOSPITAL_SECTIONS];
export const DEPARTMENTS = ALL_SECTIONS.map((s) => s.name);
