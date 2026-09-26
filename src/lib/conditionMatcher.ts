/**
 * Rule-based condition normalizer.
 * Maps plain-English parent descriptions to standard medical condition names
 * using keyword scoring — no API cost required.
 */

interface ConditionRule {
  name: string;
  keywords: string[];
}

const CONDITIONS: ConditionRule[] = [
  // Chromosomal / genetic
  { name: "Down Syndrome (Trisomy 21)", keywords: ["down syndrome", "down's syndrome", "trisomy 21", "down's", "downs"] },
  { name: "Fragile X Syndrome", keywords: ["fragile x", "fragilex", "fxs"] },
  { name: "Turner Syndrome", keywords: ["turner syndrome", "turner", "monosomy x"] },
  { name: "Klinefelter Syndrome", keywords: ["klinefelter", "xxy"] },
  { name: "DiGeorge Syndrome (22q11)", keywords: ["22q", "digeorge", "velocardiofacial", "vcfs"] },
  { name: "Angelman Syndrome", keywords: ["angelman"] },
  { name: "Prader-Willi Syndrome", keywords: ["prader willi", "prader-willi", "pws"] },
  { name: "Williams Syndrome", keywords: ["williams syndrome", "williams"] },
  { name: "Rett Syndrome", keywords: ["rett"] },
  { name: "Cri du Chat Syndrome", keywords: ["cri du chat", "5p minus"] },

  // Neurodevelopmental
  { name: "Autism Spectrum Disorder", keywords: ["autism", "autistic", "asd", "asperger", "nonverbal autism", "non-verbal autism", "on the spectrum"] },
  { name: "ADHD", keywords: ["adhd", "attention deficit", "hyperactive", "hyperactivity", "attention disorder"] },
  { name: "Intellectual & Developmental Disability", keywords: ["intellectual disability", "cognitive disability", "learning disability", "developmental delay", "global delay", "developmental disability"] },
  { name: "Dyslexia", keywords: ["dyslexia", "dyslexic", "reading difficulty", "reading disorder"] },
  { name: "Dyspraxia / Coordination Disorder", keywords: ["dyspraxia", "dcd", "developmental coordination", "clumsy child"] },

  // Neurological
  { name: "Cerebral Palsy", keywords: ["cerebral palsy", "cp ", " cp,", "spastic", "hemiplegia", "diplegia", "quadriplegia"] },
  { name: "Epilepsy & Seizure Disorders", keywords: ["epilepsy", "epileptic", "seizure", "seizures", "convulsion"] },
  { name: "Dravet Syndrome", keywords: ["dravet"] },
  { name: "Lennox-Gastaut Syndrome", keywords: ["lennox gastaut", "lennox-gastaut", "lgs"] },
  { name: "Tuberous Sclerosis", keywords: ["tuberous sclerosis", "tsc"] },
  { name: "Neurofibromatosis", keywords: ["neurofibromatosis", "nf1", "nf2"] },
  { name: "Hydrocephalus", keywords: ["hydrocephalus", "water on the brain", "water on brain", "shunt"] },
  { name: "Spina Bifida", keywords: ["spina bifida", "myelomeningocele", "meningocele"] },
  { name: "Microcephaly", keywords: ["microcephaly", "small head"] },
  { name: "HIE (Birth Hypoxia)", keywords: ["hie", "hypoxic ischaemic", "hypoxic-ischaemic", "birth asphyxia", "oxygen deprivation at birth"] },

  // Neuromuscular
  { name: "Spinal Muscular Atrophy (SMA)", keywords: ["sma", "spinal muscular atrophy"] },
  { name: "Duchenne Muscular Dystrophy", keywords: ["duchenne", "dmd", "muscular dystrophy"] },
  { name: "Becker Muscular Dystrophy", keywords: ["becker muscular"] },
  { name: "Myotonic Dystrophy", keywords: ["myotonic dystrophy", "steinert"] },
  { name: "Congenital Myopathy", keywords: ["congenital myopathy", "nemaline", "central core"] },

  // Metabolic / endocrine
  { name: "Type 1 Diabetes", keywords: ["type 1 diabetes", "type1 diabetes", "t1d", "t1dm", "juvenile diabetes", "insulin dependent"] },
  { name: "Type 2 Diabetes", keywords: ["type 2 diabetes", "type2 diabetes", "t2d"] },
  { name: "Phenylketonuria (PKU)", keywords: ["phenylketonuria", "pku"] },
  { name: "Galactosaemia", keywords: ["galactosaemia", "galactosemia"] },
  { name: "Maple Syrup Urine Disease", keywords: ["maple syrup urine", "msud"] },
  { name: "Congenital Hypothyroidism", keywords: ["congenital hypothyroidism", "underactive thyroid", "thyroid deficiency"] },
  { name: "Congenital Adrenal Hyperplasia", keywords: ["congenital adrenal hyperplasia", "cah"] },
  { name: "Growth Hormone Deficiency", keywords: ["growth hormone deficiency", "ghd", "growth deficiency"] },

  // Respiratory / cardiac
  { name: "Cystic Fibrosis", keywords: ["cystic fibrosis", "cf ", " cf,", "cftr"] },
  { name: "Congenital Heart Disease", keywords: [
    "congenital heart", "heart defect", "heart condition",
    "hole in the heart", "hole in their heart", "hole in his heart", "hole in her heart",
    "hole in the", "hole heart", "heart hole",
    "tetralogy", "fallot", "hypoplastic", "transposition",
    "vsd", "asd", "ventricular septal", "atrial septal",
    "aortic stenosis", "pulmonary stenosis", "coarctation",
    "heart surgery", "open heart", "heart operation",
    "heart disease", "cardiac defect", "cardiac condition",
  ] },
  { name: "Pulmonary Hypertension", keywords: ["pulmonary hypertension", "pulmonary arterial", "high blood pressure in lungs"] },
  { name: "Bronchopulmonary Dysplasia", keywords: ["bronchopulmonary dysplasia", "bpd", "chronic lung disease"] },
  { name: "Childhood Asthma", keywords: ["asthma", "severe asthma", "chronic asthma"] },

  // Gastrointestinal / allergic
  { name: "FPIES (Food Protein Intolerance)", keywords: ["fpies", "food protein enterocolitis", "food protein-induced"] },
  { name: "Crohn's Disease & IBD", keywords: ["crohn", "crohns", "inflammatory bowel", "ulcerative colitis", "ibd"] },
  { name: "Short Bowel Syndrome", keywords: ["short bowel", "short gut"] },
  { name: "Hirschsprung's Disease", keywords: ["hirschsprung", "hirschsprungs"] },
  { name: "Severe Food Allergy", keywords: ["severe allergy", "anaphylaxis", "anaphylactic", "epinephrine", "epipen", "multiple food allergy", "nut allergy", "peanut allergy"] },
  { name: "Eosinophilic Oesophagitis", keywords: ["eosinophilic", "eoe"] },

  // Musculoskeletal / connective tissue
  { name: "Ehlers-Danlos Syndrome", keywords: ["ehlers danlos", "eds", "hypermobility", "hsd", "joint hypermobility", "bendy joints"] },
  { name: "Osteogenesis Imperfecta (Brittle Bones)", keywords: ["osteogenesis imperfecta", "brittle bone", "oi "] },
  { name: "Juvenile Arthritis", keywords: ["juvenile arthritis", "jia", "juvenile idiopathic arthritis"] },
  { name: "Scoliosis", keywords: ["scoliosis", "curved spine"] },
  { name: "Achondroplasia / Dwarfism", keywords: ["achondroplasia", "dwarfism", "short stature"] },

  // Immune / blood
  { name: "Primary Immunodeficiency", keywords: ["immunodeficiency", "immune deficiency", "low immune", "scid", "common variable"] },
  { name: "Sickle Cell Disease", keywords: ["sickle cell", "scd", "sickle"] },
  { name: "Haemophilia & Bleeding Disorders", keywords: ["haemophilia", "hemophilia", "clotting disorder", "factor viii", "factor ix", "bleeding disorder"] },
  { name: "Thalassaemia", keywords: ["thalassaemia", "thalassemia", "beta thalassemia"] },

  // Renal
  { name: "Kidney & Renal Conditions", keywords: ["kidney disease", "renal disease", "nephrotic", "nephrotic syndrome", "congenital kidney", "kidney failure", "dialysis"] },
  { name: "Alport Syndrome", keywords: ["alport"] },

  // Vision / hearing
  { name: "Visual Impairment", keywords: ["blind", "blindness", "visual impairment", "retinopathy of prematurity", "rop", "nystagmus", "optic nerve", "can't see", "cannot see"] },
  { name: "Hearing Loss & Deafness", keywords: ["deaf", "deafness", "hearing loss", "hearing impairment", "cochlear", "can't hear", "cannot hear"] },

  // Skin
  { name: "Epidermolysis Bullosa", keywords: ["epidermolysis bullosa", "eb ", "butterfly skin", "butterfly child"] },
  { name: "Ichthyosis", keywords: ["ichthyosis"] },

  // Cancer
  { name: "Childhood Cancer", keywords: ["cancer", "leukaemia", "leukemia", "lymphoma", "tumor", "tumour", "oncology", "chemotherapy", "chemo", "childhood cancer"] },

  // Premature birth complications
  { name: "Premature Birth", keywords: ["premature", "preterm", "born early", "nicu", "low birth weight", "premie", "preemie"] },

  // Rare / unclassified
  { name: "Rare Genetic Condition", keywords: ["rare condition", "rare disease", "rare genetic", "undiagnosed", "chromosome", "genetic mutation", "gene mutation"] },
];

export function normalizeCondition(description: string): string {
  const lower = description.toLowerCase();

  let bestMatch: { name: string; score: number } | null = null;

  for (const condition of CONDITIONS) {
    let score = 0;
    for (const keyword of condition.keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        // Longer keyword matches are more specific → higher score
        score += keyword.length;
      }
    }
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { name: condition.name, score };
    }
  }

  if (bestMatch) return bestMatch.name;

  // Fallback: extract most meaningful phrase from description
  // Use first sentence up to 60 chars if no match found
  const firstSentence = description.split(/[.!?]/)[0].trim();
  if (firstSentence.length <= 80) return firstSentence;
  return "Rare or Unspecified Condition";
}
