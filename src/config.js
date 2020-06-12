const currentProtocol = typeof window !== 'undefined' ? window.location.protocol : 'http:'
const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost'

const config = {
  meta: {
    author: 'Libé Labo',
    title: 'Le jeu du sud',
    url: '',
    description: '',
    image: '',
    xiti_id: 'test',
    tweet: '',
  },
  tracking: {
    active: false,
    format: 'libe-apps-template',
    article: 'libe-apps-template'
  },
  show_header: true,
  statics_url: process.env.NODE_ENV === 'production'
    ? 'https://www.liberation.fr/apps/static'
    : `${currentProtocol}//${currentHostname}:3003`,
  api_url: process.env.NODE_ENV === 'production'
    ? 'https://libe-labo-2.site/api'
    : `${currentProtocol}//${currentHostname}:3004/api`,
  stylesheet: 'le-jeu-du-sud.css', // The name of the css file hosted at ${statics_url}/styles/apps/
  spreadsheet: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSivm-tuzpFXhn2gyLwFPlRIUv7t4PagujGTZb04aCwnrrD7gXGQGhUjjmwUFXva3Kb7oHtdjRm9_i1/pub?gid=0&single=true&output=tsv' // The spreadsheet providing data to the app
}

module.exports = config
