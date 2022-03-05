import {getConfig} from './aux.js'
const nearConfig = getConfig('testnet')

window.nearApi = nearApi

export function login() {
  walletConnection.requestSignIn(nearConfig.TOKENadress, 'Pool Party - Token');
}

export function logout() {
  walletConnection.signOut()
  window.location.replace(window.location.origin + window.location.pathname)
}

export async function initNEAR() {
  // Initializing connection to the NEAR node.
  window.near = await nearApi.connect(Object.assign(nearConfig, {deps:{keyStore: new nearApi.keyStores.BrowserLocalStorageKeyStore()}}));

  // Needed to access wallet login
  window.walletConnection = await new nearApi.WalletConnection(window.near, nearConfig.TOKENadress)
  window.walletAccount = walletConnection.account()

  // Initializing our contract APIs by contract name and configuration.
  window.contract = await near.loadContract(
    nearConfig.TOKENadress,
    {viewMethods: ['ft_balance_of'],
    changeMethods: ['new', 'cache_pool_party_reserve',
                    'exchange_tokens_for_tickets',
                    'exchange_near_for_tokens',
                    'storage_deposit'],
     sender: window.walletAccount.accountId}
  );
}

export async function exchange_near_for_tokens(amount){
  amount = nearAPI.utils.format.parseNearAmount(amount.toString())
  return await walletAccount.functionCall(
    nearConfig.TOKENadress, 'exchange_near_for_tokens', {}, 300000000000000, amount
  )
}

export async function exchange_tokens_for_tickets(amount_token){
  // amount = nearAPI.utils.format.parseNearAmount(amount_token.toString())
  return await walletAccount.functionCall(
    nearConfig.TOKENadress, 'exchange_tokens_for_tickets',
    {amount_tokens: amount_token}, 300000000000000, 0
  )
}

export async function cache_pool_party_reserve(){
  // amount = nearAPI.utils.format.parseNearAmount(amount_token.toString())
  return await walletAccount.functionCall(
    nearConfig.TOKENadress, 'cache_pool_party_reserve',
    {}, 300000000000000, 0
  )
}

export async function storage_deposit(){
  amount = nearAPI.utils.format.parseNearAmount("0.00125")
  return await walletAccount.functionCall(
    nearConfig.TOKENadress, 'storage_deposit', {}, 300000000000000, amount
  )
}