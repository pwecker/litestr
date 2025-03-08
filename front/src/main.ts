import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import VueCookies from 'vue3-cookies'
import { VueReCaptcha } from 'vue-recaptcha-v3'

const app = createApp(App)

app.use(router);
app.use(VueCookies, {
  expireTimes: "30d",
  path: "/",
  domain: "",
  secure: import.meta.env['MODE'] === 'development' ? false : true,
  sameSite: "None"
});
app.use(VueReCaptcha, { siteKey: import.meta.env.VITE_RECAPTCHA_SITE_KEY || '123' });

app.mount('#app')
