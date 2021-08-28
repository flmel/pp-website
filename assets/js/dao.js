import {initNEAR, login, logout, add_proposal,
        get_policy, get_proposals, act_proposal} from './blockchain/dao.js'

import {create_selector, change_kind, get_kind, proposal_component} from './dao_ui.js'

async function get_and_display_policy(){
  const policy = await get_policy()
  $('#dao-address').html(window.nearConfig.DAOaddress)
  $('#dao-bond').html(policy.proposal_bond)
  $('#dao-time').html(policy.proposal_period)
  
  let council_html = ''

  for(let i=0; i<policy.roles.length; i++){
    if(policy.roles[i].name == 'council'){
      window.council = policy.roles[i].kind.Group
      council_html = council.join(', ')
    }
  }
  $('#dao-council').html(council_html)
}

async function get_and_display_proposals(){
  console.log("Getting last 10 proposals from the DAO - VIEW")

  let proposals = await get_proposals(0, 10)
  window.proposals = proposals

  let components = ''
  for(let i=proposals.length-1; i>=0; i--){
    components += proposal_component(proposals[i])
  }

  $('#existing-proposals').html(components)
}

async function flow(){
  get_and_display_policy()
  get_and_display_proposals()
  if (!window.walletAccount.accountId){
    $(".logged-in").hide()
  }else{
    $(".logged-out").hide()
    $('#account').html(window.walletAccount.accountId)
    create_selector('e-kind')
  }
}


// LOGIN - LOGOUT

window.onload = function(){
  window.nearInitPromise = initNEAR()
  .then(flow)
  .catch(console.error)
}

window.login = login
window.logout = logout
window.change_kind = change_kind
window.council = []

window.vote = async function vote(id, action){
  try{
    await act_proposal(id, action)
    window.location.replace(window.location.origin + window.location.pathname)
  }catch{
    alert("Error while voting")
  }
}

window.submit_proposal = function submit_proposal(){
  const description = $('#e-description')[0].value
  const kind = get_kind()
  add_proposal(description, kind)
}