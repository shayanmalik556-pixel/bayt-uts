/* Employer: posted jobs and applicants (mock data) */

window.EMPLOYER_JOBS = [
  {
    id: 'job-1',
    title: 'Senior Data Analyst',
    location: 'Riyadh, Saudi Arabia',
    postedDate: '2026-02-20',
    status: 'active',
    applicationCount: 7
  },
  {
    id: 'job-2',
    title: 'Frontend Developer',
    location: 'Dubai, UAE',
    postedDate: '2026-02-18',
    status: 'active',
    applicationCount: 5
  },
  {
    id: 'job-3',
    title: 'Product Manager',
    location: 'Cairo, Egypt',
    postedDate: '2026-02-15',
    status: 'active',
    applicationCount: 4
  }
];

/* Applicants per job (keyed by job id) */
window.EMPLOYER_APPLICANTS = {
  'job-1': [
    { id: 'app-1-1', name: 'Sara Al-Rashid', email: 'sara.r@email.com', appliedDate: '2026-02-24', currentStage: 'Screening' },
    { id: 'app-1-2', name: 'Omar Hassan', email: 'omar.h@email.com', appliedDate: '2026-02-23', currentStage: 'Applied' },
    { id: 'app-1-3', name: 'Layla Mahmoud', email: 'layla.m@email.com', appliedDate: '2026-02-22', currentStage: 'Interview' },
    { id: 'app-1-4', name: 'Khalid Ibrahim', email: 'khalid.i@email.com', appliedDate: '2026-02-21', currentStage: 'Applied' },
    { id: 'app-1-5', name: 'Nadia Fathi', email: 'nadia.f@email.com', appliedDate: '2026-02-20', currentStage: 'Shortlist' },
    { id: 'app-1-6', name: 'Fatima Al-Mansouri', email: 'fatima.m@email.com', appliedDate: '2026-02-19', currentStage: 'Screening' },
    { id: 'app-1-7', name: 'Ahmed Zaki', email: 'ahmed.z@email.com', appliedDate: '2026-02-18', currentStage: 'Applied' }
  ],
  'job-2': [
    { id: 'app-2-1', name: 'Youssef Ahmed', email: 'youssef.a@email.com', appliedDate: '2026-02-25', currentStage: 'Applied' },
    { id: 'app-2-2', name: 'Mariam Saleh', email: 'mariam.s@email.com', appliedDate: '2026-02-24', currentStage: 'Technical Test' },
    { id: 'app-2-3', name: 'Tariq Nasser', email: 'tariq.n@email.com', appliedDate: '2026-02-23', currentStage: 'Applied' },
    { id: 'app-2-4', name: 'Dina Osman', email: 'dina.o@email.com', appliedDate: '2026-02-22', currentStage: 'Shortlist' },
    { id: 'app-2-5', name: 'Karim Badawi', email: 'karim.b@email.com', appliedDate: '2026-02-21', currentStage: 'Interview' }
  ],
  'job-3': [
    { id: 'app-3-1', name: 'Hana Khalil', email: 'hana.k@email.com', appliedDate: '2026-02-22', currentStage: 'Interview' },
    { id: 'app-3-2', name: 'Rami Farouk', email: 'rami.f@email.com', appliedDate: '2026-02-21', currentStage: 'Shortlist' },
    { id: 'app-3-3', name: 'Lina Haddad', email: 'lina.h@email.com', appliedDate: '2026-02-20', currentStage: 'Applied' },
    { id: 'app-3-4', name: 'Omar Fayed', email: 'omar.f@email.com', appliedDate: '2026-02-19', currentStage: 'Screening' }
  ]
};

/* Employer tag categories (UTS system categories) */
window.EMPLOYER_TAG_DEFINITIONS = {
  hiring_stage: [
    { id: 'stage-applied', label: 'Applied' },
    { id: 'stage-screening', label: 'Screening' },
    { id: 'stage-shortlist', label: 'Shortlist' },
    { id: 'stage-interview', label: 'Interview' },
    { id: 'stage-offer', label: 'Offer' },
    { id: 'stage-hired', label: 'Hired' },
    { id: 'stage-rejected', label: 'Rejected' }
  ],
  priority: [
    { id: 'pri-high', label: 'High' },
    { id: 'pri-medium', label: 'Medium' },
    { id: 'pri-low', label: 'Low' }
  ],
  skills: [
    { id: 'sk-js', label: 'JavaScript' },
    { id: 'sk-python', label: 'Python' },
    { id: 'sk-data', label: 'Data Analysis' },
    { id: 'sk-sql', label: 'SQL' },
    { id: 'sk-pm', label: 'Project Management' },
    { id: 'sk-react', label: 'React' },
    { id: 'sk-excel', label: 'Excel' },
    { id: 'sk-communication', label: 'Communication' }
  ],
  industry: [
    { id: 'ind-tech', label: 'Technology' },
    { id: 'ind-finance', label: 'Finance' },
    { id: 'ind-health', label: 'Healthcare' },
    { id: 'ind-retail', label: 'Retail' },
    { id: 'ind-eng', label: 'Engineering' }
  ],
  status: [
    { id: 'status-active', label: 'Active' },
    { id: 'status-on-hold', label: 'On Hold' },
    { id: 'status-withdrawn', label: 'Withdrawn' },
    { id: 'status-no-show', label: 'No Show' }
  ],
  custom: []
};

window.EMPLOYER_CATEGORY_LABELS = {
  hiring_stage: 'Hiring Stage',
  priority: 'Priority',
  skills: 'Skills',
  industry: 'Industry',
  status: 'Status',
  custom: 'Custom'
};

