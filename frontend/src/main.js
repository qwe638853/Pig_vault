import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Import Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import * as labsComponents from 'vuetify/labs/components'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import './style.css'

// Import Material Design Icons
import '@mdi/font/css/materialdesignicons.css'

const vuetify = createVuetify({
  components: {
    ...components,
    ...labsComponents,
  },
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#1976D2',    // Blue
          secondary: '#424242',  // Gray
          accent: '#82B1FF',     // Light blue
          success: '#4CAF50',    // Green
          info: '#2196F3',       // Blue
          warning: '#FB8C00',    // Orange
          error: '#FF5252',      // Red
          background: '#FFFFFF'  // White
        }
      },
      dark: {
        colors: {
          primary: '#1976D2',    // Consistent blue
          secondary: '#424242',  // Gray
          accent: '#82B1FF',     // Light blue
          success: '#4CAF50',
          info: '#2196F3',
          warning: '#FB8C00',
          error: '#FF5252',
          background: '#121212'
        }
      }
    }
  },
  defaults: {
    VBtn: {
      rounded: true
    },
    VCard: {
      rounded: 'lg',
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
    },
    VChip: {
      rounded: 'pill',
    },
    VFooter: {
      height: '32px',
      border: false
    },
    VAppBar: {
      flat: true,
      density: 'comfortable'
    },
    VContainer: {
      fluid: false,
      class: ['px-4', 'px-sm-6', 'px-md-8']
    }
  }
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)
app.mount('#app')
