export type Profile = {
  id: string;
  user_id: string;
  name: string | null;
  style_goal: string | null;
  preferred_style: string | null;
  main_difficulty: string | null;
  onboarding_completed: boolean;
  is_admin: boolean;
  created_at: string;
};

export type Module = {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  cover_image_url: string | null;
  created_at: string;
};

export type Lesson = {
  id: string;
  module_id: string;
  title: string;
  content: string | null;
  order_index: number;
  created_at: string;
};

export type Look = {
  id: string;
  title: string;
  description: string | null;
  occasion: string;
  style: string;
  climate: string;
  level: string;
  base_color: string;
  image_url: string | null;
  pieces: string[];
  why_it_works: string | null;
  adaptations: string[];
  created_at: string;
};

export type WardrobeItem = {
  id: string;
  name: string;
  category: string;
  priority: "essencial" | "intermediaria" | "avancada";
  description: string | null;
  how_to_use: string | null;
  image_url: string | null;
  created_at: string;
};

export type UserFavorite = {
  id: string;
  user_id: string;
  look_id: string;
  created_at: string;
};

export type UserProgress = {
  id: string;
  user_id: string;
  module_id: string;
  lesson_id: string | null;
  completed: boolean;
  created_at: string;
};

export type UserWardrobe = {
  id: string;
  user_id: string;
  wardrobe_item_id: string;
  status: "tenho" | "quero_comprar";
  created_at: string;
};

export type ActionPlanProgress = {
  id: string;
  user_id: string;
  day: number;
  completed: boolean;
  notes: string | null;
  created_at: string;
};
