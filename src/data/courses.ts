export interface Course {
  id: string;
  title: string;
  desc: string;
  duration: string;
  price: string;
  originalPrice?: string;
  offerLabel?: string;
  date: string;
  tracks: string[];
  level: string;
  highlights: string[];
}

export const academyPrograms: Course[] = [
  {
    id: 'one-day',
    title: 'One-day Executive Workshop',
    desc: 'A high-intensity, focused masterclass designed to rapidly upskill teams and individuals in AI quality fundamentals, risk assessment, and basic prompt engineering without the time commitment of a full bootcamp.',
    duration: '3-4 hours live',
    price: 'INR 2,499',
    originalPrice: 'INR 4,999',
    offerLabel: 'Introductory offer · 50% off',
    date: 'Next cohort: Starts soon',
    tracks: ['Business track', 'Technology track'],
    level: 'Beginner to Intermediate',
    highlights: [
      'Core AI risk & hallucination detection',
      'Hands-on prompt engineering basics',
      'Live QA exercises with active models',
      'Certificate of participation'
    ]
  },
  {
    id: 'demo',
    title: 'Trial & Demo Session',
    desc: 'Not sure if the full bootcamp is for you? Experience our teaching methodology, interact with our lead AI evaluators, and get a taste of production-level AI testing in this low-cost trial session.',
    duration: '1-2 hours live',
    price: 'INR 999',
    date: 'Next cohort: Rolling admission',
    tracks: ['General intro'],
    level: 'Beginner',
    highlights: [
      'Preview of the 5-week bootcamp curriculum',
      'Live Q&A with Vyomatrix engineers',
      'Introduction to AI quality frameworks',
      'Fee fully adjustable against bootcamp'
    ]
  },
  {
    id: 'bootcamp',
    title: 'The Flagship 5-Week Bootcamp',
    desc: 'Our premier immersive program. You will be embedded into simulated production environments, evaluating live LLMs, building automated testing suites, and completing a capstone project graded by industry veterans.',
    duration: '4-5 weeks intensive',
    price: 'INR 45,000',
    date: 'Next cohort: Enrolling now',
    tracks: ['Business track', 'Technology track'],
    level: 'Intermediate to Advanced',
    highlights: [
      'Direct recruitment pathway for top 5%',
      '1-on-1 mentorship with AI architects',
      'Build a verified portfolio capstone',
      'Alumni network & lifelong Slack access'
    ]
  },
  {
    id: 'advanced',
    title: 'Advanced QA & DevOps Workshop',
    desc: 'Strictly for working professionals, senior QA engineers, and DevOps specialists. Dive deep into CI/CD integration for LLMs, automated safety guarding, and programmatic red-teaming at scale.',
    duration: '2 full days',
    price: 'INR 18,500',
    date: 'Next cohort: TBD',
    tracks: ['Technology track'],
    level: 'Advanced / Expert',
    highlights: [
      'Automated programmatic evaluations (EvalOps)',
      'Integrating LLM guardrails in CI/CD',
      'Adversarial testing & red-teaming',
      'Enterprise certification'
    ]
  }
];
