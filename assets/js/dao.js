import {initNEAR, login, logout, add_proposal,
        get_policy, get_proposals, act_proposal} from './blockchain/dao.js'

import {create_selector, change_kind, get_kind, proposal_to_html} from './dao_ui.js'

// var relativeTime = require('dayjs/plugin/relativeTime')
dayjs.extend(dayjs_plugin_relativeTime)


async function get_and_display_policy(){
  const policy = await get_policy()

  $('#dao-address').html(window.nearConfig.DAOaddress)
  $('#dao-bond').html(policy.proposal_bond+ " N")
  const seconds = parseFloat(policy.proposal_period)/1000000000
  const daoTime = dayjs().to(dayjs().add(seconds,'second'),true)
  $('.dao-time').html(daoTime)

  // Get council from Roles object
  let council_html = ''

  for(let i=0; i<policy.roles.length; i++){
    if(policy.roles[i].name == 'council'){
      window.council = policy.roles[i].kind.Group
      council_html = council.join(' - ')
    }
  }

  $('#dao-council').html(council_html)
}

async function get_and_display_proposals(){
  console.log("Getting last 10 proposals from the DAO - VIEW")

  let proposals = await get_proposals(0, 10)

  let components = ''
  for(let i=proposals.length-1; i>=0; i--){
    components += proposal_to_html(proposals[i])
  }

  $('#existing-proposals').html(components)
  return proposals
}

async function flow(){
  await get_and_display_policy()
  const proposals = await get_and_display_proposals()

  if (!window.walletAccount.accountId){
    $(".logged-in").hide()
    $(".logged-out").show()
  }else{
    $(".logged-in").show()
    
    $(".logged-out").hide()
    $('#account').html(window.walletAccount.accountId)
    // if () check if council member

    $(".logged-in-council").show()
    create_selector('e-kind')
    add_buttons_to_proposals(proposals)
  }
}

function add_buttons_to_proposals(proposals){
    // Add buttons
    const accId = window.walletAccount.accountId
    const is_council = window.council.includes(accId)

    for(let i=proposals.length-1; i>=0; i--){
      const proposal = proposals[i]
      const voted = accId in proposal.votes
      let buttons = ''
      if (proposal.status == 'InProgress' ){
        const disabled = (is_council && !voted)? '': 'disabled'
        buttons += `<button ${disabled} onclick="vote(${proposal.id}, 'VoteApprove')" class="btn btn-success mb-2">Approve</button>
                    <button ${disabled} onclick="vote(${proposal.id}, 'VoteReject')" class="btn btn-danger mb-2">Reject</button>
                    <button ${disabled} onclick="vote(${proposal.id}, 'VoteRemove')" class="btn btn-secondary mb-2">Remove</button>`
      }

      $(`#p-buttons-${proposal.id}`).html(buttons)
    }

}

// Globals
window.login = login
window.logout = logout
window.change_kind = change_kind
window.council = []

window.onload = function(){
  window.nearInitPromise = initNEAR()
  .then(flow)
  .catch(console.error)
}

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