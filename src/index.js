/* @flow */
import Keycloak from 'keycloak-js'

let installed: Boolean = false

export default class VueKeyCloak {
  static install: () => void
  static version: string
}

VueKeyCloak.install = (Vue, options: Object = {
  keycloakOptions: {},
  keycloakInitOptions: {},
  refreshTime: 10
}) => {
  if (installed) return
  installed = true

  const keycloak: Object = Keycloak(options.keycloakOptions)

  const watch = new Vue({
    data () {
      return {
        ready: false,
        authenticated: false,
        user: null,
        token: null,
        resourceAccess: null
      }
    }
  })

  keycloak.init(options.keycloakInitOptions).success((isAuthenticated) => {
    updateWatchVariables(isAuthenticated).then(() => {
      watch.ready = true
    })

    if (isAuthenticated) {
      setInterval(() => {
        keycloak.updateToken(options.refreshTime + 2)
          .success((refreshed) => {
            if (refreshed) updateWatchVariables(true)
          })
      }, options.refreshTime * 1000)
    }
  })

  function updateWatchVariables (isAuthenticated = false) {
    watch.authenticated = isAuthenticated

    if (isAuthenticated) {
      watch.token = keycloak.token
      watch.resourceAccess = keycloak.resourceAccess
      return new Promise((resolve, reject) => {
        keycloak.loadUserProfile().success((user) => {
          watch.user = user
          resolve()
        })
      })
    } else {
      return Promise.resolve()
    }
  }

  Object.defineProperty(Vue.prototype, '$keycloak', {
    get () {
      keycloak.ready = watch.ready
      keycloak.user = watch.user
      return keycloak
    }
  })
}

VueKeyCloak.version = '__VERSION__'
