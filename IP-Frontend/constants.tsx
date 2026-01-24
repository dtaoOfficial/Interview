
import { JobRole } from './types';

export const INITIAL_ROLES: JobRole[] = [
  {
    id: '1',
    title: 'Senior Frontend Engineer',
    department: 'Engineering',
    description: 'We are looking for a React expert to lead our dashboard initiatives. You should have experience with high-performance UI and modern styling.',
    maxRetakes: 1, // 1 extra retake = 2 total attempts
    questionPool: [
      { id: 'q1', text: 'Tell us about your experience with React 19 and the new hooks.', duration: 30 },
      { id: 'q2', text: 'How do you approach performance profiling in a complex web application?', duration: 30 },
      { id: 'q3', text: 'Describe a difficult bug you solved recently.', duration: 30 },
      { id: 'q4', text: 'What makes you excited about joining our team?', duration: 30 },
    ]
  },
  {
    id: '2',
    title: 'Product Designer',
    department: 'Design',
    description: 'Create beautiful, intuitive experiences for HR professionals worldwide.',
    maxRetakes: 1,
    questionPool: [
      { id: 'd1', text: 'Walk us through your design process for a new feature.', duration: 30 },
      { id: 'd2', text: 'How do you balance user needs with technical constraints?', duration: 30 },
      { id: 'd3', text: 'What is the most important aspect of a recruitment interface?', duration: 30 },
    ]
  }
];

export const MAX_VIDEO_DURATION = 60; // 1 minute
