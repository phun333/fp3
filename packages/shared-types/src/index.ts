// ===== Enums =====
export enum UserRole {
  STUDENT = "STUDENT",
  PROFESSOR = "PROFESSOR",
}

export enum ProjectStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  CLOSED = "CLOSED",
}

export enum ApplicationStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
}

export enum TeamIdeaStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  CLOSED = "CLOSED",
}

export enum TeamInviteRole {
  PROFESSOR = "PROFESSOR",
  STUDENT = "STUDENT",
}

export enum TeamInviteStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  DECLINED = "DECLINED",
}

// ===== Base Types =====
export interface Tag {
  id: string;
  name: string;
  category: string | null;
}

export interface UserTag {
  userId: string;
  tagId: string;
  tag?: Tag;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
  bio: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: UserTag[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  studentSlots: number;
  professorSlots: number;
  ownerId: string;
  owner?: User;
  createdAt: string;
  updatedAt: string;
  tags?: ProjectTag[];
  applications?: Application[];
  members?: ProjectMember[];
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: UserRole;
  joinedAt: string;
  user?: User;
}

export interface TeamIdea {
  id: string;
  title: string;
  description: string;
  professorSlots: number;
  studentSlots: number;
  status: TeamIdeaStatus;
  ownerId: string;
  owner?: User;
  createdAt: string;
  updatedAt: string;
  tags?: TeamIdeaTag[] | Tag[];
  invites?: TeamInvite[];
}

export interface TeamIdeaTag {
  teamIdeaId: string;
  tagId: string;
  tag?: Tag;
}

export interface TeamInvite {
  id: string;
  teamIdeaId: string;
  userId: string;
  role: TeamInviteRole;
  status: TeamInviteStatus;
  handoffNote: string | null;
  matchScore: number;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface ProjectTag {
  projectId: string;
  tagId: string;
  tag?: Tag;
}

export interface Publication {
  id: string;
  title: string;
  abstract: string | null;
  url: string | null;
  year: number | null;
  authorId: string;
  author?: User;
  createdAt: string;
  tags?: PublicationTag[];
}

export interface PublicationTag {
  publicationId: string;
  tagId: string;
  tag?: Tag;
}

export interface Application {
  id: string;
  status: ApplicationStatus;
  message: string | null;
  projectId: string;
  project?: Project;
  applicantId: string;
  applicant?: User;
  createdAt: string;
  updatedAt: string;
}

// ===== API Response Types =====
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ===== Auth Types =====
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  department: string;
}

export interface AuthSession {
  user: User;
  token: string;
}

// ===== Discovery Types =====
export interface MatchResult<T> {
  item: T;
  matchScore: number;
  matchingTags: Tag[];
}

// ===== AI Types =====
export interface AISuggestedTag {
  tag_name: string;
  confidence: number;
}

export interface AITagExtractionRequest {
  text: string;
  top_n?: number;
}

export interface AITagExtractionResponse {
  suggested_tags: AISuggestedTag[];
}

export interface AIProfileAnalysisRequest {
  bio: string;
  publications?: string[];
}

export interface AIProfileAnalysisResponse {
  suggested_tags: AISuggestedTag[];
  research_areas: string[];
}
