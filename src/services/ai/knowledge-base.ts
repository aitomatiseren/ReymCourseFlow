export const PLATFORM_KNOWLEDGE = {
  features: {
    "training_scheduler": {
      description: "Schedule and manage training sessions",
      location: "Training Scheduler menu",
      actions: ["create training", "edit training", "add participants", "view calendar"],
      guide: "To schedule a training: 1) Go to Training Scheduler, 2) Click 'Create Training', 3) Select course, 4) Set date/time, 5) Add participants"
    },
    "employee_management": {
      description: "Manage employee records and information",
      location: "Participants menu",
      actions: ["add employee", "edit employee", "view employee profile", "manage licenses"],
      guide: "To add an employee: 1) Go to Participants, 2) Click 'Add Employee', 3) Fill in personal details, 4) Set employment info, 5) Save"
    },
    "course_management": {
      description: "Create and manage training courses",
      location: "Courses menu",
      actions: ["create course", "edit course", "set Code 95 points", "manage sessions"],
      guide: "To create a course: 1) Go to Courses, 2) Click 'Add Course', 3) Enter course details, 4) Set duration and max participants, 5) Configure Code 95 points if applicable"
    },
    "certificate_tracking": {
      description: "Monitor employee certificates and expiry dates",
      location: "Certificate Expiry menu",
      actions: ["view expiring certificates", "update certificate status", "generate reports"],
      guide: "To check expiring certificates: 1) Go to Certificate Expiry, 2) View dashboard, 3) Filter by date range or employee"
    },
    "reports": {
      description: "Generate training and compliance reports",
      location: "Reports menu", 
      actions: ["compliance report", "training cost report", "certificate expiry report"],
      guide: "To generate reports: 1) Go to Reports, 2) Select report type, 3) Choose date range and filters, 4) Export or view"
    }
  },
  
  common_questions: {
    "How do I schedule a training?": {
      answer: "Go to Training Scheduler → Create Training → Select course → Set date/time → Add participants → Save",
      related_features: ["training_scheduler", "course_management"]
    },
    "Where can I add employees?": {
      answer: "Go to Participants menu → Add Employee → Fill in details → Save",
      related_features: ["employee_management"]
    },
    "How do I check expired certificates?": {
      answer: "Go to Certificate Expiry menu to view all certificates with expiry status",
      related_features: ["certificate_tracking"]
    },
    "What are Code 95 points?": {
      answer: "Code 95 points are required for professional drivers. Each training can award Code 95 points. Drivers need 35 points every 5 years.",
      related_features: ["course_management", "training_scheduler"]
    },
    "How do I create a multi-session training?": {
      answer: "When creating a training, increase the sessions count and set dates/times for each session",
      related_features: ["training_scheduler"]
    }
  },

  navigation: {
    "Dashboard": "/",
    "Training Scheduler": "/scheduling", 
    "Participants": "/participants",
    "Courses": "/courses",
    "Certifications": "/certifications",
    "Reports": "/reports",
    "Notifications": "/communications"
  },

  terminology: {
    "VCA": "Safety certification required for construction work",
    "BHV": "Emergency response certification", 
    "Code 95": "Professional driver qualification points",
    "HDO": "Forklift operation license",
    "Training Session": "Individual training event with date, time, and participants",
    "Course": "Training curriculum that can have multiple sessions",
    "Participant": "Employee enrolled in a training session"
  }
};

interface KnowledgeSearchResult {
  type: 'question' | 'feature' | 'terminology';
  question?: string;
  answer?: string;
  related_features?: string[];
  feature?: string;
  description?: string;
  location?: string;
  guide?: string;
  term?: string;
  definition?: string;
}

export function searchKnowledge(query: string): KnowledgeSearchResult[] {
  const lowercaseQuery = query.toLowerCase();
  const results: KnowledgeSearchResult[] = [];

  // Search common questions
  for (const [question, data] of Object.entries(PLATFORM_KNOWLEDGE.common_questions)) {
    if (question.toLowerCase().includes(lowercaseQuery) || 
        data.answer.toLowerCase().includes(lowercaseQuery)) {
      results.push({
        type: 'question',
        question,
        answer: data.answer,
        related_features: data.related_features
      });
    }
  }

  // Search features  
  for (const [feature, data] of Object.entries(PLATFORM_KNOWLEDGE.features)) {
    if (feature.toLowerCase().includes(lowercaseQuery) ||
        data.description.toLowerCase().includes(lowercaseQuery) ||
        data.actions.some(action => action.toLowerCase().includes(lowercaseQuery))) {
      results.push({
        type: 'feature',
        feature,
        description: data.description,
        location: data.location,
        guide: data.guide
      });
    }
  }

  // Search terminology
  for (const [term, definition] of Object.entries(PLATFORM_KNOWLEDGE.terminology)) {
    if (term.toLowerCase().includes(lowercaseQuery) ||
        definition.toLowerCase().includes(lowercaseQuery)) {
      results.push({
        type: 'terminology',
        term,
        definition
      });
    }
  }

  return results;
}