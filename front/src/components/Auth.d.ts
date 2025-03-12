import { DefineComponent } from 'vue';

declare const Auth: DefineComponent<
  {}, // Props
  {}, // Emits
  {
    loading: boolean;
    back_url: string;
    _auth(): Promise<void>;
  }
>;

export default Auth;
