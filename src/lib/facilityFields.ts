/**
 * All extended boolean facility fields, grouped by section.
 * Each entry maps a DB column name (snake_case) to a human-readable label.
 * The camelCase key matches the SoberLivingHome interface property.
 */

export interface FacilityFieldDef {
  /** DB column name (snake_case) */
  dbCol: string;
  /** camelCase key on SoberLivingHome */
  key: string;
  /** Human-readable label */
  label: string;
}

export interface FacilityFieldGroup {
  section: string;
  fields: FacilityFieldDef[];
}

function f(dbCol: string, label: string): FacilityFieldDef {
  // Convert snake_case to camelCase for JS key
  const key = dbCol.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
  return { dbCol, key, label };
}

export const facilityFieldGroups: FacilityFieldGroup[] = [
  {
    section: 'Service Setting',
    fields: [
      f('setting_outpatient', 'Outpatient'),
      f('setting_inpatient', 'Inpatient'),
      f('setting_residential', 'Residential'),
      f('setting_intensive_outpatient', 'Intensive Outpatient'),
      f('setting_partial_hospitalization', 'Partial Hospitalization'),
      f('setting_telehealth', 'Telehealth'),
      f('setting_outpatient_detox', 'Outpatient Detox'),
      f('setting_residential_detox', 'Residential Detox'),
      f('setting_short_term_residential', 'Short-Term Residential'),
      f('setting_long_term_residential', 'Long-Term Residential'),
      f('setting_outpatient_methadone', 'Outpatient Methadone'),
    ],
  },
  {
    section: 'Type of Care',
    fields: [
      f('care_substance_use', 'Substance Use Treatment'),
      f('care_detoxification', 'Detoxification'),
      f('care_transitional_housing', 'Transitional Housing'),
      f('care_co_occurring_mental_substance', 'Co-Occurring Mental & Substance Use'),
    ],
  },
  {
    section: 'Special Programs',
    fields: [
      f('group_veterans', 'Veterans'),
      f('group_adolescents', 'Adolescents'),
      f('group_young_adults', 'Young Adults'),
      f('group_adult_women', 'Adult Women'),
      f('group_pregnant_women', 'Pregnant/Postpartum Women'),
      f('group_adult_men', 'Adult Men'),
      f('group_seniors', 'Seniors (65+)'),
      f('group_active_military', 'Active Duty Military'),
      f('group_military_families', 'Military Families'),
      f('group_criminal_justice', 'Criminal Justice Clients'),
      f('group_co_occurring_disorders', 'Co-Occurring Disorders'),
      f('group_hiv_aids', 'HIV/AIDS'),
      f('group_sexual_abuse', 'Sexual Abuse'),
      f('group_domestic_violence', 'Domestic Violence'),
      f('group_trauma', 'Trauma'),
      f('group_co_occurring_pain', 'Co-Occurring Pain'),
    ],
  },
  {
    section: 'Payment / Insurance',
    fields: [
      f('pay_medicaid', 'Medicaid'),
      f('pay_medicare', 'Medicare'),
      f('pay_private_insurance', 'Private Insurance'),
      f('pay_self_pay', 'Self-Pay'),
      f('pay_sliding_scale', 'Sliding Fee Scale'),
      f('pay_assistance', 'Payment Assistance'),
      f('pay_tricare', 'TRICARE'),
      f('pay_federal_funding', 'Federal/Military Insurance'),
      f('pay_no_payment', 'No Payment Accepted'),
    ],
  },
  {
    section: 'Opioid Treatment',
    fields: [
      f('opioid_methadone_maintenance', 'Methadone Maintenance'),
      f('opioid_buprenorphine_maintenance', 'Buprenorphine Maintenance'),
      f('opioid_naltrexone', 'Naltrexone'),
      f('opioid_certified_otp', 'Certified OTP'),
      f('opioid_methadone_detox', 'Methadone Detox'),
      f('opioid_buprenorphine_detox', 'Buprenorphine Detox'),
      f('opioid_prescribes_buprenorphine', 'Prescribes Buprenorphine'),
      f('opioid_prescribes_naltrexone', 'Prescribes Naltrexone'),
      f('opioid_relapse_naltrexone', 'Relapse Prevention w/ Naltrexone'),
      f('opioid_accepts_mat_elsewhere', 'Accepts MAT from Elsewhere'),
      f('opioid_no_mat', 'No MAT'),
      f('opioid_no_treatment', 'No Opioid Treatment'),
    ],
  },
  {
    section: 'Treatment Approaches',
    fields: [
      f('approach_cbt', 'CBT'),
      f('approach_dbt', 'DBT'),
      f('approach_motivational_interviewing', 'Motivational Interviewing'),
      f('approach_trauma_counseling', 'Trauma Counseling'),
      f('approach_12_step', '12-Step Facilitation'),
      f('approach_brief_intervention', 'Brief Intervention'),
      f('approach_contingency_management', 'Contingency Management'),
      f('approach_anger_management', 'Anger Management'),
      f('approach_matrix_model', 'Matrix Model'),
      f('approach_community_reinforcement', 'Community Reinforcement'),
      f('approach_relapse_prevention', 'Relapse Prevention'),
      f('approach_substance_use_counseling', 'Substance Use Counseling'),
      f('approach_telemedicine', 'Telemedicine'),
    ],
  },
  {
    section: 'Counseling',
    fields: [
      f('counseling_individual', 'Individual'),
      f('counseling_group', 'Group'),
      f('counseling_family', 'Family'),
      f('counseling_couples', 'Couples/Marital'),
    ],
  },
  {
    section: 'Testing & Screening',
    fields: [
      f('test_hiv', 'HIV Testing'),
      f('test_hepatitis_b', 'Hepatitis B Testing'),
      f('test_hepatitis_c', 'Hepatitis C Testing'),
      f('test_std', 'STD Testing'),
      f('test_tb', 'TB Screening'),
      f('test_drug_urine', 'Drug/Alcohol Urine Screening'),
      f('test_breathalyzer', 'Breathalyzer/Blood Alcohol'),
      f('test_metabolic', 'Metabolic Screening'),
    ],
  },
  {
    section: 'Support Services',
    fields: [
      f('service_case_management', 'Case Management'),
      f('service_mental_health', 'Mental Health Services'),
      f('service_employment', 'Employment Assistance'),
      f('service_transportation', 'Transportation'),
      f('service_housing', 'Housing Assistance'),
      f('service_peer_support', 'Peer Support'),
      f('service_self_help_groups', 'Self-Help Groups'),
      f('service_child_care', 'Child Care'),
      f('service_childrens_beds', "Children's Beds/Residential"),
      f('service_domestic_violence', 'Domestic Violence Services'),
      f('service_social_skills', 'Social Skills Development'),
      f('service_acupuncture', 'Acupuncture'),
      f('service_vocational', 'Vocational Training'),
      f('service_recovery_coach', 'Recovery Coach'),
      f('service_discharge_planning', 'Discharge Planning'),
      f('service_aftercare', 'Aftercare/Continuing Care'),
      f('service_naloxone_education', 'Naloxone Education'),
      f('service_outcome_followup', 'Outcome Follow-Up'),
    ],
  },
  {
    section: 'Medications',
    fields: [
      f('pharma_methadone', 'Methadone'),
      f('pharma_buprenorphine_naloxone', 'Buprenorphine/Naloxone'),
      f('pharma_buprenorphine_only', 'Buprenorphine (mono)'),
      f('pharma_buprenorphine_injectable', 'Buprenorphine Injectable'),
      f('pharma_buprenorphine_implant', 'Buprenorphine Implant'),
      f('pharma_naltrexone_oral', 'Naltrexone (oral)'),
      f('pharma_naltrexone_injectable', 'Naltrexone (injectable)'),
      f('pharma_acamprosate', 'Acamprosate'),
      f('pharma_disulfiram', 'Disulfiram'),
      f('pharma_nicotine_replacement', 'Nicotine Replacement'),
      f('pharma_non_nicotine_cessation', 'Non-Nicotine Cessation'),
      f('pharma_hiv_medications', 'HIV/Antiretroviral Meds'),
      f('pharma_hepatitis_c_medications', 'Hepatitis C Meds'),
      f('pharma_lofexidine', 'Lofexidine'),
      f('pharma_clonidine', 'Clonidine'),
      f('pharma_prep', 'PrEP'),
      f('pharma_mental_disorder_meds', 'Mental Disorder Meds'),
    ],
  },
  {
    section: 'Education',
    fields: [
      f('edu_hiv_aids', 'HIV/AIDS Education'),
      f('edu_hepatitis', 'Hepatitis Education'),
      f('edu_health_other', 'Health Education (other)'),
      f('edu_substance_use', 'Substance Use Education'),
      f('edu_tobacco_cessation', 'Tobacco Cessation Education'),
    ],
  },
  {
    section: 'Vaccinations',
    fields: [
      f('vaccine_hepatitis_a', 'Hepatitis A'),
      f('vaccine_hepatitis_b', 'Hepatitis B'),
    ],
  },
  {
    section: 'Detox Types',
    fields: [
      f('detox_alcohol', 'Alcohol Detox'),
      f('detox_benzodiazepines', 'Benzodiazepine Detox'),
      f('detox_cocaine', 'Cocaine Detox'),
      f('detox_methamphetamine', 'Methamphetamine Detox'),
      f('detox_opioids', 'Opioid Detox'),
      f('detox_medication_assisted', 'Medication-Assisted Detox'),
    ],
  },
  {
    section: 'Assessment',
    fields: [
      f('assess_mental_health', 'Mental Health Assessment'),
      f('assess_substance_use', 'Substance Use Assessment'),
      f('assess_physical_exam', 'Physical Exam'),
      f('assess_outreach', 'Outreach'),
      f('assess_screening_substance', 'Substance Use Screening'),
      f('assess_screening_mental', 'Mental Health Screening'),
      f('assess_screening_tobacco', 'Tobacco Screening'),
    ],
  },
  {
    section: 'Age Groups Served',
    fields: [
      f('age_children_adolescents', 'Children/Adolescents'),
      f('age_young_adults', 'Young Adults (18-25)'),
      f('age_adults', 'Adults'),
      f('age_seniors', 'Seniors (65+)'),
    ],
  },
  {
    section: 'Sex Accepted',
    fields: [
      f('sex_female', 'Female'),
      f('sex_male', 'Male'),
    ],
  },
  {
    section: 'DUI / DWI Programs',
    fields: [
      f('dui_program', 'DUI/DWI Program'),
      f('dui_only', 'DUI/DWI Offenders Only'),
    ],
  },
  {
    section: 'Smoking Policy',
    fields: [
      f('smoking_not_permitted', 'Smoking Not Permitted'),
      f('smoking_designated_area', 'Smoking in Designated Area'),
      f('smoking_permitted', 'Smoking Permitted'),
    ],
  },
  {
    section: 'Vaping Policy',
    fields: [
      f('vaping_not_permitted', 'Vaping Not Permitted'),
      f('vaping_designated_area', 'Vaping in Designated Area'),
      f('vaping_permitted', 'Vaping Permitted'),
    ],
  },
  {
    section: 'Languages',
    fields: [
      f('lang_spanish', 'Spanish'),
      f('lang_asl', 'ASL'),
      f('lang_native_american', 'Native American'),
      f('lang_other', 'Other Languages'),
      f('lang_arabic', 'Arabic'),
      f('lang_chinese', 'Chinese'),
      f('lang_creole', 'Creole'),
      f('lang_farsi', 'Farsi'),
      f('lang_french', 'French'),
      f('lang_german', 'German'),
      f('lang_greek', 'Greek'),
      f('lang_hebrew', 'Hebrew'),
      f('lang_hindi', 'Hindi'),
      f('lang_hmong', 'Hmong'),
      f('lang_italian', 'Italian'),
      f('lang_japanese', 'Japanese'),
      f('lang_korean', 'Korean'),
      f('lang_polish', 'Polish'),
      f('lang_portuguese', 'Portuguese'),
      f('lang_russian', 'Russian'),
      f('lang_tagalog', 'Tagalog'),
      f('lang_vietnamese', 'Vietnamese'),
    ],
  },
  {
    section: 'Facility Operation',
    fields: [
      f('op_private_forprofit', 'Private For-Profit'),
      f('op_private_nonprofit', 'Private Non-Profit'),
      f('op_state_gov', 'State Government'),
      f('op_local_gov', 'Local/County/Community Gov'),
      f('op_federal_gov', 'Federal Government'),
      f('op_va', 'Department of Veterans Affairs'),
      f('op_tribal', 'Tribal Government'),
      f('op_ihs', 'Indian Health Service'),
    ],
  },
  {
    section: 'Accreditation',
    fields: [
      f('accred_carf', 'CARF'),
      f('accred_joint_commission', 'Joint Commission'),
      f('accred_ncqa', 'NCQA'),
      f('accred_coa', 'COA'),
      f('accred_hfap', 'HFAP'),
      f('accred_state_substance_use', 'State Substance Use Agency'),
      f('accred_state_mental_health', 'State Mental Health Dept'),
      f('accred_state_health', 'State Health Dept'),
      f('accred_hospital_license', 'Hospital License'),
      f('accred_otp_certified', 'OTP Certified (SAMHSA)'),
      f('accred_dea', 'DEA'),
    ],
  },
  {
    section: 'Other',
    fields: [
      f('other_gambling_treatment', 'Gambling Disorder Treatment'),
      f('other_addiction_treatment', 'Internet/Gaming Addiction Treatment'),
      f('hospital_general', 'General Hospital'),
      f('hospital_psychiatric', 'Psychiatric Hospital'),
    ],
  },
];

/** Flat list of all facility field definitions */
export const allFacilityFields = facilityFieldGroups.flatMap((g) => g.fields);

/** Map from DB column name to field def */
export const facilityFieldByDbCol = new Map(allFacilityFields.map((f) => [f.dbCol, f]));

/** Map from camelCase key to field def */
export const facilityFieldByKey = new Map(allFacilityFields.map((f) => [f.key, f]));