/* Seed candidate tags so dashboard and widgets show data (run once if empty) */
(function () {
  try {
    var key = 'bayt_employer_candidate_tags';
    var existing = localStorage.getItem(key);
    if (existing) {
      var parsed = JSON.parse(existing);
      if (Object.keys(parsed).length > 0) return;
    }
    var seed = {
      'app-1-1': [
        { categoryId: 'hiring_stage', tagId: 'stage-screening', label: 'Screening' },
        { categoryId: 'priority', tagId: 'pri-high', label: 'High' },
        { categoryId: 'skills', tagId: 'sk-data', label: 'Data Analysis' },
        { categoryId: 'industry', tagId: 'ind-tech', label: 'Technology' }
      ],
      'app-1-2': [
        { categoryId: 'hiring_stage', tagId: 'stage-applied', label: 'Applied' },
        { categoryId: 'priority', tagId: 'pri-medium', label: 'Medium' },
        { categoryId: 'skills', tagId: 'sk-sql', label: 'SQL' }
      ],
      'app-1-3': [
        { categoryId: 'hiring_stage', tagId: 'stage-interview', label: 'Interview' },
        { categoryId: 'priority', tagId: 'pri-high', label: 'High' },
        { categoryId: 'skills', tagId: 'sk-excel', label: 'Excel' },
        { categoryId: 'industry', tagId: 'ind-tech', label: 'Technology' }
      ],
      'app-1-4': [
        { categoryId: 'hiring_stage', tagId: 'stage-applied', label: 'Applied' },
        { categoryId: 'priority', tagId: 'pri-low', label: 'Low' }
      ],
      'app-1-5': [
        { categoryId: 'hiring_stage', tagId: 'stage-shortlist', label: 'Shortlist' },
        { categoryId: 'priority', tagId: 'pri-high', label: 'High' },
        { categoryId: 'skills', tagId: 'sk-data', label: 'Data Analysis' },
        { categoryId: 'skills', tagId: 'sk-sql', label: 'SQL' }
      ],
      'app-1-6': [
        { categoryId: 'hiring_stage', tagId: 'stage-screening', label: 'Screening' },
        { categoryId: 'priority', tagId: 'pri-medium', label: 'Medium' },
        { categoryId: 'industry', tagId: 'ind-finance', label: 'Finance' }
      ],
      'app-1-7': [
        { categoryId: 'hiring_stage', tagId: 'stage-applied', label: 'Applied' },
        { categoryId: 'priority', tagId: 'pri-low', label: 'Low' }
      ],
      'app-2-1': [
        { categoryId: 'hiring_stage', tagId: 'stage-applied', label: 'Applied' },
        { categoryId: 'priority', tagId: 'pri-medium', label: 'Medium' },
        { categoryId: 'skills', tagId: 'sk-js', label: 'JavaScript' }
      ],
      'app-2-2': [
        { categoryId: 'hiring_stage', tagId: 'stage-interview', label: 'Interview' },
        { categoryId: 'priority', tagId: 'pri-high', label: 'High' },
        { categoryId: 'skills', tagId: 'sk-react', label: 'React' },
        { categoryId: 'skills', tagId: 'sk-js', label: 'JavaScript' },
        { categoryId: 'industry', tagId: 'ind-tech', label: 'Technology' }
      ],
      'app-2-3': [
        { categoryId: 'hiring_stage', tagId: 'stage-applied', label: 'Applied' },
        { categoryId: 'priority', tagId: 'pri-low', label: 'Low' }
      ],
      'app-2-4': [
        { categoryId: 'hiring_stage', tagId: 'stage-shortlist', label: 'Shortlist' },
        { categoryId: 'priority', tagId: 'pri-high', label: 'High' },
        { categoryId: 'skills', tagId: 'sk-js', label: 'JavaScript' }
      ],
      'app-2-5': [
        { categoryId: 'hiring_stage', tagId: 'stage-interview', label: 'Interview' },
        { categoryId: 'priority', tagId: 'pri-medium', label: 'Medium' },
        { categoryId: 'skills', tagId: 'sk-react', label: 'React' }
      ],
      'app-3-1': [
        { categoryId: 'hiring_stage', tagId: 'stage-interview', label: 'Interview' },
        { categoryId: 'priority', tagId: 'pri-high', label: 'High' },
        { categoryId: 'skills', tagId: 'sk-pm', label: 'Project Management' },
        { categoryId: 'industry', tagId: 'ind-tech', label: 'Technology' }
      ],
      'app-3-2': [
        { categoryId: 'hiring_stage', tagId: 'stage-shortlist', label: 'Shortlist' },
        { categoryId: 'priority', tagId: 'pri-medium', label: 'Medium' },
        { categoryId: 'skills', tagId: 'sk-communication', label: 'Communication' }
      ],
      'app-3-3': [
        { categoryId: 'hiring_stage', tagId: 'stage-applied', label: 'Applied' },
        { categoryId: 'priority', tagId: 'pri-low', label: 'Low' }
      ],
      'app-3-4': [
        { categoryId: 'hiring_stage', tagId: 'stage-screening', label: 'Screening' },
        { categoryId: 'priority', tagId: 'pri-medium', label: 'Medium' },
        { categoryId: 'industry', tagId: 'ind-eng', label: 'Engineering' }
      ]
    };
    localStorage.setItem(key, JSON.stringify(seed));
  } catch (e) {}
})();
