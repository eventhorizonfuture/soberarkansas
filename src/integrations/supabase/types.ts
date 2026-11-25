export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      counties: {
        Row: {
          access_line: string
          access_line_label: string
          created_at: string
          crisis_line: string
          id: string
          name: string
          notes: string
          slug: string
          updated_at: string
        }
        Insert: {
          access_line?: string
          access_line_label?: string
          created_at?: string
          crisis_line?: string
          id?: string
          name: string
          notes?: string
          slug: string
          updated_at?: string
        }
        Update: {
          access_line?: string
          access_line_label?: string
          created_at?: string
          crisis_line?: string
          id?: string
          name?: string
          notes?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      county_resources: {
        Row: {
          category: string
          county_id: string | null
          created_at: string
          description: string
          id: string
          phone: string
          sort_order: number
          title: string
          updated_at: string
          website: string
        }
        Insert: {
          category?: string
          county_id?: string | null
          created_at?: string
          description?: string
          id?: string
          phone?: string
          sort_order?: number
          title: string
          updated_at?: string
          website?: string
        }
        Update: {
          category?: string
          county_id?: string | null
          created_at?: string
          description?: string
          id?: string
          phone?: string
          sort_order?: number
          title?: string
          updated_at?: string
          website?: string
        }
        Relationships: [
          {
            foreignKeyName: "county_resources_county_id_fkey"
            columns: ["county_id"]
            isOneToOne: false
            referencedRelation: "counties"
            referencedColumns: ["id"]
          },
        ]
      }
      facility_submissions: {
        Row: {
          category: string
          city: string
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at: string
          facility_name: string
          id: string
          notes: string
          status: string
          website: string
        }
        Insert: {
          category: string
          city: string
          contact_email: string
          contact_name: string
          contact_phone?: string
          created_at?: string
          facility_name: string
          id?: string
          notes?: string
          status?: string
          website?: string
        }
        Update: {
          category?: string
          city?: string
          contact_email?: string
          contact_name?: string
          contact_phone?: string
          created_at?: string
          facility_name?: string
          id?: string
          notes?: string
          status?: string
          website?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings_public"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_inquiries: {
        Row: {
          city: string
          contact_name: string
          created_at: string
          delivery_status: string
          email: string
          facility_name: string
          id: string
          listing_type: string
          message: string
          phone: string
        }
        Insert: {
          city?: string
          contact_name: string
          created_at?: string
          delivery_status?: string
          email: string
          facility_name: string
          id: string
          listing_type?: string
          message?: string
          phone?: string
        }
        Update: {
          city?: string
          contact_name?: string
          created_at?: string
          delivery_status?: string
          email?: string
          facility_name?: string
          id?: string
          listing_type?: string
          message?: string
          phone?: string
        }
        Relationships: []
      }
      featured_listings: {
        Row: {
          city: string
          created_at: string
          id: string
          listing_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city: string
          created_at?: string
          id?: string
          listing_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          listing_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_listings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "featured_listings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings_public"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          accepts_medi_cal: boolean
          accepts_medicaid: boolean
          accepts_private_pay: boolean
          accred_carf: boolean
          accred_coa: boolean
          accred_dea: boolean
          accred_hfap: boolean
          accred_hospital_license: boolean
          accred_joint_commission: boolean
          accred_ncqa: boolean
          accred_otp_certified: boolean
          accred_state_health: boolean
          accred_state_mental_health: boolean
          accred_state_substance_use: boolean
          address: string
          age_adults: boolean
          age_children_adolescents: boolean
          age_seniors: boolean
          age_young_adults: boolean
          approach_12_step: boolean
          approach_anger_management: boolean
          approach_brief_intervention: boolean
          approach_cbt: boolean
          approach_community_reinforcement: boolean
          approach_contingency_management: boolean
          approach_dbt: boolean
          approach_matrix_model: boolean
          approach_motivational_interviewing: boolean
          approach_relapse_prevention: boolean
          approach_substance_use_counseling: boolean
          approach_telemedicine: boolean
          approach_trauma_counseling: boolean
          assess_mental_health: boolean
          assess_outreach: boolean
          assess_physical_exam: boolean
          assess_screening_mental: boolean
          assess_screening_substance: boolean
          assess_screening_tobacco: boolean
          assess_substance_use: boolean
          beds: number
          care_co_occurring_mental_substance: boolean
          care_detoxification: boolean
          care_substance_use: boolean
          care_transitional_housing: boolean
          category: string[]
          city: string
          counseling_couples: boolean
          counseling_family: boolean
          counseling_group: boolean
          counseling_individual: boolean
          county: string
          created_at: string
          description: string
          detox_alcohol: boolean
          detox_available: boolean
          detox_benzodiazepines: boolean
          detox_cocaine: boolean
          detox_medication_assisted: boolean
          detox_methamphetamine: boolean
          detox_opioids: boolean
          dui_only: boolean
          dui_program: boolean
          edu_health_other: boolean
          edu_hepatitis: boolean
          edu_hiv_aids: boolean
          edu_substance_use: boolean
          edu_tobacco_cessation: boolean
          email: string
          evening_groups: boolean
          facebook_url: string
          features: string[]
          gender: string
          group_active_military: boolean
          group_adolescents: boolean
          group_adult_men: boolean
          group_adult_women: boolean
          group_co_occurring_disorders: boolean
          group_co_occurring_pain: boolean
          group_criminal_justice: boolean
          group_domestic_violence: boolean
          group_hiv_aids: boolean
          group_military_families: boolean
          group_pregnant_women: boolean
          group_seniors: boolean
          group_sexual_abuse: boolean
          group_trauma: boolean
          group_veterans: boolean
          group_young_adults: boolean
          hospital_general: boolean
          hospital_psychiatric: boolean
          id: string
          image: string
          images: string[]
          insurance_verification_url: string
          lang_arabic: boolean
          lang_asl: boolean
          lang_chinese: boolean
          lang_creole: boolean
          lang_farsi: boolean
          lang_french: boolean
          lang_german: boolean
          lang_greek: boolean
          lang_hebrew: boolean
          lang_hindi: boolean
          lang_hmong: boolean
          lang_italian: boolean
          lang_japanese: boolean
          lang_korean: boolean
          lang_native_american: boolean
          lang_other: boolean
          lang_polish: boolean
          lang_portuguese: boolean
          lang_russian: boolean
          lang_spanish: boolean
          lang_tagalog: boolean
          lang_vietnamese: boolean
          lat: number
          length_of_stay: string
          level_iop: boolean
          level_op: boolean
          level_php: boolean
          lng: number
          mat_available: boolean
          name: string
          op_federal_gov: boolean
          op_ihs: boolean
          op_local_gov: boolean
          op_private_forprofit: boolean
          op_private_nonprofit: boolean
          op_state_gov: boolean
          op_tribal: boolean
          op_va: boolean
          opioid_accepts_mat_elsewhere: boolean
          opioid_buprenorphine_detox: boolean
          opioid_buprenorphine_maintenance: boolean
          opioid_certified_otp: boolean
          opioid_methadone_detox: boolean
          opioid_methadone_maintenance: boolean
          opioid_naltrexone: boolean
          opioid_no_mat: boolean
          opioid_no_treatment: boolean
          opioid_prescribes_buprenorphine: boolean
          opioid_prescribes_naltrexone: boolean
          opioid_relapse_naltrexone: boolean
          other_addiction_treatment: boolean
          other_gambling_treatment: boolean
          otp_available: boolean
          pay_assistance: boolean
          pay_federal_funding: boolean
          pay_medicaid: boolean
          pay_medicare: boolean
          pay_no_payment: boolean
          pay_private_insurance: boolean
          pay_self_pay: boolean
          pay_sliding_scale: boolean
          pay_tricare: boolean
          pharma_acamprosate: boolean
          pharma_buprenorphine_implant: boolean
          pharma_buprenorphine_injectable: boolean
          pharma_buprenorphine_naloxone: boolean
          pharma_buprenorphine_only: boolean
          pharma_clonidine: boolean
          pharma_disulfiram: boolean
          pharma_hepatitis_c_medications: boolean
          pharma_hiv_medications: boolean
          pharma_lofexidine: boolean
          pharma_mental_disorder_meds: boolean
          pharma_methadone: boolean
          pharma_naltrexone_injectable: boolean
          pharma_naltrexone_oral: boolean
          pharma_nicotine_replacement: boolean
          pharma_non_nicotine_cessation: boolean
          pharma_prep: boolean
          phone: string
          price_range: string
          service_acupuncture: boolean
          service_aftercare: boolean
          service_case_management: boolean
          service_child_care: boolean
          service_childrens_beds: boolean
          service_discharge_planning: boolean
          service_domestic_violence: boolean
          service_employment: boolean
          service_housing: boolean
          service_mental_health: boolean
          service_naloxone_education: boolean
          service_outcome_followup: boolean
          service_peer_support: boolean
          service_recovery_coach: boolean
          service_self_help_groups: boolean
          service_social_skills: boolean
          service_transportation: boolean
          service_vocational: boolean
          setting_inpatient: boolean
          setting_intensive_outpatient: boolean
          setting_long_term_residential: boolean
          setting_outpatient: boolean
          setting_outpatient_detox: boolean
          setting_outpatient_methadone: boolean
          setting_partial_hospitalization: boolean
          setting_residential: boolean
          setting_residential_detox: boolean
          setting_short_term_residential: boolean
          setting_telehealth: boolean
          sex_female: boolean
          sex_male: boolean
          smoking_designated_area: boolean
          smoking_not_permitted: boolean
          smoking_permitted: boolean
          telehealth_available: boolean
          test_breathalyzer: boolean
          test_drug_urine: boolean
          test_hepatitis_b: boolean
          test_hepatitis_c: boolean
          test_hiv: boolean
          test_metabolic: boolean
          test_std: boolean
          test_tb: boolean
          updated_at: string
          vaccine_hepatitis_a: boolean
          vaccine_hepatitis_b: boolean
          vaping_designated_area: boolean
          vaping_not_permitted: boolean
          vaping_permitted: boolean
          website: string
          youtube_url: string
          zip_code: string
        }
        Insert: {
          accepts_medi_cal?: boolean
          accepts_medicaid?: boolean
          accepts_private_pay?: boolean
          accred_carf?: boolean
          accred_coa?: boolean
          accred_dea?: boolean
          accred_hfap?: boolean
          accred_hospital_license?: boolean
          accred_joint_commission?: boolean
          accred_ncqa?: boolean
          accred_otp_certified?: boolean
          accred_state_health?: boolean
          accred_state_mental_health?: boolean
          accred_state_substance_use?: boolean
          address: string
          age_adults?: boolean
          age_children_adolescents?: boolean
          age_seniors?: boolean
          age_young_adults?: boolean
          approach_12_step?: boolean
          approach_anger_management?: boolean
          approach_brief_intervention?: boolean
          approach_cbt?: boolean
          approach_community_reinforcement?: boolean
          approach_contingency_management?: boolean
          approach_dbt?: boolean
          approach_matrix_model?: boolean
          approach_motivational_interviewing?: boolean
          approach_relapse_prevention?: boolean
          approach_substance_use_counseling?: boolean
          approach_telemedicine?: boolean
          approach_trauma_counseling?: boolean
          assess_mental_health?: boolean
          assess_outreach?: boolean
          assess_physical_exam?: boolean
          assess_screening_mental?: boolean
          assess_screening_substance?: boolean
          assess_screening_tobacco?: boolean
          assess_substance_use?: boolean
          beds?: number
          care_co_occurring_mental_substance?: boolean
          care_detoxification?: boolean
          care_substance_use?: boolean
          care_transitional_housing?: boolean
          category?: string[]
          city: string
          counseling_couples?: boolean
          counseling_family?: boolean
          counseling_group?: boolean
          counseling_individual?: boolean
          county?: string
          created_at?: string
          description?: string
          detox_alcohol?: boolean
          detox_available?: boolean
          detox_benzodiazepines?: boolean
          detox_cocaine?: boolean
          detox_medication_assisted?: boolean
          detox_methamphetamine?: boolean
          detox_opioids?: boolean
          dui_only?: boolean
          dui_program?: boolean
          edu_health_other?: boolean
          edu_hepatitis?: boolean
          edu_hiv_aids?: boolean
          edu_substance_use?: boolean
          edu_tobacco_cessation?: boolean
          email?: string
          evening_groups?: boolean
          facebook_url?: string
          features?: string[]
          gender?: string
          group_active_military?: boolean
          group_adolescents?: boolean
          group_adult_men?: boolean
          group_adult_women?: boolean
          group_co_occurring_disorders?: boolean
          group_co_occurring_pain?: boolean
          group_criminal_justice?: boolean
          group_domestic_violence?: boolean
          group_hiv_aids?: boolean
          group_military_families?: boolean
          group_pregnant_women?: boolean
          group_seniors?: boolean
          group_sexual_abuse?: boolean
          group_trauma?: boolean
          group_veterans?: boolean
          group_young_adults?: boolean
          hospital_general?: boolean
          hospital_psychiatric?: boolean
          id?: string
          image?: string
          images?: string[]
          insurance_verification_url?: string
          lang_arabic?: boolean
          lang_asl?: boolean
          lang_chinese?: boolean
          lang_creole?: boolean
          lang_farsi?: boolean
          lang_french?: boolean
          lang_german?: boolean
          lang_greek?: boolean
          lang_hebrew?: boolean
          lang_hindi?: boolean
          lang_hmong?: boolean
          lang_italian?: boolean
          lang_japanese?: boolean
          lang_korean?: boolean
          lang_native_american?: boolean
          lang_other?: boolean
          lang_polish?: boolean
          lang_portuguese?: boolean
          lang_russian?: boolean
          lang_spanish?: boolean
          lang_tagalog?: boolean
          lang_vietnamese?: boolean
          lat: number
          length_of_stay?: string
          level_iop?: boolean
          level_op?: boolean
          level_php?: boolean
          lng: number
          mat_available?: boolean
          name: string
          op_federal_gov?: boolean
          op_ihs?: boolean
          op_local_gov?: boolean
          op_private_forprofit?: boolean
          op_private_nonprofit?: boolean
          op_state_gov?: boolean
          op_tribal?: boolean
          op_va?: boolean
          opioid_accepts_mat_elsewhere?: boolean
          opioid_buprenorphine_detox?: boolean
          opioid_buprenorphine_maintenance?: boolean
          opioid_certified_otp?: boolean
          opioid_methadone_detox?: boolean
          opioid_methadone_maintenance?: boolean
          opioid_naltrexone?: boolean
          opioid_no_mat?: boolean
          opioid_no_treatment?: boolean
          opioid_prescribes_buprenorphine?: boolean
          opioid_prescribes_naltrexone?: boolean
          opioid_relapse_naltrexone?: boolean
          other_addiction_treatment?: boolean
          other_gambling_treatment?: boolean
          otp_available?: boolean
          pay_assistance?: boolean
          pay_federal_funding?: boolean
          pay_medicaid?: boolean
          pay_medicare?: boolean
          pay_no_payment?: boolean
          pay_private_insurance?: boolean
          pay_self_pay?: boolean
          pay_sliding_scale?: boolean
          pay_tricare?: boolean
          pharma_acamprosate?: boolean
          pharma_buprenorphine_implant?: boolean
          pharma_buprenorphine_injectable?: boolean
          pharma_buprenorphine_naloxone?: boolean
          pharma_buprenorphine_only?: boolean
          pharma_clonidine?: boolean
          pharma_disulfiram?: boolean
          pharma_hepatitis_c_medications?: boolean
          pharma_hiv_medications?: boolean
          pharma_lofexidine?: boolean
          pharma_mental_disorder_meds?: boolean
          pharma_methadone?: boolean
          pharma_naltrexone_injectable?: boolean
          pharma_naltrexone_oral?: boolean
          pharma_nicotine_replacement?: boolean
          pharma_non_nicotine_cessation?: boolean
          pharma_prep?: boolean
          phone?: string
          price_range?: string
          service_acupuncture?: boolean
          service_aftercare?: boolean
          service_case_management?: boolean
          service_child_care?: boolean
          service_childrens_beds?: boolean
          service_discharge_planning?: boolean
          service_domestic_violence?: boolean
          service_employment?: boolean
          service_housing?: boolean
          service_mental_health?: boolean
          service_naloxone_education?: boolean
          service_outcome_followup?: boolean
          service_peer_support?: boolean
          service_recovery_coach?: boolean
          service_self_help_groups?: boolean
          service_social_skills?: boolean
          service_transportation?: boolean
          service_vocational?: boolean
          setting_inpatient?: boolean
          setting_intensive_outpatient?: boolean
          setting_long_term_residential?: boolean
          setting_outpatient?: boolean
          setting_outpatient_detox?: boolean
          setting_outpatient_methadone?: boolean
          setting_partial_hospitalization?: boolean
          setting_residential?: boolean
          setting_residential_detox?: boolean
          setting_short_term_residential?: boolean
          setting_telehealth?: boolean
          sex_female?: boolean
          sex_male?: boolean
          smoking_designated_area?: boolean
          smoking_not_permitted?: boolean
          smoking_permitted?: boolean
          telehealth_available?: boolean
          test_breathalyzer?: boolean
          test_drug_urine?: boolean
          test_hepatitis_b?: boolean
          test_hepatitis_c?: boolean
          test_hiv?: boolean
          test_metabolic?: boolean
          test_std?: boolean
          test_tb?: boolean
          updated_at?: string
          vaccine_hepatitis_a?: boolean
          vaccine_hepatitis_b?: boolean
          vaping_designated_area?: boolean
          vaping_not_permitted?: boolean
          vaping_permitted?: boolean
          website?: string
          youtube_url?: string
          zip_code?: string
        }
        Update: {
          accepts_medi_cal?: boolean
          accepts_medicaid?: boolean
          accepts_private_pay?: boolean
          accred_carf?: boolean
          accred_coa?: boolean
          accred_dea?: boolean
          accred_hfap?: boolean
          accred_hospital_license?: boolean
          accred_joint_commission?: boolean
          accred_ncqa?: boolean
          accred_otp_certified?: boolean
          accred_state_health?: boolean
          accred_state_mental_health?: boolean
          accred_state_substance_use?: boolean
          address?: string
          age_adults?: boolean
          age_children_adolescents?: boolean
          age_seniors?: boolean
          age_young_adults?: boolean
          approach_12_step?: boolean
          approach_anger_management?: boolean
          approach_brief_intervention?: boolean
          approach_cbt?: boolean
          approach_community_reinforcement?: boolean
          approach_contingency_management?: boolean
          approach_dbt?: boolean
          approach_matrix_model?: boolean
          approach_motivational_interviewing?: boolean
          approach_relapse_prevention?: boolean
          approach_substance_use_counseling?: boolean
          approach_telemedicine?: boolean
          approach_trauma_counseling?: boolean
          assess_mental_health?: boolean
          assess_outreach?: boolean
          assess_physical_exam?: boolean
          assess_screening_mental?: boolean
          assess_screening_substance?: boolean
          assess_screening_tobacco?: boolean
          assess_substance_use?: boolean
          beds?: number
          care_co_occurring_mental_substance?: boolean
          care_detoxification?: boolean
          care_substance_use?: boolean
          care_transitional_housing?: boolean
          category?: string[]
          city?: string
          counseling_couples?: boolean
          counseling_family?: boolean
          counseling_group?: boolean
          counseling_individual?: boolean
          county?: string
          created_at?: string
          description?: string
          detox_alcohol?: boolean
          detox_available?: boolean
          detox_benzodiazepines?: boolean
          detox_cocaine?: boolean
          detox_medication_assisted?: boolean
          detox_methamphetamine?: boolean
          detox_opioids?: boolean
          dui_only?: boolean
          dui_program?: boolean
          edu_health_other?: boolean
          edu_hepatitis?: boolean
          edu_hiv_aids?: boolean
          edu_substance_use?: boolean
          edu_tobacco_cessation?: boolean
          email?: string
          evening_groups?: boolean
          facebook_url?: string
          features?: string[]
          gender?: string
          group_active_military?: boolean
          group_adolescents?: boolean
          group_adult_men?: boolean
          group_adult_women?: boolean
          group_co_occurring_disorders?: boolean
          group_co_occurring_pain?: boolean
          group_criminal_justice?: boolean
          group_domestic_violence?: boolean
          group_hiv_aids?: boolean
          group_military_families?: boolean
          group_pregnant_women?: boolean
          group_seniors?: boolean
          group_sexual_abuse?: boolean
          group_trauma?: boolean
          group_veterans?: boolean
          group_young_adults?: boolean
          hospital_general?: boolean
          hospital_psychiatric?: boolean
          id?: string
          image?: string
          images?: string[]
          insurance_verification_url?: string
          lang_arabic?: boolean
          lang_asl?: boolean
          lang_chinese?: boolean
          lang_creole?: boolean
          lang_farsi?: boolean
          lang_french?: boolean
          lang_german?: boolean
          lang_greek?: boolean
          lang_hebrew?: boolean
          lang_hindi?: boolean
          lang_hmong?: boolean
          lang_italian?: boolean
          lang_japanese?: boolean
          lang_korean?: boolean
          lang_native_american?: boolean
          lang_other?: boolean
          lang_polish?: boolean
          lang_portuguese?: boolean
          lang_russian?: boolean
          lang_spanish?: boolean
          lang_tagalog?: boolean
          lang_vietnamese?: boolean
          lat?: number
          length_of_stay?: string
          level_iop?: boolean
          level_op?: boolean
          level_php?: boolean
          lng?: number
          mat_available?: boolean
          name?: string
          op_federal_gov?: boolean
          op_ihs?: boolean
          op_local_gov?: boolean
          op_private_forprofit?: boolean
          op_private_nonprofit?: boolean
          op_state_gov?: boolean
          op_tribal?: boolean
          op_va?: boolean
          opioid_accepts_mat_elsewhere?: boolean
          opioid_buprenorphine_detox?: boolean
          opioid_buprenorphine_maintenance?: boolean
          opioid_certified_otp?: boolean
          opioid_methadone_detox?: boolean
          opioid_methadone_maintenance?: boolean
          opioid_naltrexone?: boolean
          opioid_no_mat?: boolean
          opioid_no_treatment?: boolean
          opioid_prescribes_buprenorphine?: boolean
          opioid_prescribes_naltrexone?: boolean
          opioid_relapse_naltrexone?: boolean
          other_addiction_treatment?: boolean
          other_gambling_treatment?: boolean
          otp_available?: boolean
          pay_assistance?: boolean
          pay_federal_funding?: boolean
          pay_medicaid?: boolean
          pay_medicare?: boolean
          pay_no_payment?: boolean
          pay_private_insurance?: boolean
          pay_self_pay?: boolean
          pay_sliding_scale?: boolean
          pay_tricare?: boolean
          pharma_acamprosate?: boolean
          pharma_buprenorphine_implant?: boolean
          pharma_buprenorphine_injectable?: boolean
          pharma_buprenorphine_naloxone?: boolean
          pharma_buprenorphine_only?: boolean
          pharma_clonidine?: boolean
          pharma_disulfiram?: boolean
          pharma_hepatitis_c_medications?: boolean
          pharma_hiv_medications?: boolean
          pharma_lofexidine?: boolean
          pharma_mental_disorder_meds?: boolean
          pharma_methadone?: boolean
          pharma_naltrexone_injectable?: boolean
          pharma_naltrexone_oral?: boolean
          pharma_nicotine_replacement?: boolean
          pharma_non_nicotine_cessation?: boolean
          pharma_prep?: boolean
          phone?: string
          price_range?: string
          service_acupuncture?: boolean
          service_aftercare?: boolean
          service_case_management?: boolean
          service_child_care?: boolean
          service_childrens_beds?: boolean
          service_discharge_planning?: boolean
          service_domestic_violence?: boolean
          service_employment?: boolean
          service_housing?: boolean
          service_mental_health?: boolean
          service_naloxone_education?: boolean
          service_outcome_followup?: boolean
          service_peer_support?: boolean
          service_recovery_coach?: boolean
          service_self_help_groups?: boolean
          service_social_skills?: boolean
          service_transportation?: boolean
          service_vocational?: boolean
          setting_inpatient?: boolean
          setting_intensive_outpatient?: boolean
          setting_long_term_residential?: boolean
          setting_outpatient?: boolean
          setting_outpatient_detox?: boolean
          setting_outpatient_methadone?: boolean
          setting_partial_hospitalization?: boolean
          setting_residential?: boolean
          setting_residential_detox?: boolean
          setting_short_term_residential?: boolean
          setting_telehealth?: boolean
          sex_female?: boolean
          sex_male?: boolean
          smoking_designated_area?: boolean
          smoking_not_permitted?: boolean
          smoking_permitted?: boolean
          telehealth_available?: boolean
          test_breathalyzer?: boolean
          test_drug_urine?: boolean
          test_hepatitis_b?: boolean
          test_hepatitis_c?: boolean
          test_hiv?: boolean
          test_metabolic?: boolean
          test_std?: boolean
          test_tb?: boolean
          updated_at?: string
          vaccine_hepatitis_a?: boolean
          vaccine_hepatitis_b?: boolean
          vaping_designated_area?: boolean
          vaping_not_permitted?: boolean
          vaping_permitted?: boolean
          website?: string
          youtube_url?: string
          zip_code?: string
        }
        Relationships: []
      }
      recovery_houses: {
        Row: {
          bed_count: number
          city: string
          county: string
          created_at: string
          doing_business_as: string
          handicap_accessible: string
          id: string
          name: string
          narr_level: string
          phone: string
          special_population: string
          target_population: string
          updated_at: string
          website: string
          zip_code: string
        }
        Insert: {
          bed_count?: number
          city?: string
          county?: string
          created_at?: string
          doing_business_as?: string
          handicap_accessible?: string
          id?: string
          name?: string
          narr_level?: string
          phone?: string
          special_population?: string
          target_population?: string
          updated_at?: string
          website?: string
          zip_code?: string
        }
        Update: {
          bed_count?: number
          city?: string
          county?: string
          created_at?: string
          doing_business_as?: string
          handicap_accessible?: string
          id?: string
          name?: string
          narr_level?: string
          phone?: string
          special_population?: string
          target_population?: string
          updated_at?: string
          website?: string
          zip_code?: string
        }
        Relationships: []
      }
      resource_suggestions: {
        Row: {
          county: string
          created_at: string
          details: string
          email: string
          id: string
          name: string
          resource_title: string
          status: string
        }
        Insert: {
          county?: string
          created_at?: string
          details?: string
          email: string
          id?: string
          name: string
          resource_title: string
          status?: string
        }
        Update: {
          county?: string
          created_at?: string
          details?: string
          email?: string
          id?: string
          name?: string
          resource_title?: string
          status?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      featured_listings_public: {
        Row: {
          city: string | null
          id: string | null
          listing_id: string | null
          status: string | null
          tier: string | null
        }
        Insert: {
          city?: string | null
          id?: string | null
          listing_id?: string | null
          status?: string | null
          tier?: string | null
        }
        Update: {
          city?: string | null
          id?: string | null
          listing_id?: string | null
          status?: string | null
          tier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "featured_listings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "featured_listings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings_public"
            referencedColumns: ["id"]
          },
        ]
      }
      listings_public: {
        Row: {
          accepts_medi_cal: boolean | null
          accepts_medicaid: boolean | null
          accepts_private_pay: boolean | null
          accred_carf: boolean | null
          accred_coa: boolean | null
          accred_dea: boolean | null
          accred_hfap: boolean | null
          accred_hospital_license: boolean | null
          accred_joint_commission: boolean | null
          accred_ncqa: boolean | null
          accred_otp_certified: boolean | null
          accred_state_health: boolean | null
          accred_state_mental_health: boolean | null
          accred_state_substance_use: boolean | null
          address: string | null
          age_adults: boolean | null
          age_children_adolescents: boolean | null
          age_seniors: boolean | null
          age_young_adults: boolean | null
          approach_12_step: boolean | null
          approach_anger_management: boolean | null
          approach_brief_intervention: boolean | null
          approach_cbt: boolean | null
          approach_community_reinforcement: boolean | null
          approach_contingency_management: boolean | null
          approach_dbt: boolean | null
          approach_matrix_model: boolean | null
          approach_motivational_interviewing: boolean | null
          approach_relapse_prevention: boolean | null
          approach_substance_use_counseling: boolean | null
          approach_telemedicine: boolean | null
          approach_trauma_counseling: boolean | null
          assess_mental_health: boolean | null
          assess_outreach: boolean | null
          assess_physical_exam: boolean | null
          assess_screening_mental: boolean | null
          assess_screening_substance: boolean | null
          assess_screening_tobacco: boolean | null
          assess_substance_use: boolean | null
          beds: number | null
          care_co_occurring_mental_substance: boolean | null
          care_detoxification: boolean | null
          care_substance_use: boolean | null
          care_transitional_housing: boolean | null
          category: string[] | null
          city: string | null
          counseling_couples: boolean | null
          counseling_family: boolean | null
          counseling_group: boolean | null
          counseling_individual: boolean | null
          county: string | null
          created_at: string | null
          description: string | null
          detox_alcohol: boolean | null
          detox_available: boolean | null
          detox_benzodiazepines: boolean | null
          detox_cocaine: boolean | null
          detox_medication_assisted: boolean | null
          detox_methamphetamine: boolean | null
          detox_opioids: boolean | null
          dui_only: boolean | null
          dui_program: boolean | null
          edu_health_other: boolean | null
          edu_hepatitis: boolean | null
          edu_hiv_aids: boolean | null
          edu_substance_use: boolean | null
          edu_tobacco_cessation: boolean | null
          email: string | null
          evening_groups: boolean | null
          facebook_url: string | null
          features: string[] | null
          gender: string | null
          group_active_military: boolean | null
          group_adolescents: boolean | null
          group_adult_men: boolean | null
          group_adult_women: boolean | null
          group_co_occurring_disorders: boolean | null
          group_co_occurring_pain: boolean | null
          group_criminal_justice: boolean | null
          group_domestic_violence: boolean | null
          group_hiv_aids: boolean | null
          group_military_families: boolean | null
          group_pregnant_women: boolean | null
          group_seniors: boolean | null
          group_sexual_abuse: boolean | null
          group_trauma: boolean | null
          group_veterans: boolean | null
          group_young_adults: boolean | null
          hospital_general: boolean | null
          hospital_psychiatric: boolean | null
          id: string | null
          image: string | null
          images: string[] | null
          insurance_verification_url: string | null
          lang_arabic: boolean | null
          lang_asl: boolean | null
          lang_chinese: boolean | null
          lang_creole: boolean | null
          lang_farsi: boolean | null
          lang_french: boolean | null
          lang_german: boolean | null
          lang_greek: boolean | null
          lang_hebrew: boolean | null
          lang_hindi: boolean | null
          lang_hmong: boolean | null
          lang_italian: boolean | null
          lang_japanese: boolean | null
          lang_korean: boolean | null
          lang_native_american: boolean | null
          lang_other: boolean | null
          lang_polish: boolean | null
          lang_portuguese: boolean | null
          lang_russian: boolean | null
          lang_spanish: boolean | null
          lang_tagalog: boolean | null
          lang_vietnamese: boolean | null
          lat: number | null
          length_of_stay: string | null
          level_iop: boolean | null
          level_op: boolean | null
          level_php: boolean | null
          lng: number | null
          mat_available: boolean | null
          name: string | null
          op_federal_gov: boolean | null
          op_ihs: boolean | null
          op_local_gov: boolean | null
          op_private_forprofit: boolean | null
          op_private_nonprofit: boolean | null
          op_state_gov: boolean | null
          op_tribal: boolean | null
          op_va: boolean | null
          opioid_accepts_mat_elsewhere: boolean | null
          opioid_buprenorphine_detox: boolean | null
          opioid_buprenorphine_maintenance: boolean | null
          opioid_certified_otp: boolean | null
          opioid_methadone_detox: boolean | null
          opioid_methadone_maintenance: boolean | null
          opioid_naltrexone: boolean | null
          opioid_no_mat: boolean | null
          opioid_no_treatment: boolean | null
          opioid_prescribes_buprenorphine: boolean | null
          opioid_prescribes_naltrexone: boolean | null
          opioid_relapse_naltrexone: boolean | null
          other_addiction_treatment: boolean | null
          other_gambling_treatment: boolean | null
          otp_available: boolean | null
          pay_assistance: boolean | null
          pay_federal_funding: boolean | null
          pay_medicaid: boolean | null
          pay_medicare: boolean | null
          pay_no_payment: boolean | null
          pay_private_insurance: boolean | null
          pay_self_pay: boolean | null
          pay_sliding_scale: boolean | null
          pay_tricare: boolean | null
          pharma_acamprosate: boolean | null
          pharma_buprenorphine_implant: boolean | null
          pharma_buprenorphine_injectable: boolean | null
          pharma_buprenorphine_naloxone: boolean | null
          pharma_buprenorphine_only: boolean | null
          pharma_clonidine: boolean | null
          pharma_disulfiram: boolean | null
          pharma_hepatitis_c_medications: boolean | null
          pharma_hiv_medications: boolean | null
          pharma_lofexidine: boolean | null
          pharma_mental_disorder_meds: boolean | null
          pharma_methadone: boolean | null
          pharma_naltrexone_injectable: boolean | null
          pharma_naltrexone_oral: boolean | null
          pharma_nicotine_replacement: boolean | null
          pharma_non_nicotine_cessation: boolean | null
          pharma_prep: boolean | null
          phone: string | null
          price_range: string | null
          service_acupuncture: boolean | null
          service_aftercare: boolean | null
          service_case_management: boolean | null
          service_child_care: boolean | null
          service_childrens_beds: boolean | null
          service_discharge_planning: boolean | null
          service_domestic_violence: boolean | null
          service_employment: boolean | null
          service_housing: boolean | null
          service_mental_health: boolean | null
          service_naloxone_education: boolean | null
          service_outcome_followup: boolean | null
          service_peer_support: boolean | null
          service_recovery_coach: boolean | null
          service_self_help_groups: boolean | null
          service_social_skills: boolean | null
          service_transportation: boolean | null
          service_vocational: boolean | null
          setting_inpatient: boolean | null
          setting_intensive_outpatient: boolean | null
          setting_long_term_residential: boolean | null
          setting_outpatient: boolean | null
          setting_outpatient_detox: boolean | null
          setting_outpatient_methadone: boolean | null
          setting_partial_hospitalization: boolean | null
          setting_residential: boolean | null
          setting_residential_detox: boolean | null
          setting_short_term_residential: boolean | null
          setting_telehealth: boolean | null
          sex_female: boolean | null
          sex_male: boolean | null
          smoking_designated_area: boolean | null
          smoking_not_permitted: boolean | null
          smoking_permitted: boolean | null
          telehealth_available: boolean | null
          test_breathalyzer: boolean | null
          test_drug_urine: boolean | null
          test_hepatitis_b: boolean | null
          test_hepatitis_c: boolean | null
          test_hiv: boolean | null
          test_metabolic: boolean | null
          test_std: boolean | null
          test_tb: boolean | null
          updated_at: string | null
          vaccine_hepatitis_a: boolean | null
          vaccine_hepatitis_b: boolean | null
          vaping_designated_area: boolean | null
          vaping_not_permitted: boolean | null
          vaping_permitted: boolean | null
          website: string | null
          youtube_url: string | null
          zip_code: string | null
        }
        Insert: {
          accepts_medi_cal?: boolean | null
          accepts_medicaid?: boolean | null
          accepts_private_pay?: boolean | null
          accred_carf?: boolean | null
          accred_coa?: boolean | null
          accred_dea?: boolean | null
          accred_hfap?: boolean | null
          accred_hospital_license?: boolean | null
          accred_joint_commission?: boolean | null
          accred_ncqa?: boolean | null
          accred_otp_certified?: boolean | null
          accred_state_health?: boolean | null
          accred_state_mental_health?: boolean | null
          accred_state_substance_use?: boolean | null
          address?: string | null
          age_adults?: boolean | null
          age_children_adolescents?: boolean | null
          age_seniors?: boolean | null
          age_young_adults?: boolean | null
          approach_12_step?: boolean | null
          approach_anger_management?: boolean | null
          approach_brief_intervention?: boolean | null
          approach_cbt?: boolean | null
          approach_community_reinforcement?: boolean | null
          approach_contingency_management?: boolean | null
          approach_dbt?: boolean | null
          approach_matrix_model?: boolean | null
          approach_motivational_interviewing?: boolean | null
          approach_relapse_prevention?: boolean | null
          approach_substance_use_counseling?: boolean | null
          approach_telemedicine?: boolean | null
          approach_trauma_counseling?: boolean | null
          assess_mental_health?: boolean | null
          assess_outreach?: boolean | null
          assess_physical_exam?: boolean | null
          assess_screening_mental?: boolean | null
          assess_screening_substance?: boolean | null
          assess_screening_tobacco?: boolean | null
          assess_substance_use?: boolean | null
          beds?: number | null
          care_co_occurring_mental_substance?: boolean | null
          care_detoxification?: boolean | null
          care_substance_use?: boolean | null
          care_transitional_housing?: boolean | null
          category?: string[] | null
          city?: string | null
          counseling_couples?: boolean | null
          counseling_family?: boolean | null
          counseling_group?: boolean | null
          counseling_individual?: boolean | null
          county?: string | null
          created_at?: string | null
          description?: string | null
          detox_alcohol?: boolean | null
          detox_available?: boolean | null
          detox_benzodiazepines?: boolean | null
          detox_cocaine?: boolean | null
          detox_medication_assisted?: boolean | null
          detox_methamphetamine?: boolean | null
          detox_opioids?: boolean | null
          dui_only?: boolean | null
          dui_program?: boolean | null
          edu_health_other?: boolean | null
          edu_hepatitis?: boolean | null
          edu_hiv_aids?: boolean | null
          edu_substance_use?: boolean | null
          edu_tobacco_cessation?: boolean | null
          email?: string | null
          evening_groups?: boolean | null
          facebook_url?: string | null
          features?: string[] | null
          gender?: string | null
          group_active_military?: boolean | null
          group_adolescents?: boolean | null
          group_adult_men?: boolean | null
          group_adult_women?: boolean | null
          group_co_occurring_disorders?: boolean | null
          group_co_occurring_pain?: boolean | null
          group_criminal_justice?: boolean | null
          group_domestic_violence?: boolean | null
          group_hiv_aids?: boolean | null
          group_military_families?: boolean | null
          group_pregnant_women?: boolean | null
          group_seniors?: boolean | null
          group_sexual_abuse?: boolean | null
          group_trauma?: boolean | null
          group_veterans?: boolean | null
          group_young_adults?: boolean | null
          hospital_general?: boolean | null
          hospital_psychiatric?: boolean | null
          id?: string | null
          image?: string | null
          images?: string[] | null
          insurance_verification_url?: string | null
          lang_arabic?: boolean | null
          lang_asl?: boolean | null
          lang_chinese?: boolean | null
          lang_creole?: boolean | null
          lang_farsi?: boolean | null
          lang_french?: boolean | null
          lang_german?: boolean | null
          lang_greek?: boolean | null
          lang_hebrew?: boolean | null
          lang_hindi?: boolean | null
          lang_hmong?: boolean | null
          lang_italian?: boolean | null
          lang_japanese?: boolean | null
          lang_korean?: boolean | null
          lang_native_american?: boolean | null
          lang_other?: boolean | null
          lang_polish?: boolean | null
          lang_portuguese?: boolean | null
          lang_russian?: boolean | null
          lang_spanish?: boolean | null
          lang_tagalog?: boolean | null
          lang_vietnamese?: boolean | null
          lat?: number | null
          length_of_stay?: string | null
          level_iop?: boolean | null
          level_op?: boolean | null
          level_php?: boolean | null
          lng?: number | null
          mat_available?: boolean | null
          name?: string | null
          op_federal_gov?: boolean | null
          op_ihs?: boolean | null
          op_local_gov?: boolean | null
          op_private_forprofit?: boolean | null
          op_private_nonprofit?: boolean | null
          op_state_gov?: boolean | null
          op_tribal?: boolean | null
          op_va?: boolean | null
          opioid_accepts_mat_elsewhere?: boolean | null
          opioid_buprenorphine_detox?: boolean | null
          opioid_buprenorphine_maintenance?: boolean | null
          opioid_certified_otp?: boolean | null
          opioid_methadone_detox?: boolean | null
          opioid_methadone_maintenance?: boolean | null
          opioid_naltrexone?: boolean | null
          opioid_no_mat?: boolean | null
          opioid_no_treatment?: boolean | null
          opioid_prescribes_buprenorphine?: boolean | null
          opioid_prescribes_naltrexone?: boolean | null
          opioid_relapse_naltrexone?: boolean | null
          other_addiction_treatment?: boolean | null
          other_gambling_treatment?: boolean | null
          otp_available?: boolean | null
          pay_assistance?: boolean | null
          pay_federal_funding?: boolean | null
          pay_medicaid?: boolean | null
          pay_medicare?: boolean | null
          pay_no_payment?: boolean | null
          pay_private_insurance?: boolean | null
          pay_self_pay?: boolean | null
          pay_sliding_scale?: boolean | null
          pay_tricare?: boolean | null
          pharma_acamprosate?: boolean | null
          pharma_buprenorphine_implant?: boolean | null
          pharma_buprenorphine_injectable?: boolean | null
          pharma_buprenorphine_naloxone?: boolean | null
          pharma_buprenorphine_only?: boolean | null
          pharma_clonidine?: boolean | null
          pharma_disulfiram?: boolean | null
          pharma_hepatitis_c_medications?: boolean | null
          pharma_hiv_medications?: boolean | null
          pharma_lofexidine?: boolean | null
          pharma_mental_disorder_meds?: boolean | null
          pharma_methadone?: boolean | null
          pharma_naltrexone_injectable?: boolean | null
          pharma_naltrexone_oral?: boolean | null
          pharma_nicotine_replacement?: boolean | null
          pharma_non_nicotine_cessation?: boolean | null
          pharma_prep?: boolean | null
          phone?: never
          price_range?: string | null
          service_acupuncture?: boolean | null
          service_aftercare?: boolean | null
          service_case_management?: boolean | null
          service_child_care?: boolean | null
          service_childrens_beds?: boolean | null
          service_discharge_planning?: boolean | null
          service_domestic_violence?: boolean | null
          service_employment?: boolean | null
          service_housing?: boolean | null
          service_mental_health?: boolean | null
          service_naloxone_education?: boolean | null
          service_outcome_followup?: boolean | null
          service_peer_support?: boolean | null
          service_recovery_coach?: boolean | null
          service_self_help_groups?: boolean | null
          service_social_skills?: boolean | null
          service_transportation?: boolean | null
          service_vocational?: boolean | null
          setting_inpatient?: boolean | null
          setting_intensive_outpatient?: boolean | null
          setting_long_term_residential?: boolean | null
          setting_outpatient?: boolean | null
          setting_outpatient_detox?: boolean | null
          setting_outpatient_methadone?: boolean | null
          setting_partial_hospitalization?: boolean | null
          setting_residential?: boolean | null
          setting_residential_detox?: boolean | null
          setting_short_term_residential?: boolean | null
          setting_telehealth?: boolean | null
          sex_female?: boolean | null
          sex_male?: boolean | null
          smoking_designated_area?: boolean | null
          smoking_not_permitted?: boolean | null
          smoking_permitted?: boolean | null
          telehealth_available?: boolean | null
          test_breathalyzer?: boolean | null
          test_drug_urine?: boolean | null
          test_hepatitis_b?: boolean | null
          test_hepatitis_c?: boolean | null
          test_hiv?: boolean | null
          test_metabolic?: boolean | null
          test_std?: boolean | null
          test_tb?: boolean | null
          updated_at?: string | null
          vaccine_hepatitis_a?: boolean | null
          vaccine_hepatitis_b?: boolean | null
          vaping_designated_area?: boolean | null
          vaping_not_permitted?: boolean | null
          vaping_permitted?: boolean | null
          website?: string | null
          youtube_url?: string | null
          zip_code?: string | null
        }
        Update: {
          accepts_medi_cal?: boolean | null
          accepts_medicaid?: boolean | null
          accepts_private_pay?: boolean | null
          accred_carf?: boolean | null
          accred_coa?: boolean | null
          accred_dea?: boolean | null
          accred_hfap?: boolean | null
          accred_hospital_license?: boolean | null
          accred_joint_commission?: boolean | null
          accred_ncqa?: boolean | null
          accred_otp_certified?: boolean | null
          accred_state_health?: boolean | null
          accred_state_mental_health?: boolean | null
          accred_state_substance_use?: boolean | null
          address?: string | null
          age_adults?: boolean | null
          age_children_adolescents?: boolean | null
          age_seniors?: boolean | null
          age_young_adults?: boolean | null
          approach_12_step?: boolean | null
          approach_anger_management?: boolean | null
          approach_brief_intervention?: boolean | null
          approach_cbt?: boolean | null
          approach_community_reinforcement?: boolean | null
          approach_contingency_management?: boolean | null
          approach_dbt?: boolean | null
          approach_matrix_model?: boolean | null
          approach_motivational_interviewing?: boolean | null
          approach_relapse_prevention?: boolean | null
          approach_substance_use_counseling?: boolean | null
          approach_telemedicine?: boolean | null
          approach_trauma_counseling?: boolean | null
          assess_mental_health?: boolean | null
          assess_outreach?: boolean | null
          assess_physical_exam?: boolean | null
          assess_screening_mental?: boolean | null
          assess_screening_substance?: boolean | null
          assess_screening_tobacco?: boolean | null
          assess_substance_use?: boolean | null
          beds?: number | null
          care_co_occurring_mental_substance?: boolean | null
          care_detoxification?: boolean | null
          care_substance_use?: boolean | null
          care_transitional_housing?: boolean | null
          category?: string[] | null
          city?: string | null
          counseling_couples?: boolean | null
          counseling_family?: boolean | null
          counseling_group?: boolean | null
          counseling_individual?: boolean | null
          county?: string | null
          created_at?: string | null
          description?: string | null
          detox_alcohol?: boolean | null
          detox_available?: boolean | null
          detox_benzodiazepines?: boolean | null
          detox_cocaine?: boolean | null
          detox_medication_assisted?: boolean | null
          detox_methamphetamine?: boolean | null
          detox_opioids?: boolean | null
          dui_only?: boolean | null
          dui_program?: boolean | null
          edu_health_other?: boolean | null
          edu_hepatitis?: boolean | null
          edu_hiv_aids?: boolean | null
          edu_substance_use?: boolean | null
          edu_tobacco_cessation?: boolean | null
          email?: string | null
          evening_groups?: boolean | null
          facebook_url?: string | null
          features?: string[] | null
          gender?: string | null
          group_active_military?: boolean | null
          group_adolescents?: boolean | null
          group_adult_men?: boolean | null
          group_adult_women?: boolean | null
          group_co_occurring_disorders?: boolean | null
          group_co_occurring_pain?: boolean | null
          group_criminal_justice?: boolean | null
          group_domestic_violence?: boolean | null
          group_hiv_aids?: boolean | null
          group_military_families?: boolean | null
          group_pregnant_women?: boolean | null
          group_seniors?: boolean | null
          group_sexual_abuse?: boolean | null
          group_trauma?: boolean | null
          group_veterans?: boolean | null
          group_young_adults?: boolean | null
          hospital_general?: boolean | null
          hospital_psychiatric?: boolean | null
          id?: string | null
          image?: string | null
          images?: string[] | null
          insurance_verification_url?: string | null
          lang_arabic?: boolean | null
          lang_asl?: boolean | null
          lang_chinese?: boolean | null
          lang_creole?: boolean | null
          lang_farsi?: boolean | null
          lang_french?: boolean | null
          lang_german?: boolean | null
          lang_greek?: boolean | null
          lang_hebrew?: boolean | null
          lang_hindi?: boolean | null
          lang_hmong?: boolean | null
          lang_italian?: boolean | null
          lang_japanese?: boolean | null
          lang_korean?: boolean | null
          lang_native_american?: boolean | null
          lang_other?: boolean | null
          lang_polish?: boolean | null
          lang_portuguese?: boolean | null
          lang_russian?: boolean | null
          lang_spanish?: boolean | null
          lang_tagalog?: boolean | null
          lang_vietnamese?: boolean | null
          lat?: number | null
          length_of_stay?: string | null
          level_iop?: boolean | null
          level_op?: boolean | null
          level_php?: boolean | null
          lng?: number | null
          mat_available?: boolean | null
          name?: string | null
          op_federal_gov?: boolean | null
          op_ihs?: boolean | null
          op_local_gov?: boolean | null
          op_private_forprofit?: boolean | null
          op_private_nonprofit?: boolean | null
          op_state_gov?: boolean | null
          op_tribal?: boolean | null
          op_va?: boolean | null
          opioid_accepts_mat_elsewhere?: boolean | null
          opioid_buprenorphine_detox?: boolean | null
          opioid_buprenorphine_maintenance?: boolean | null
          opioid_certified_otp?: boolean | null
          opioid_methadone_detox?: boolean | null
          opioid_methadone_maintenance?: boolean | null
          opioid_naltrexone?: boolean | null
          opioid_no_mat?: boolean | null
          opioid_no_treatment?: boolean | null
          opioid_prescribes_buprenorphine?: boolean | null
          opioid_prescribes_naltrexone?: boolean | null
          opioid_relapse_naltrexone?: boolean | null
          other_addiction_treatment?: boolean | null
          other_gambling_treatment?: boolean | null
          otp_available?: boolean | null
          pay_assistance?: boolean | null
          pay_federal_funding?: boolean | null
          pay_medicaid?: boolean | null
          pay_medicare?: boolean | null
          pay_no_payment?: boolean | null
          pay_private_insurance?: boolean | null
          pay_self_pay?: boolean | null
          pay_sliding_scale?: boolean | null
          pay_tricare?: boolean | null
          pharma_acamprosate?: boolean | null
          pharma_buprenorphine_implant?: boolean | null
          pharma_buprenorphine_injectable?: boolean | null
          pharma_buprenorphine_naloxone?: boolean | null
          pharma_buprenorphine_only?: boolean | null
          pharma_clonidine?: boolean | null
          pharma_disulfiram?: boolean | null
          pharma_hepatitis_c_medications?: boolean | null
          pharma_hiv_medications?: boolean | null
          pharma_lofexidine?: boolean | null
          pharma_mental_disorder_meds?: boolean | null
          pharma_methadone?: boolean | null
          pharma_naltrexone_injectable?: boolean | null
          pharma_naltrexone_oral?: boolean | null
          pharma_nicotine_replacement?: boolean | null
          pharma_non_nicotine_cessation?: boolean | null
          pharma_prep?: boolean | null
          phone?: never
          price_range?: string | null
          service_acupuncture?: boolean | null
          service_aftercare?: boolean | null
          service_case_management?: boolean | null
          service_child_care?: boolean | null
          service_childrens_beds?: boolean | null
          service_discharge_planning?: boolean | null
          service_domestic_violence?: boolean | null
          service_employment?: boolean | null
          service_housing?: boolean | null
          service_mental_health?: boolean | null
          service_naloxone_education?: boolean | null
          service_outcome_followup?: boolean | null
          service_peer_support?: boolean | null
          service_recovery_coach?: boolean | null
          service_self_help_groups?: boolean | null
          service_social_skills?: boolean | null
          service_transportation?: boolean | null
          service_vocational?: boolean | null
          setting_inpatient?: boolean | null
          setting_intensive_outpatient?: boolean | null
          setting_long_term_residential?: boolean | null
          setting_outpatient?: boolean | null
          setting_outpatient_detox?: boolean | null
          setting_outpatient_methadone?: boolean | null
          setting_partial_hospitalization?: boolean | null
          setting_residential?: boolean | null
          setting_residential_detox?: boolean | null
          setting_short_term_residential?: boolean | null
          setting_telehealth?: boolean | null
          sex_female?: boolean | null
          sex_male?: boolean | null
          smoking_designated_area?: boolean | null
          smoking_not_permitted?: boolean | null
          smoking_permitted?: boolean | null
          telehealth_available?: boolean | null
          test_breathalyzer?: boolean | null
          test_drug_urine?: boolean | null
          test_hepatitis_b?: boolean | null
          test_hepatitis_c?: boolean | null
          test_hiv?: boolean | null
          test_metabolic?: boolean | null
          test_std?: boolean | null
          test_tb?: boolean | null
          updated_at?: string | null
          vaccine_hepatitis_a?: boolean | null
          vaccine_hepatitis_b?: boolean | null
          vaping_designated_area?: boolean | null
          vaping_not_permitted?: boolean | null
          vaping_permitted?: boolean | null
          website?: string | null
          youtube_url?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mask_phone: { Args: { phone: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
