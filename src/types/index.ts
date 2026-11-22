export type UserRole = 'student' | 'moderator' | 'admin';

export interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  department: string; // e.g. CSE, ECE, AI&DS, ME, BT, CS&IT
  semester: string; // e.g. Sem 3
  role: UserRole;
  is_verified_student?: boolean;
  university_email?: string;
  student_id?: string;
  code_name?: string; // Unique student code name e.g. SHADOW_SCHOLAR_01
  academic_position?: string; // Campus Academic Head title
  verified_at?: string;
  created_at: string;
  registered_courses?: StudentCourse[];
  enrolled_courses?: string[];
  academic_year?: string;
  academic_context_source?: 'erp' | 'manual' | 'catalog';
}

export interface StudentCourse {
  code: string;
  name: string;
  semester?: string;
}

export type ResourceCategory =
  | 'Assignments'
  | 'Programming'
  | 'Lab Records'
  | 'Lab Experiments'
  | 'Mini Projects'
  | 'Major Projects'
  | 'DTIE Projects'
  | 'Mathematics'
  | 'Notes'
  | 'Presentations'
  | 'Reports'
  | 'Study Resources'
  | 'Other Academic Resources';

export type ResourceFileType =
  | 'pdf'
  | 'docx'
  | 'doc'
  | 'pptx'
  | 'ppt'
  | 'xls'
  | 'xlsx'
  | 'zip'
  | 'py'
  | 'java'
  | 'cpp'
  | 'c'
  | 'txt'
  | 'png'
  | 'jpg';

export interface Resource {
  id: string;
  title: string;
  description: string;
  category: ResourceCategory;
  course_code: string; // e.g. 23CS2101
  course_name: string; // e.g. Data Structures & Algorithms
  semester: string; // Sem 1 to Sem 8
  academic_year: string; // e.g. 2024-2025
  resource_type: string; // e.g. "Lab Record", "Assignment", "Unit Notes"
  file_name: string;
  file_url: string;
  file_size: number; // in bytes
  file_type: ResourceFileType;
  file_content_preview?: string; // Text/code snippet for instant preview
  file_data_url?: string; // Direct Data URL for authentic PDF & binary rendering
  author_id?: string;
  author_name: string;
  author_username?: string;
  author_avatar?: string;
  author_is_verified?: boolean;
  is_anonymous: boolean;
  tags: string[];
  likes_count: number;
  downloads_count: number;
  views_count: number;
  status: 'approved' | 'pending' | 'flagged' | 'archived' | 'rejected';
  rejection_reason?: string;
  is_pioneer?: boolean;
  duplicate_of_id?: string;
  duplicate_of_title?: string;
  duplicate_of_author?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  category:
    | 'Mini Project'
    | 'Major Project'
    | 'DTIE Project'
    | 'Hackathon Project'
    | 'Hardware Project'
    | 'Software Project'
    | 'AI/ML Project'
    | 'Research Project';
  tech_stack: string[];
  github_url?: string;
  live_url?: string;
  demo_video_url?: string;
  course_code?: string;
  course_name?: string;
  semester: string;
  academic_year: string;
  team_members: string[];
  thumbnail_url?: string;
  author_name: string;
  author_username: string;
  author_avatar?: string;
  likes_count: number;
  created_at: string;
}

export interface ResourceComment {
  id: string;
  resource_id: string;
  user_id: string;
  user_name: string;
  user_username: string;
  user_avatar?: string;
  content: string;
  created_at: string;
}

export interface ResourceReport {
  id: string;
  resource_id: string;
  resource_title: string;
  reported_by: string;
  reporter_username: string;
  reason: 'copyright' | 'inappropriate' | 'wrong_category' | 'spam' | 'personal_info' | 'misconduct' | 'other';
  description: string;
  status: 'pending' | 'resolved' | 'dismissed';
  resolution_notes?: string;
  created_at: string;
}

