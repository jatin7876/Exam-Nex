export interface User {
  id?: string;
  username: string;
  email: string;
  role: 'admin' | 'student';
  avatar?: string;
  department?: string;
  rollNumber?: string;
  joinDate: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Question {
  id?: string;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  linkedExam?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Exam {
  id?: string;
  title: string;
  description: string;
  subject: string;
  duration: number; // in minutes
  totalMarks: number;
  passingMarks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  scheduledDate: string;
  activeStatus: boolean;
  createdBy: string;
  questions: string[]; // List of question IDs
  createdAt?: string;
  updatedAt?: string;
}

export interface Result {
  id?: string;
  studentId: string;
  examId: string;
  selectedAnswers: number[];
  score: number;
  percentage: number;
  passStatus: boolean;
  timeTaken: number; // in seconds
  submittedAt: string;
  createdAt?: string;
  updatedAt?: string;
}
