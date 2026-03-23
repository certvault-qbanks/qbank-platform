export default {
  id: 'clinical_research',
  name: 'CR QBank',
  fullName: 'Clinical Research QBank',
  tagline: 'Clinical Research Certification Exam Prep',
  description: 'Pass your ACRP or SOCRA certification on the first attempt.',
  supportEmail: 'support@clinicalresearchquestionbank.com',
  logoText: 'CR',
  logoUrl: null,

  colors: {
    primary: 'indigo',
    accent: 'cyan',
    success: 'emerald',
  },

  categories: [
    { value: 'gcp',                  label: 'Good Clinical Practice',   color: 'from-indigo-500 to-indigo-600' },
    { value: 'fda_regulations',      label: 'FDA Regulations',          color: 'from-blue-500 to-blue-600' },
    { value: 'ich_guidelines',       label: 'ICH Guidelines',           color: 'from-cyan-500 to-cyan-600' },
    { value: 'protocol_development', label: 'Protocol Development',     color: 'from-emerald-500 to-emerald-600' },
    { value: 'informed_consent',     label: 'Informed Consent',         color: 'from-amber-500 to-amber-600' },
    { value: 'adverse_events',       label: 'Adverse Events',           color: 'from-red-500 to-red-600' },
    { value: 'site_management',      label: 'Site Management',          color: 'from-purple-500 to-purple-600' },
    { value: 'data_management',      label: 'Data Management',          color: 'from-pink-500 to-pink-600' },
    { value: 'ethics_irb',           label: 'Ethics & IRB',             color: 'from-teal-500 to-teal-600' },
    { value: 'regulatory_submissions', label: 'Regulatory Submissions', color: 'from-orange-500 to-orange-600' },
  ],

  exams: [
    {
      id: 'acrp',
      name: 'ACRP Certification',
      fullName: 'Association of Clinical Research Professionals',
      description: 'Comprehensive ACRP certification exam covering GCP, FDA regulations, ICH guidelines, and clinical operations.',
      questionCount: 100,
      timeLimit: 150,
      passingScore: 70,
      categories: ['gcp', 'fda_regulations', 'ich_guidelines', 'protocol_development', 'informed_consent', 'adverse_events'],
      features: ['100 multiple choice questions', '2.5 hours time limit', 'Covers all ACRP domains', 'Instant scoring'],
      color: 'from-indigo-600 to-indigo-700',
    },
    {
      id: 'socra',
      name: 'SOCRA Certification',
      fullName: 'Society of Clinical Research Associates',
      description: 'Full SOCRA CCRP exam simulation covering clinical research operations, site management, and regulatory compliance.',
      questionCount: 100,
      timeLimit: 120,
      passingScore: 75,
      categories: ['gcp', 'site_management', 'data_management', 'ethics_irb', 'regulatory_submissions'],
      features: ['100 multiple choice questions', '2 hours time limit', 'Covers all SOCRA domains', 'Performance analysis'],
      color: 'from-cyan-600 to-cyan-700',
    },
  ],

  stripe: {
    '30day':   'https://buy.stripe.com/REPLACE_WITH_CR_30DAY_LINK',
    '90day':   'https://buy.stripe.com/REPLACE_WITH_CR_90DAY_LINK',
    '12month': 'https://buy.stripe.com/REPLACE_WITH_CR_12MONTH_LINK',
    upgrade:   'https://buy.stripe.com/REPLACE_WITH_CR_UPGRADE_LINK',
  },

  plans: [
    { id: '30day',   label: '30-Day Access',   price: 49,  period: '30 days',   color: 'from-slate-600 to-slate-700',   highlight: false, description: 'Focused sprint before your exam.' },
    { id: '90day',   label: '90-Day Access',   price: 79,  period: '90 days',   color: 'from-indigo-600 to-indigo-700', highlight: true, badge: 'Most Popular', description: 'Thorough study with room to breathe.' },
    { id: '12month', label: '12-Month Access',  price: 99,  period: '12 months', color: 'from-emerald-600 to-emerald-700', highlight: false, description: 'Full year of unlimited access.' },
  ],

  trial: {
    freeQuestions: 50,
  },

  sampleQuestions: [
    {
      id: 1, category: 'gcp', difficulty: 'intermediate',
      stem: 'A clinical research coordinator discovers that a study participant\'s lab results from the screening visit were entered incorrectly into the case report form. The error was discovered 3 weeks after the data was entered.',
      question: 'According to GCP guidelines, what is the CORRECT way to handle this data correction?',
      options: [
        { text: 'Delete the incorrect entry and replace with the correct data', is_correct: false, explanation: 'Original data must never be obscured or deleted.' },
        { text: 'Make a correction with a single line through the error, add the correct data, date, initials, and explanation', is_correct: true, explanation: 'ICH E6(R2) 4.9.3 requires corrections to be dated, initialed, and explained without obscuring the original entry.' },
        { text: 'Use correction fluid to cover the error and write in the correct value', is_correct: false, explanation: 'Correction fluid is never acceptable in source documents or CRFs.' },
        { text: 'Leave the error as-is since it was discovered too late to correct', is_correct: false, explanation: 'Errors should be corrected whenever discovered.' },
      ],
      educational_objective: 'Apply ICH E6(R2) data correction requirements in clinical research.',
      bottom_line: 'Never obscure original data. Corrections must be traceable: single line, date, initials, reason.',
      related_topics: ['ICH E6(R2)', 'Data Integrity', 'Source Documentation'],
      user_stats: { pct_A: 10, pct_B: 72, pct_C: 5, pct_D: 13, avg_time: 75 },
    },
  ],
};
