const CONTRACT_NAME = 'pool5.pool-party.testnet'
const DAO_ADDRESS = 'genesis.dao3.pool-party.testnet'
const TOKEN_ADDRESS = 'token.pool-party.testnet'

export function floor(value, decimals=2){
  value = parseFloat(String(value).replace(',', ''))
  let number = Number(Math.floor(value+'e'+decimals)+'e-'+decimals)
  if(isNaN(number)){number = 0}
  return number
}

export function getConfig(env) {
  switch (env) {

  case 'pool':
    return {
      networkId: 'testnet',
      nodeUrl: 'https://rpc.testnet.near.org',
      contractName: CONTRACT_NAME,
      walletUrl: 'https://wallet.testnet.near.org',
      helperUrl: 'https://helper.testnet.near.org',
      explorerUrl: 'https://explorer.testnet.near.org',
    }
  case 'dao':
    return {
      networkId: 'testnet',
      nodeUrl: 'https://rpc.testnet.near.org',
      contractName: DAO_ADDRESS,
      walletUrl: 'https://wallet.testnet.near.org',
      helperUrl: 'https://helper.testnet.near.org',
      explorerUrl: 'https://explorer.testnet.near.org',
    }
  case 'token':
    return {
      networkId: 'testnet',
      nodeUrl: 'https://rpc.testnet.near.org',
      contractName: TOKEN_ADDRESS,
      walletUrl: 'https://wallet.testnet.near.org',
      helperUrl: 'https://helper.testnet.near.org',
      explorerUrl: 'https://explorer.testnet.near.org',
    }
  default:
    throw Error(`Unconfigured environment '${env}'. Can be configured in src/config.js.`)
  }
}