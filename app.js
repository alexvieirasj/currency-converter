/*
  - No index.html, comente a div com a classe "container" que contém a tabela;
  - Descomente: 
    - A <div> com a classe "container" abaixo da div que você acabou de 
      comentar;
    - A <link> que importa o style.css;
  - Construa uma aplicação de conversão de conversão de moedas. O HTML e CSS 
    são os que você está vendo no browser (após salvar os arquivos);
  - Você poderá modificar a marcação e estilos da aplicação depois. No momento, 
    concentre-se em executar o que descreverei abaixo;
    - Quando a página for carregada: 
      - Popule os <select> com tags <option> que contém as moedas que podem ser
        convertidas. "BRL" para real brasileiro, "EUR" para euro, "USD" para 
        dollar dos Estados Unidos, etc.
      - O option selecionado por padrão no 1º <select> deve ser "USD" e o option
        no 2º <select> deve ser "BRL";
      - O parágrafo com data-js="converted-value" deve exibir o resultado da 
        conversão de 1 USD para 1 BRL;
      - Quando um novo número for inserido no input com 
        data-js="currency-one-times", o parágrafo do item acima deve atualizar 
        seu valor;
      - O parágrafo com data-js="conversion-precision" deve conter a conversão 
        apenas x1. Exemplo: 1 USD = 5.0615 BRL;
      - O conteúdo do parágrafo do item acima deve ser atualizado à cada 
        mudança nos selects;
      - O conteúdo do parágrafo data-js="converted-value" deve ser atualizado à
        cada mudança nos selects e/ou no input com data-js="currency-one-times";
      - Para que o valor contido no parágrafo do item acima não tenha mais de 
        dois dígitos após o ponto, você pode usar o método toFixed: 
        https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toFixed
    - Para obter as moedas com os valores já convertidos, use a Exchange rate 
      API: https://www.exchangerate-api.com/;
      - Para obter a key e fazer requests, você terá que fazer login e escolher
        o plano free. Seus dados de cartão de crédito não serão solicitados.
*/

const currencyOneEl = document.querySelector('[data-js="currency-one"]')
const currencyTwoEl = document.querySelector('[data-js="currency-two"]')
const currenciesEl = document.querySelector('[data-js="currencies-container"]')
const convertedValueEl = document.querySelector('[data-js="converted-value"]')
const valuePrecisionEl = document
  .querySelector('[data-js="conversion-precision"]')
const timeCurrencyOneEl = document
  .querySelector('[data-js="currency-one-times"]')

const showAlert = err => {
  const div = document.createElement('div')
  const button = document.createElement('button')

  div.textContent = err.message
  div.classList.add('alert', 'alert-warning', 'alert-dismissible', 'fade', 'show')
  div.setAttribute('role', 'alert')
  button.classList.add('btn-close')
  button.setAttribute('type', 'button')
  button.setAttribute('aria-label', 'Close')
   
  const removeAlert = () => div.remove()
  button.addEventListener('click', () => removeAlert)

  div.appendChild(button)
  currenciesEl.insertAdjacentElement('afterend', div)
}

const state = (() => {
  let exchangeRate = {}

  return {
    getExchangeRate: () => exchangeRate,
    setExchangeRate: newExchangeRate => {
      if(!newExchangeRate.conversion_rates){
        showAlert({
          message: 'O objeto precisa ter uma propriedade convertion_rates'
        })

        return
      }
      exchangeRate = newExchangeRate
      return exchangeRate
    }
  }
})()

const APIKey = 'c408cc4991c7798b40098192'
const getUrl = currency => 
  `https://v6.exchangerate-api.com/v6/${APIKey}/latest/${currency}`

const getErrormessage = errorType => ({
  'no-data-available' : 'Não foi possivel converter o moeda que você passou, verifique se é uma moeda válida',
  'unsupported-code' : 'A moeda não existe em nosso banco de dados',
  'malformed-request' : 'O endpoint do seu request precisa seguir a estrutura: "https://v6.exchangerate-api.com/v6/YOUR-API-KEY/latest/USD"',
  'invalid-key' : 'A chave da API não é válida',
  'inactive-account' : 'Sua conta está inativa, confirme seu email para prosseguir',
  'quota-reached' : 'Sua chave alcançou o limite de requests do seu plano atual',
  'plan-upgrade-required' : 'Seu plano não suporta esse tipo de request, atualize seu plano'
})[errorType] || 'Não foi possível obter as informações.'


const fetchExchangeRate = async url => { 
  try {
    const response = await fetch(url)

    if(!response.ok) {
      throw new Error('Sua conexão falhou. Não foi possível obter as informações.')
    }

    const exchangeRateData = await response.json()
    //console.log(exchangeRateData)

    if(exchangeRateData.result === 'error') {
      const errorMessage = getErrormessage(exchangeRateData['error-type'])
      throw new Error(errorMessage)
    }

    return state.setExchangeRate(exchangeRateData)
  } catch(err) {
    showAlert(err)
  }
}

const getOptions = (selectedCurrency, conversion_rates) => {
  const setSelectedAttribute = currency => 
    currency === selectedCurrency ? 'selected': ''
  const getOptionsAsArray =  currency => 
    `<option ${setSelectedAttribute(currency)}>${currency}</option>`  

  return Object.keys(conversion_rates)
    .map(getOptionsAsArray)
    .join('')
}

const getMultipliedExchangeRate = conversion_rates => {
  const currencyTwo = conversion_rates[currencyTwoEl.value]
  return (timeCurrencyOneEl.value * currencyTwo).toFixed(2)
}

const getNotRoundedExchangeRate = conversion_rates => {
  const currencyTwo = conversion_rates[currencyTwoEl.value]
  return `1 ${currencyOneEl.value} = ${1 * currencyTwo} ${currencyTwoEl.value}`
}

const showUpdatedRates = ({ conversion_rates }) => {
  convertedValueEl.textContent = getMultipliedExchangeRate(conversion_rates)
  valuePrecisionEl.textContent = getNotRoundedExchangeRate(conversion_rates)
}

const showInitialInfo = ({ conversion_rates }) => {
    currencyOneEl.innerHTML = getOptions('USD', conversion_rates)
    currencyTwoEl.innerHTML = getOptions('BRL', conversion_rates)

    showUpdatedRates({ conversion_rates }) //recebe short propertie name
}

const init = async () => {
  //const url = getUrl(e.target.value)
  const url = getUrl('USD')
  const exchangeRate = await fetchExchangeRate(url) 

  if(exchangeRate && exchangeRate.conversion_rates) {
    showInitialInfo(exchangeRate)
  }  
} 

const handleTimesCurrencyOneElInput = () => {  
  const { conversion_rates } = state.getExchangeRate()  
  convertedValueEl.textContent = getMultipliedExchangeRate(conversion_rates)
}

const handleCurrencyTwoElInput = () => {
  const exchangeRate = state.getExchangeRate()
  showUpdatedRates(exchangeRate)
}

const handleCurrencyOneElInput = async e => {
  const url = getUrl(e.target.value)
  const exchangeRate = await fetchExchangeRate(url)

  showUpdatedRates(exchangeRate)
}

timeCurrencyOneEl.addEventListener('input', handleTimesCurrencyOneElInput)
currencyTwoEl.addEventListener('input', handleCurrencyTwoElInput)
currencyOneEl.addEventListener('input', handleCurrencyOneElInput)

init()


