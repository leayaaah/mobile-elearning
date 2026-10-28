export type Category = {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
};

export type Teacher = {
  id: number;
  full_name: string;
  headline: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  location: string | null;
  bio: string | null;
  followers_count: number;
};

export type TeacherLite = Pick<Teacher, 'id' | 'full_name' | 'avatar_url' | 'headline'>;

export type Course = {
  id: number;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  teacher_id: number;
  category_id: number;
  price: number;
  original_price: number | null;
  discount_percent: number;
  badge: 'best-seller' | 'discount' | null;
  rating: number;
  rating_count: number;
  lessons_count: number;
  duration_minutes: number;
  is_popular: boolean;
  is_recommended: boolean;
  is_inspiring: boolean;
  teacher?: TeacherLite;
};

export type Lesson = {
  id: number;
  section_id: number;
  course_id: number;
  title: string;
  duration_seconds: number;
  position: number;
  video_url: string | null;
  is_preview: boolean;
};

export type Section = {
  id: number;
  course_id: number;
  title: string;
  position: number;
  lessons: Lesson[];
};

export type Review = {
  id: number;
  course_id: number;
  reviewer_name: string;
  reviewer_avatar: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
};

export type QAPost = {
  id: number;
  course_id: number;
  author_name: string;
  author_avatar: string | null;
  content: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
};

export type CourseResource = {
  id: number;
  course_id: number;
  name: string;
  size_label: string | null;
  url: string | null;
};

export type Profile = {
  id: string;
  full_name: string;
  headline: string | null;
  avatar_url: string | null;
  cover_url: string | null;
};

export type MyCourse = {
  user_id: string;
  course_id: number;
  title: string;
  thumbnail_url: string | null;
  duration_minutes: number;
  lessons_count: number;
  completed_lessons: number;
  progress: number;
};

export type SearchParams = {
  query?: string;
  categoryId?: number;
  page?: number;      // bắt đầu từ 0
  pageSize?: number;
};

export type SearchResult = {
  items: Course[];
  total: number;
};
