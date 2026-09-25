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
  { name: "Down Syndrome (Trisomy 21)", keywords: ["down", "trisomy 21", "down's", "downs"] },
  { name: "Fragile X Syndrome", keywords: ["fragile x", "fragilex", "fxs"] },
  { name: "Turner Syndrome", keywords: ["turner", "monosomy x"] },
  { name: "Klinefelter Syndrome", keywords: ["klinefelter", "xxy"] },
  { name: "22q11.2 Deletion Syndrome (DiGeorge)", keywords: ["22q", "digeorge", "velocardiofacial", "vcfs"] },
  { name: "Angelman Syndrome", keywords: ["angelman"] },
  { name: "Prader-Willi Syndrome", keywords: ["prader willi", "prader-willi", "pws"] },
  { name: "Williams Syndrome", keywords: ["williams"] },
  { name: "Rett Syndrome", keywords: ["rett"] },
  { name: "Cri du Chat Syndrome", keywords: ["cri du chat", "5p minus", "cry of the cat"] },

  // Neurodevelopmental
  { name: "Autism Spectrum Disorder (ASD)", keywords: ["autism", "autistic", "asd", "asperger", "nonverbal autism", "non-verbal autism"] },
  { name: "ADHD (Attention Deficit Hyperactivity Disorder)", keywords: ["adhd", "attention deficit", "hyperactive", "hyperactivity", "add"] },
  { name: "Intellectual Disability", keywords: ["intellectual disability", "cognitive disability", "learning disability", "developmental delay", "global delay"] },
  { name: "Dyslexia", keywords: ["dyslexia", "dyslexic"] },
  { name: "Dyspraxia / Developmental Coordination Disorder", keywords: ["dyspraxia", "dcd", "developmental coordination"] },

  // Neurological
  { name: "Cerebral Palsy", keywords: ["cerebral palsy", "cp ", " cp,", "spastic", "hemiplegia", "diplegia", "quadriplegia"] },
  { name: "Epilepsy", keywords: ["epilepsy", "epileptic", "seizure", "seizures"] },
  { name: "Dravet Syndrome", keywords: ["dravet"] },
  { name: "Lennox-Gastaut Syndrome", keywords: ["lennox gastaut", "lennox-gastaut", "lgs"] },
  { name: "Tuberous Sclerosis Complex (TSC)", keywords: ["tuberous sclerosis", "tsc"] },
  { name: "Neurofibromatosis (NF1/NF2)", keywords: ["neurofibromatosis", "nf1", "nf2"] },
  { name: "Hydrocephalus", keywords: ["hydrocephalus", "water on the brain", "water on brain", "shunt"] },
  { name: "Spina Bifida", keywords: ["spina bifida", "myelomeningocele", "meningocele"] },
  { name: "Microcephaly", keywords: ["microcephaly", "small head"] },
  { name: "Hypoxic-Ischaemic Encephalopathy (HIE)", keywords: ["hie", "hypoxic", "birth asphyxia", "oxygen deprivation"] },

  // Neuromuscular
  { name: "Spinal Muscular Atrophy (SMA)", keywords: ["sma", "spinal muscular atrophy"] },
  { name: "Duchenne Muscular Dystrophy (DMD)", keywords: ["duchenne", "dmd", "muscular dystrophy"] },
  { name: "Becker Muscular Dystrophy", keywords: ["becker muscular"] },
  { name: "Myotonic Dystrophy", keywords: ["myotonic dystrophy", "steinert"] },
  { name: "Congenital Myopathy", keywords: ["congenital myopathy", "nemaline", "central core"] },

  // Metabolic / endocrine
  { name: "Type 1 Diabetes", keywords: ["type 1 diabetes", "type1 diabetes", "t1d", "t1dm", "juvenile diabetes", "insulin dependent"] },
  { name: "Type 2 Diabetes", keywords: ["type 2 diabetes", "type2 diabetes", "t2d"] },
  { name: "Phenylketonuria (PKU)", keywords: ["phenylketonuria", "pku"] },
  { name: "Galactosaemia", keywords: ["galactosaemia", "galactosemia"] },
  { name: "Maple Syrup Urine Disease (MSUD)", keywords: ["maple syrup urine", "msud"] },
  { name: "Congenital Hypothyroidism", keywords: ["congenital hypothyroidism", "underactive thyroid"] },
  { name: "Congenital Adrenal Hyperplasia (CAH)", keywords: ["congenital adrenal hyperplasia", "cah"] },
  { name: "Growth Hormone Deficiency", keywords: ["growth hormone deficiency", "ghd", "growth deficiency"] },

  // Respiratory / cardiac
  { name: "Cystic Fibrosis", keywords: ["cystic fibrosis", "cf ", " cf,", "cftr"] },
  { name: "Congenital Heart Disease", keywords: ["congenital heart", "heart defect", "hole in the heart", "tetralogy", "fallot", "hypoplastic", "transposition"] },
  { name: "Pulmonary Hypertension", keywords: ["pulmonary hypertension", "pulmonary arterial"] },
  { name: "Bronchopulmonary Dysplasia (BPD)", keywords: ["bronchopulmonary dysplasia", "bpd", "chronic lung disease"] },

  // Gastrointestinal / allergic
  { name: "Food Protein-Induced Enterocolitis Syndrome (FPIES)", keywords: ["fpies", "food protein enterocolitis", "food protein-induced"] },
  { name: "Crohn's Disease", keywords: ["crohn", "crohns", "inflammatory bowel"] },
  { name: "Short Bowel Syndrome", keywords: ["short bowel", "short gut"] },
  { name: "Hirschsprung's Disease", keywords: ["hirschsprung", "hirschsprungs"] },
  { name: "Severe Food Allergy", keywords: ["severe allergy", "anaphylaxis", "anaphylactic", "epinephrine", "epipen", "multiple food allergy"] },
  { name: "Eosinophilic Oesophagitis (EoE)", keywords: ["eosinophilic", "eoe"] },

  // Musculoskeletal / connective tissue
  { name: "Ehlers-Danlos Syndrome (EDS)", keywords: ["ehlers danlos", "eds", "hypermobility", "hsd", "joint hypermobility"] },
  { name: "Osteogenesis Imperfecta (Brittle Bone Disease)", keywords: ["osteogenesis imperfecta", "brittle bone", "oi "] },
  { name: "Juvenile Idiopathic Arthritis (JIA)", keywords: ["juvenile arthritis", "jia", "juvenile idiopathic arthritis"] },
  { name: "Scoliosis", keywords: ["scoliosis", "curved spine"] },
  { name: "Achondroplasia", keywords: ["achondroplasia", "dwarfism", "short stature"] },

  // Immune / blood
  { name: "Primary Immunodeficiency", keywords: ["immunodeficiency", "immune deficiency", "low immune", "scid", "common variable"] },
  { name: "Sickle Cell Disease", keywords: ["sickle cell", "scd", "sickle"] },
  { name: "Haemophilia", keywords: ["haemophilia", "hemophilia", "clotting disorder", "factor viii", "factor ix"] },
  { name: "Thalassaemia", keywords: ["thalassaemia", "thalassemia", "beta thalassemia"] },

  // Renal
  { name: "Congenital Kidney Disease", keywords: ["kidney disease", "renal disease", "nephrotic", "nephrotic syndrome", "congenital kidney"] },
  { name: "Alport Syndrome", keywords: ["alport"] },

  // Vision / hearing
  { name: "Congenital Visual Impairment", keywords: ["blind", "blindness", "visual impairment", "retinopathy of prematurity", "rop", "nystagmus", "optic nerve"] },
  { name: "Congenital Hearing Loss / Deafness", keywords: ["deaf", "deafness", "hearing loss", "hearing impairment", "cochlear"] },

  // Skin
  { name: "Epidermolysis Bullosa (EB)", keywords: ["epidermolysis bullosa", "eb ", "butterfly skin", "butterfly child"] },
  { name: "Ichthyosis", keywords: ["ichthyosis"] },

  // Premature birth complications
  { name: "Premature Birth Complications", keywords: ["premature", "preterm", "born early", "nicu", "low birth weight"] },
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
