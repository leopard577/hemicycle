/** Name of the site, in the browser tab and on the "À propos" page */
export const SITE_NAME = 'Nos élus coûtent'

/** Public addresses of the project, shown on the "À propos" page and in error messages */
export const REPOSITORY = 'https://github.com/leopard577/hemicycle'
export const X_ACCOUNT = 'LoPard49'

/** Absolute address of the published site: link previews (WhatsApp, X…) need absolute URLs */
export const SITE_URL = 'https://noseluscoutent.fr/'

/**
 * Folder of the static share pages, one per person (`partage/deputes/PA1234`): crawlers ignore the hash, so each page
 * carries its own preview image, then sends visitors on to the panel. Written after the build by `npm run share`.
 */
export const SHARE_DIR = 'partage'
