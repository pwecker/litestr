import { DefineComponent } from 'vue';

interface Feature {
  documentId: string | null;
  description: string;
}

interface UX {
  authenticated: boolean | null;
  Home: {
    clicked: boolean;
    images_loaded: boolean;
  };
}

interface User {
  id?: number;
  username?: string;
  email?: string;
}

declare const Home: DefineComponent<
  {}, // Props
  {}, // Emits
  {
    feature: Feature;
    contents: { media: string }[];
    ux: UX;
    user: User | null;
    back_url: string;
    front_url: string;
    images: string[];
    loading: boolean;
    _preload_images(): Promise<void>;
    _ux(model: UX): void;
    _ux_Home(model: UX['Home']): void;
    _ux_Carousel_selected_index(model: number): void;
    _auth(): Promise<void>;
    _click(): Promise<void>;
  }
>;

export default Home;
