const CONTRACT_NAME = 'v1.poolparty2.testnet'
// const DAO_ADDRESS = 'genesis.dao.poolparty.near'
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
      networkId: 'testnet',
      nodeUrl: 'https://test.rpc.fastnear.com',
      contractName: 'v1.poolparty2.testnet',
      walletUrl: 'https://testnet.mynearwallet.com',
      helperUrl: 'https://helper.testnet.near.org',
      explorerUrl: 'https://nearblocks.io',
    }
  case 'dao':
    return {
      networkId: 'testnet',
      nodeUrl: 'https://test.rpc.fastnear.com',
      contractName: 'v1.poolparty2.testnet',
      walletUrl: 'https://testnet.mynearwallet.com',
      helperUrl: 'https://helper.testnet.near.org',
      explorerUrl: 'https://nearblocks.io',
    }
  case 'token':
    return {
      networkId: 'testnet',
      nodeUrl: 'https://rpc.mainnet.near.org',
      contractName: 'v1.poolparty2.testnet',
      walletUrl: 'https://testnet.mynearwallet.com',
      helperUrl: 'https://helper.testnet.near.org',
      explorerUrl: 'https://nearblocks.io',
    }
  default:
    throw Error(`Unconfigured environment '${env}'. Can be configured in src/config.js.`)
  }
}
