import React, { Component } from 'react'
import Loader from 'libe-components/lib/blocks/Loader'
import LoadingError from 'libe-components/lib/blocks/LoadingError'
import ShareArticle from 'libe-components/lib/blocks/ShareArticle'
import LibeLaboLogo from 'libe-components/lib/blocks/LibeLaboLogo'
import ArticleMeta from 'libe-components/lib/blocks/ArticleMeta'
import PageTitle from 'libe-components/lib/text-levels/PageTitle'
import { parseTsv } from 'libe-utils'

export default class App extends Component {
  /* * * * * * * * * * * * * * * * *
   *
   * CONSTRUCTOR
   *
   * * * * * * * * * * * * * * * * */
  constructor () {
    super()
    this.c = 'le-jeu-du-sud'
    this.state = {
      loading_sheet: true,
      error_sheet: null,
      data_sheet: [],
      step: 'choose origin',
      origin: null,
      current_city: null,
      keystrokes_history: [],
      konami_mode: false
    }
    this.fetchSheet = this.fetchSheet.bind(this)
    this.fetchCredentials = this.fetchCredentials.bind(this)
    this.listenToKeyStrokes = this.listenToKeyStrokes.bind(this)
    this.watchKonamiCode = this.watchKonamiCode.bind(this)
    this.setOrigin = this.setOrigin.bind(this)
    this.voteFor = this.voteFor.bind(this)
  }

  /* * * * * * * * * * * * * * * * *
   *
   * DID MOUNT
   *
   * * * * * * * * * * * * * * * * */
  componentDidMount () {
    document.addEventListener('keydown', this.listenToKeyStrokes)
    this.fetchCredentials()
    if (this.props.spreadsheet) return this.fetchSheet()
    return this.setState({ loading_sheet: false })
  }

  /* * * * * * * * * * * * * * * * *
   *
   * WILL UNMOUNT
   *
   * * * * * * * * * * * * * * * * */
  componentWillUnmount () {
    document.removeEventListener('keydown', this.listenToKeyStrokes)
  }

  /* * * * * * * * * * * * * * * * *
   *
   * SHOULD UPDATE
   *
   * * * * * * * * * * * * * * * * */
  shouldComponentUpdate (props, nextState) {
    const changedKeys = []
    Object.keys(nextState).forEach(key => {
      if (this.state[key] !== nextState[key]) changedKeys.push(key)
    })
    if (changedKeys.length === 1 &&
      changedKeys.includes('keystrokes_history')) return false
    return true
  }

  /* * * * * * * * * * * * * * * * *
   *
   * FETCH CREDENTIALS
   *
   * * * * * * * * * * * * * * * * */
  async fetchCredentials () {
    const { api_url } = this.props
    const { format, article } = this.props.tracking
    const api = `${api_url}/${format}/${article}/load`
    try {
      const reach = await window.fetch(api, { method: 'POST' })
      const response = await reach.json()
      const { lblb_tracking, lblb_posting } = response._credentials
      if (!window.LBLB_GLOBAL) window.LBLB_GLOBAL = {}
      window.LBLB_GLOBAL.lblb_tracking = lblb_tracking
      window.LBLB_GLOBAL.lblb_posting = lblb_posting
      return { lblb_tracking, lblb_posting }
    } catch (error) {
      console.error('Unable to fetch credentials:')
      console.error(error)
      return Error(error)
    }
  }

  /* * * * * * * * * * * * * * * * *
   *
   * FETCH SHEET
   *
   * * * * * * * * * * * * * * * * */
  async fetchSheet () {
    this.setState({ loading_sheet: true, error_sheet: null })
    const sheet = this.props.spreadsheet
    try {
      const reach = await window.fetch(this.props.spreadsheet)
      if (!reach.ok) throw reach
      const data = await reach.text()
      const parsedData = parseTsv(data, [1])[0]
      let randomlyFilteredData = [...parsedData]
      while (randomlyFilteredData.length > 4) {
        randomlyFilteredData[Math.floor(Math.random() * randomlyFilteredData.length)] = undefined
        randomlyFilteredData = randomlyFilteredData.filter(e => e)
      }
      this.setState(current => ({
        ...current,
        loading_sheet: false,
        error_sheet: null,
        data_sheet: randomlyFilteredData,
        current_city: randomlyFilteredData[0]
      }))
      return data
    } catch (error) {
      if (error.status) {
        const text = `${error.status} error while fetching : ${sheet}`
        this.setState({ loading_sheet: false, error_sheet: error })
        console.error(text, error)
        return Error(text)
      } else {
        this.setState({ loading_sheet: false, error_sheet: error })
        console.error(error)
        return Error(error)
      }
    }
  }

