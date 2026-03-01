/* Tag definitions: same structure as Tagging API (category -> tag_id -> label) */
window.TAG_DEFINITIONS = {
  industry: [
    { id: 'ind-tech', label: 'Technology' },
    { id: 'ind-health', label: 'Healthcare' },
    { id: 'ind-finance', label: 'Finance' },
    { id: 'ind-retail', label: 'Retail' },
    { id: 'ind-eng', label: 'Engineering' },
    { id: 'ind-education', label: 'Education' },
    { id: 'ind-government', label: 'Government' },
    { id: 'ind-logistics', label: 'Logistics' }
  ],
  skills: [
    { id: 'sk-js', label: 'JavaScript' },
    { id: 'sk-python', label: 'Python' },
    { id: 'sk-data', label: 'Data Analysis' },
    { id: 'sk-sql', label: 'SQL' },
    { id: 'sk-pm', label: 'Project Management' },
    { id: 'sk-excel', label: 'Excel' },
    { id: 'sk-communication', label: 'Communication' },
    { id: 'sk-react', label: 'React' },
    { id: 'sk-machine-learning', label: 'Machine Learning' }
  ],
  seniority: [
    { id: 'sen-entry', label: 'Entry Level' },
    { id: 'sen-mid', label: 'Mid-Senior' },
    { id: 'sen-director', label: 'Director' },
    { id: 'sen-exec', label: 'Executive' }
  ],
  employment_type: [
    { id: 'emp-full', label: 'Full-time' },
    { id: 'emp-part', label: 'Part-time' },
    { id: 'emp-contract', label: 'Contract' },
    { id: 'emp-intern', label: 'Internship' },
    { id: 'emp-remote', label: 'Remote' }
  ],
  experience_level: [
    { id: 'exp-none', label: 'No Experience' },
    { id: 'exp-1-2', label: '1-2 years' },
    { id: 'exp-3-5', label: '3-5 years' },
    { id: 'exp-5plus', label: '5+ years' }
  ]
};

/* Jobs with entity_tag mappings (tag IDs per category) */
window.MOCK_JOBS = [
  {
    id: 1,
    title: 'Data Analyst - No Experience Required',
    company: 'Peroptyx',
    location: 'Saudi Arabia · Riyadh',
    tag_ids: { industry: ['ind-tech'], skills: ['sk-data', 'sk-excel', 'sk-sql'], seniority: ['sen-entry'], employment_type: ['emp-full', 'emp-remote'], experience_level: ['exp-none'] }
  },
  {
    id: 2,
    title: 'Data Analyst',
    company: 'Mohamed N. Al Hajery and Sons Co. LTD',
    location: 'Kuwait · Al Kuwait',
    tag_ids: { industry: ['ind-finance'], skills: ['sk-data', 'sk-sql', 'sk-excel'], seniority: ['sen-mid'], employment_type: ['emp-full'], experience_level: ['exp-3-5'] }
  },
  {
    id: 3,
    title: 'Junior Frontend Developer',
    company: 'Tech Solutions MENA',
    location: 'UAE · Dubai',
    tag_ids: { industry: ['ind-tech'], skills: ['sk-js', 'sk-react'], seniority: ['sen-entry'], employment_type: ['emp-full', 'emp-remote'], experience_level: ['exp-none', 'exp-1-2'] }
  },
  {
    id: 4,
    title: 'Senior Python Developer',
    company: 'Data Corp',
    location: 'Egypt · Cairo',
    tag_ids: { industry: ['ind-tech'], skills: ['sk-python', 'sk-sql', 'sk-machine-learning'], seniority: ['sen-mid'], employment_type: ['emp-full'], experience_level: ['exp-5plus'] }
  },
  {
    id: 5,
    title: 'Project Manager',
    company: 'BuildCo',
    location: 'Saudi Arabia · Jeddah',
    tag_ids: { industry: ['ind-eng'], skills: ['sk-pm', 'sk-communication', 'sk-excel'], seniority: ['sen-mid', 'sen-director'], employment_type: ['emp-full'], experience_level: ['exp-3-5', 'exp-5plus'] }
  },
  {
    id: 6,
    title: 'Healthcare Data Analyst',
    company: 'MedCare Group',
    location: 'UAE · Abu Dhabi',
    tag_ids: { industry: ['ind-health'], skills: ['sk-data', 'sk-sql', 'sk-excel'], seniority: ['sen-entry', 'sen-mid'], employment_type: ['emp-full'], experience_level: ['exp-1-2', 'exp-3-5'] }
  },
  {
    id: 7,
    title: 'Finance Intern',
    company: 'Gulf Finance',
    location: 'Bahrain · Manama',
    tag_ids: { industry: ['ind-finance'], skills: ['sk-excel', 'sk-communication'], seniority: ['sen-entry'], employment_type: ['emp-intern'], experience_level: ['exp-none'] }
  },
  {
    id: 8,
    title: 'Full Stack Developer',
    company: 'StartupLab',
    location: 'Remote',
    tag_ids: { industry: ['ind-tech'], skills: ['sk-js', 'sk-react', 'sk-python'], seniority: ['sen-mid'], employment_type: ['emp-full', 'emp-remote'], experience_level: ['exp-3-5'] }
  }
];
