export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.txt'] as const;

export const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
] as const;

export const FILE_TYPE_LABELS: Record<string, string> = {
  pdf: 'PDF Document',
  docx: 'Word Document',
  txt: 'Plain Text',
};

export const SUGGESTED_QUESTIONS = [
  'Can you summarize the main conclusions of this document?',
  'What are the key action items or recommendations?',
  'Highlight any risks or challenges identified in the text.',
  'What are the critical dates, milestones, or metrics mentioned?',
  'Can you provide a simple executive overview of the content?',
];

export const SUMMARY_TYPE_OPTIONS = [
  { value: 'brief', label: 'Brief Summary', description: 'Quick 2-3 paragraph overview' },
  { value: 'detailed', label: 'Detailed Analysis', description: 'In-depth breakdown of sections' },
  { value: 'bullet', label: 'Bullet Points', description: 'Concise bulleted highlights' },
  { value: 'executive', label: 'Executive Summary', description: 'High-level synthesis for leadership' },
  { value: 'key_takeaways', label: 'Key Takeaways', description: 'Actionable learnings and takeaways' },
] as const;

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