  /* * * * * * * * * * * * * * * * *
   *
   * START LISTENING KEYSTROKES
   *
   * * * * * * * * * * * * * * * * */
  listenToKeyStrokes (e) {
    if (!e || !e.keyCode) return
    const currHistory = this.state.keystrokes_history
    const newHistory = [...currHistory, e.keyCode]
    this.setState({ keystrokes_history: newHistory })
    this.watchKonamiCode()
  }

  /* * * * * * * * * * * * * * * * *
   *
   * WATCH KONAMI CODE
   *
   * * * * * * * * * * * * * * * * */
  watchKonamiCode () {
    const konamiCodeStr = '38,38,40,40,37,39,37,39,66,65'
    const lastTenKeys = this.state.keystrokes_history.slice(-10)
    if (lastTenKeys.join(',') === konamiCodeStr) this.setState({ konami_mode: true })
  }

  /* * * * * * * * * * * * * * * * *
   *
   * SET ORIGIN
   *
   * * * * * * * * * * * * * * * * */
  setOrigin () {
    if (!this.$originSelect || !this.$originSelect.value) return
    const origin = this.$originSelect.value
    this.setState(current => ({ ...current, origin, step: 'vote' }))
  }

  /* * * * * * * * * * * * * * * * *
   *
   * VOTE FOR
   *
   * * * * * * * * * * * * * * * * */
  voteFor (vote) {
    const req = {
      origin: this.state.origin,
      city: this.state.current_city.city,
      vote
    }
    window.fetch('/le-jeu-du-sud/vote', {
      method: 'POST',
      body: JSON.stringify(req),
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.ok ? res.json() : new Error(res.statusText))
      .then(res => console.log(res))
      .catch(err => console.log(err))
  }

  /* * * * * * * * * * * * * * * * *
   *
   * RENDER
   *
   * * * * * * * * * * * * * * * * */
  render () {
    const { c, state, props } = this

    /* Assign classes */
    const classes = [c]
    if (state.loading_sheet) classes.push(`${c}_loading`)
    if (state.error_sheet) classes.push(`${c}_error`)

    /* Load & errors */
    if (state.loading_sheet) return <div className={classes.join(' ')}><div className='lblb-default-apps-loader'><Loader /></div></div>
    if (state.error_sheet) return <div className={classes.join(' ')}><div className='lblb-default-apps-error'><LoadingError /></div></div>

    /* Display component */
    return <div
      className={classes.join(' ')}
      style={{ marginTop: '30px' }}>
      {state.step === 'choose origin' && <div>
        <select ref={n => this.$originSelect = n}>
          <option value='Auvergne-Rhône-Alpes'>Auvergne-Rhône-Alpes</option>
          <option value='Bourgogne-Franche-Comté'>Bourgogne-Franche-Comté</option>
          <option value='Bretagne'>Bretagne</option>
          <option value='Centre-Val de Loire'>Centre-Val de Loire</option>
          <option value='Corse'>Corse</option>
          <option value='Grand Est'>Grand Est</option>
          <option value='Hauts-de-France'>Hauts-de-France</option>
          <option value='Île-de-France'>Île-de-France</option>
          <option value='Normandie'>Normandie</option>
          <option value='Nouvelle-Aquitaine'>Nouvelle-Aquitaine</option>
          <option value='Occitanie'>Occitanie</option>
          <option value='Pays de la Loire'>Pays de la Loire</option>
          <option value="Provence-Alpes-Côte d'Azur">Provence-Alpes-Côte d'Azur</option>
        </select>
        <button onClick={this.setOrigin}>OK</button>
      </div>}
      {state.step === 'vote' && <div>
        <PageTitle>{state.current_city.city}</PageTitle>
        <button onClick={e => this.voteFor('north')}>Nord</button>
        <button onClick={e => this.voteFor('south')}>Sud</button>
        <button onClick={e => this.voteFor(null)}>Je ne connais pas cette ville</button>
      </div>}
      <div className='lblb-default-apps-footer'>
        <ShareArticle short iconsOnly tweet={props.meta.tweet} url={props.meta.url} />
        <ArticleMeta
          publishedOn='02/09/2019 17:13' updatedOn='03/09/2019 10:36' authors={[
            { name: 'Jean-Sol Partre', role: '', link: 'www.liberation.fr' },
            { name: 'Maxime Fabas', role: 'Production', link: 'lol.com' }
          ]}
        />
        <LibeLaboLogo target='blank' />
      </div>
    </div>
  }
}