export type NotificationType =
  | 'like'
  | 'comment'
  | 'report_update'
  | 'system'
  | 'request_offer'
  | 'offer_accepted'
  | 'request_comment'
  | 'request_fulfilled'
  | 'request_reopened';

export interface NotificationItem {
  id: string;
  user_id: string;
  actor_name: string;
  type: NotificationType;
  title: string;
  message: string;
  resource_id?: string;
  request_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface Course {
  code: string;
  name: string;
  department: string;
  semester: string;
}

// ==========================================
// RESOURCE REQUESTS TYPES
// ==========================================

export type RequestStatus = 'open' | 'partially_fulfilled' | 'fulfilled' | 'closed';

export type OfferType = 'upload' | 'existing_resource' | 'external_link';

export type OfferStatus = 'pending' | 'accepted' | 'rejected';

export interface ResourceRequest {
  id: string;
  user_id: string;
  title: string;
  description: string;
  programme: string; // e.g. B.Tech, M.Tech, BCA, MCA, BBA
  course_id?: string;
  course_code: string; // e.g. 23CS2101
  course_name: string; // e.g. Data Structures and Algorithms
  semester: string; // e.g. Sem 4, Tri-Sem 1
  category: ResourceCategory;
  resource_type: string; // e.g. Notes, Lab Experiment, Question Paper, Project Report
  module_number?: string; // e.g. Module 3
  topic?: string; // e.g. AVL Trees, DTIE Phase 3
  assignment_number?: string; // e.g. Assignment 2, Lab Experiment 7
  academic_year?: string; // e.g. 2024-2025
  preferred_format?: string; // e.g. PDF, PPTX, DOCX, Code (.java, .py)
  tags: string[];
  deadline?: string; // e.g. 2026-12-05
  is_anonymous: boolean;
  status: RequestStatus;
  requester_name: string;
  requester_username: string;
  requester_avatar?: string;
  requester_department?: string;
  requester_is_verified?: boolean;
  created_at: string;
  updated_at: string;
  fulfilled_at?: string;
}

export interface RequestOffer {
  id: string;
  request_id: string;
  contributor_id: string;
  contributor_name: string;
  contributor_username: string;
  contributor_avatar?: string;
  contributor_department?: string;
  contributor_is_verified?: boolean;
  offer_type: OfferType;
  // If offer_type === 'upload' or 'existing_resource'
  resource_id?: string;
  uploaded_file_name?: string;
  uploaded_file_url?: string;
  uploaded_file_size?: number;
  uploaded_file_type?: ResourceFileType;
  // If offer_type === 'external_link'
  external_url?: string;
  title: string;
  description?: string;
  message?: string; // Optional note to the requester
  status: OfferStatus;
  created_at: string;
  updated_at: string;
}

export interface RequestResponse {
  id: string;
  request_id: string;
  user_id: string;
  user_name: string;
  user_username: string;
  user_avatar?: string;
  user_department?: string;
  user_is_verified?: boolean;
  parent_response_id?: string | null; // For threaded replies
  content: string;
  created_at: string;
  updated_at: string;
}

export interface SavedRequest {
  id: string;
  user_id: string;
  request_id: string;
  created_at: string;
}

export interface RequestReport {
  id: string;
  request_id: string;
  offer_id?: string;
  response_id?: string;
  reporter_id: string;
  reporter_username: string;
  reason: 'copyright' | 'inappropriate' | 'wrong_category' | 'spam' | 'personal_info' | 'misconduct' | 'other';
  description: string;
  status: 'pending' | 'resolved' | 'dismissed';
  resolution_notes?: string;
  created_at: string;
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  event:
    | 'LOGIN_SUCCESS'
    | 'LOGIN_FAILED_CREDENTIALS'
    | 'LOGIN_FAILED_CAPTCHA'
    | 'RATE_LIMIT_TRIGGERED'
    | 'ACCOUNT_COOLDOWN'
    | 'MANUAL_COURSE_SYNC';
  masked_erp_id: string;
  ip_address: string;
  user_agent: string;
  status: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
  details: string;
}

