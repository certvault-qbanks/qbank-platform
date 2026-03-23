export default {
  // ─── Identity ──────────────────────────────────────
  id: 'hc_compliance',
  name: 'HC QBank',
  fullName: 'Healthcare Compliance QBank',
  tagline: 'Healthcare Compliance Certification Prep',
  description: 'Pass your CHC or CHPC certification with confidence.',
  supportEmail: 'support@clinicalresearchquestionbank.com',
  logoText: 'HC',                      // Fallback when no logo image
  logoUrl: null,                        // Set to an image URL if you have one

  // ─── Theme ─────────────────────────────────────────
  colors: {
    primary: 'blue',                    // Used for gradients: from-blue-600
    accent: 'purple',
    success: 'emerald',
  },

  // ─── Categories (question topics for this qbank) ───
  categories: [
    { value: 'hipaa_privacy',       label: 'HIPAA Privacy Rule',           color: 'from-blue-500 to-blue-600' },
    { value: 'privacy_security',    label: 'HIPAA Security Rule',          color: 'from-emerald-500 to-emerald-600' },
    { value: 'fraud_abuse',         label: 'Fraud & Abuse Laws',           color: 'from-red-500 to-red-600' },
    { value: 'coding_billing',      label: 'Coding & Billing Compliance',  color: 'from-amber-500 to-amber-600' },
    { value: 'compliance_programs', label: 'Compliance Programs',           color: 'from-purple-500 to-purple-600' },
    { value: 'stark_law',           label: 'Stark Law & Self-Referral',    color: 'from-pink-500 to-pink-600' },
    { value: 'investigations',      label: 'Investigations & Enforcement', color: 'from-orange-500 to-orange-600' },
    { value: 'ethics',              label: 'Healthcare Ethics',            color: 'from-teal-500 to-teal-600' },
  ],

  // ─── Exam Configurations ───────────────────────────
  exams: [
    {
      id: 'chc',
      name: 'CHC Certification',
      fullName: 'Certified in Healthcare Compliance (HCCA/BCSP)',
      description: 'Comprehensive exam covering HIPAA, fraud & abuse laws, compliance program elements, coding/billing, and healthcare enforcement.',
      questionCount: 100,
      timeLimit: 150,       // minutes
      passingScore: 70,
      categories: ['hipaa_privacy', 'privacy_security', 'fraud_abuse', 'coding_billing', 'compliance_programs', 'stark_law'],
      features: ['100 multiple choice questions', '2.5 hours time limit', 'Covers all CHC exam domains', 'Instant scoring and feedback'],
      color: 'from-blue-600 to-blue-700',
    },
    {
      id: 'chpc',
      name: 'CHPC Certification',
      fullName: 'Certified in Healthcare Privacy Compliance (HCCA/IAPP)',
      description: 'Focused exam on HIPAA Privacy & Security Rules, breach notification, healthcare data governance, and privacy program management.',
      questionCount: 100,
      timeLimit: 120,
      passingScore: 75,
      categories: ['hipaa_privacy', 'privacy_security', 'investigations', 'ethics', 'coding_billing', 'compliance_programs'],
      features: ['100 multiple choice questions', '2 hours time limit', 'Covers all CHPC exam domains', 'Detailed performance analysis'],
      color: 'from-purple-600 to-purple-700',
    },
  ],

  // ─── Stripe Payment Links ──────────────────────────
  stripe: {
    '30day':   'https://buy.stripe.com/bJe4gzgVs8hf0CxcC64ZG09',
    '90day':   'https://buy.stripe.com/fZucN57kS7db70V8lQ4ZG08',
    '12month': 'https://buy.stripe.com/fZu28r20y7dbdpjdGa4ZG07',
    upgrade:   'https://buy.stripe.com/bJe5kDax42WVgBv6dI4ZG00',  // generic upgrade link
  },

  // ─── Pricing Plans ─────────────────────────────────
  plans: [
    { id: '30day',   label: '30-Day Access',   price: 49,  period: '30 days',   color: 'from-slate-600 to-slate-700',   highlight: false, description: 'Perfect for a focused last-mile study sprint.' },
    { id: '90day',   label: '90-Day Access',   price: 79,  period: '90 days',   color: 'from-blue-600 to-blue-700',     highlight: true, badge: 'Most Popular', description: 'The sweet spot for thorough study.' },
    { id: '12month', label: '12-Month Access',  price: 99,  period: '12 months', color: 'from-emerald-600 to-emerald-700', highlight: false, description: 'Maximum flexibility — study at your own pace.' },
  ],

  // ─── Trial Config ──────────────────────────────────
  trial: {
    freeQuestions: 50,
  },

  // ─── Sample questions (for Study page offline mode) ─
  sampleQuestions: [
    {
      id: 1, category: 'hipaa_privacy', difficulty: 'intermediate',
      stem: 'A hospital billing employee accesses a neighbor\'s medical records without a treatment, payment, or operations reason, then mentions the hospitalization to mutual friends.',
      question: 'Which BEST describes this situation under HIPAA?',
      options: [
        { text: 'Not a violation because no specific PHI was disclosed', is_correct: false, explanation: 'The unauthorized access itself is a violation.' },
        { text: 'A HIPAA Privacy Rule violation requiring breach notification analysis', is_correct: true, explanation: 'Under 45 CFR 164.502, workforce members may only access PHI when needed for their job functions.' },
        { text: 'Only the verbal disclosure is a violation', is_correct: false, explanation: 'Both the access and disclosure are problematic.' },
        { text: 'A minor administrative violation', is_correct: false, explanation: 'This may trigger breach notification obligations.' },
      ],
      educational_objective: 'Apply HIPAA Privacy Rule requirements regarding workforce access to PHI.',
      bottom_line: 'Unauthorized access to PHI — even without further disclosure — is a HIPAA violation.',
      related_topics: ['HIPAA Privacy Rule', 'Minimum Necessary', 'Breach Notification'],
      user_stats: { pct_A: 8, pct_B: 68, pct_C: 16, pct_D: 8, avg_time: 82 },
    },
    {
      id: 2, category: 'fraud_abuse', difficulty: 'advanced',
      stem: 'A large orthopedic group provides $800/year in free services and gifts to referring primary care physicians. They bill Medicare for all surgical procedures.',
      question: 'Which federal law is MOST directly implicated?',
      options: [
        { text: 'The False Claims Act', is_correct: false, explanation: 'FCA could be implicated but the arrangement is most directly analyzed under AKS.' },
        { text: 'The Anti-Kickback Statute', is_correct: true, explanation: '42 U.S.C. § 1320a-7b(b) prohibits remuneration to induce referrals.' },
        { text: 'The Stark Law only', is_correct: false, explanation: 'The orthopedic group is receiving referrals from separate physicians.' },
        { text: 'Neither — gifts are below the OIG threshold', is_correct: false, explanation: 'There is no blanket $1,000 threshold.' },
      ],
      educational_objective: 'Distinguish between the AKS, Stark Law, and FCA.',
      bottom_line: 'The AKS prohibits ANY remuneration intended to induce referrals to federal program providers.',
      related_topics: ['Anti-Kickback Statute', 'Stark Law', 'False Claims Act'],
      user_stats: { pct_A: 14, pct_B: 62, pct_C: 18, pct_D: 6, avg_time: 105 },
    },
    {
      id: 3, category: 'compliance_programs', difficulty: 'basic',
      stem: 'A newly appointed CCO reviews the OIG Compliance Program Guidance and finds several gaps in the organization\'s program.',
      question: 'Which OIG element is MOST foundational?',
      options: [
        { text: 'Written policies and procedures', is_correct: false, explanation: 'Essential but only effective with leadership commitment.' },
        { text: 'Training and education', is_correct: false, explanation: 'Critical but depends on clear policies and leadership.' },
        { text: 'Compliance officer with genuine authority', is_correct: true, explanation: 'The OIG identifies governance and leadership commitment as foundational.' },
        { text: 'Prompt response to offenses', is_correct: false, explanation: 'This is a reactive element.' },
      ],
      educational_objective: 'Identify the seven elements of an effective compliance program.',
      bottom_line: 'Leadership commitment underpins all seven OIG compliance elements.',
      related_topics: ['OIG Compliance Guidance', 'Seven Elements', 'Compliance Officer'],
      user_stats: { pct_A: 22, pct_B: 15, pct_C: 55, pct_D: 8, avg_time: 60 },
    },
  ],
};
