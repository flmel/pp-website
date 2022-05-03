const CONTRACT_NAME = 'pool-v1.poolparty.near'
const DAO_ADDRESS = 'genesis.dao.poolparty.near'
// const TOKEN_ADDRESS = 'token.pool-party.mainnet'

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
      networkId: 'mainnet',
      nodeUrl: 'https://rpc.mainnet.near.org',
      contractName: CONTRACT_NAME,
      walletUrl: 'https://wallet.mainnet.near.org',
      helperUrl: 'https://helper.mainnet.near.org',
      explorerUrl: 'https://explorer.mainnet.near.org',
    }
  case 'dao':
    return {
      networkId: 'mainnet',
      nodeUrl: 'https://rpc.mainnet.near.org',
      contractName: DAO_ADDRESS,
      walletUrl: 'https://wallet.mainnet.near.org',
      helperUrl: 'https://helper.mainnet.near.org',
      explorerUrl: 'https://explorer.mainnet.near.org',
    }
  case 'token':
    return {
      networkId: 'mainnet',
      nodeUrl: 'https://rpc.mainnet.near.org',
      contractName: TOKEN_ADDRESS,
      walletUrl: 'https://wallet.mainnet.near.org',
      helperUrl: 'https://helper.mainnet.near.org',
      explorerUrl: 'https://explorer.mainnet.near.org',
    }
  default:
    throw Error(`Unconfigured environment '${env}'. Can be configured in src/config.js.`)
  }
}