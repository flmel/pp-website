// Form Group Component
function form_group(label, id, value, editable){
  const class_name = (editable) ? 'form-control' : 'form-control-plaintext'
  return `
  <div class="form-group row">
    <label for="${id}" class="col-sm-3 col-form-label">${label}:</label>
    <div class="col-sm-9">
      <input class="${class_name}" id="${id}" value='${value}'>
    </div>
  </div>
  `
}

const status2html = {'InProgress': '<span class="text-info"> Voting </span>',
                     'Approved': '<span class="text-success"> Approved </span>',
                     'Rejected': '<span class="text-danger"> Rejected </span>',
                     'Removed': '<span class="text-danger"> Removed </span>',
                     'Expired': '<span class="text-danger"> Expired </span>',
                     'Moved': '<span class="text-info"> Moved </span>'
                    }


// Proposal Component
export function proposal_component(proposal){
  const pname = get_proposal_name(proposal.kind)
  const remaining = 'time-remaining'
  let votes = ''
  
  for(const k in proposal.votes){
    votes += `<li> ${k}: ${proposal.votes[k]} </li>`
  }

  let buttons = ''
  if (proposal.status == 'InProgress'){
    const is_council = window.council.includes(window.walletAccount.accountId)
    let disabled = (is_council)? '': 'disabled'
    buttons += `<button ${disabled} onclick="vote(${proposal.id}, 'VoteApprove')" class="btn btn-primary mb-2">Approve</button>
                <button ${disabled} onclick="vote(${proposal.id}, 'VoteReject')" class="btn btn-danger mb-2">Reject</button>`
  }

  return `
  <div class="col-md-5 p-4 m-3 proposal" data-aos="fade-up">
    <div class="row">
      <div class="col-6"> <p id="p-id-status">${status2html[proposal.status]}</p> </div>
      <div class="col-6 text-end"> <p id="p-time">${remaining}</p> </div>
    </div>

    <h4 id="p-title">#${proposal.id}: ${pname}</h4>
    <div id="p-kind">${get_kind_html(proposal.kind)}</div>

    <hr>

    ${form_group("Proposer", "p-proposer", proposal.proposer, false)}
    <p> Description: ${proposal.description} </p>

    <div class="logged-in">

      <h6>Votes</h6>
      <div class="col-sm-10">
        <ul id="p-votes">${votes}</ul>
      </div>

      ${buttons}

    </div>
  </div>
  `
}


// Class
class ProposalKind{
  // All proposals have a 'kind' field, which is an object with
  // different fields. We know the expected value of some fields
  // i.e. we should always target our DAO on a function call
  constructor(name, labels, ids, defaults){
    this.name = name
    this.labels = labels
    this.ids = ids
    this.defaults = defaults
  }
  
  object_to_html(kind_obj){
    // Takes a Kind object and transforms it into html
    let html = ''

    for(let i=0; i < this.ids.length; i++){
      html += form_group(this.labels[i], this.ids[i], kind_obj[this.ids[i]], false)
    }

    return html
  }

  default_to_html(){
    let html = ''

    for(let i=0; i < this.ids.length; i++){
        html += form_group(this.labels[i], this.ids[i], this.defaults[i], this.defaults[i] == '')
    }

    return html
  }

  get_object_from_DOM(){
    // Reconstructs a kind object from the DOM
    let fields = {}
    for(let i=0; i < this.ids.length; i++){
      fields[this.ids[i]] = $(`#${this.ids[i]}`)[0].value
    }

    let result = {}
    result[this.name] = fields

    return result
  }
}

class Action{
  constructor(method_name, args){
    const encoded_args = Buffer.from(JSON.stringify(args)).toString("base64")

    this.method_name = method_name
    this.args = encoded_args
    this.deposit = "0"
    this.gas = "5000000000000"
  };
}

class FunctionCall extends ProposalKind{
  constructor(method=[], labels=[], ids=[], type=[]){
    const defaults = []

    for(let i=0; i<labels.length; i++){
      defaults.push('')
    }

    super('FunctionCall', labels, ids, defaults)
    this.method = method
    this.type = type
  }

  object_to_html(kind_obj){
    // Takes a Kind object and transforms it into html
    let html = ''

    const receiver = kind_obj['receiver_id']
    const actions = kind_obj['actions'][0]
    actions.args = atob(actions.args)

    const keys = ['method_name', 'deposit', 'gas', 'args']
    const labels = ['Method', 'Deposit', 'GAS', 'Arguments']

    html += form_group('Contract', 'id_contract', receiver)

    for(let i=0; i<keys.length; i++){
      html += form_group(labels[i], '', actions[keys[i]])
    }
    return html
  }

  get_object_from_DOM(){
    const receiver_id = window.nearConfig.contractName

    let fields = {}
    fields['receiver_id'] = window.nearConfig.contractName

    let args = {}
    for(let i=0; i < this.ids.length; i++){
       const value = $(`#${this.ids[i]}`)[0].value
       const casted = this.type[i](value)
       args[this.ids[i]] = casted
    }

    const action = new Action(this.method, args)

    fields['actions'] = [action]

    let result = {}
    result[this.name] = fields

    return result
  }

}

// Instances

const AddMember = new ProposalKind(
  'AddMemberToRole',
  ['Who', 'Role'], ['member_id', 'role'], ['', '']
)

const Transfer = new ProposalKind(
  'Transfer', 
  ['Token', 'To', 'Amount'], ['token_id', 'receiver_id', "amount"], [window.nearConfig.TOKENaddress, '', '']
)

const ChangeMaxUsers = new FunctionCall(
  'change_max_users', ['Max. Number'], ['new_amount'], [Number]
)

const ChangeMaxDeposit = new FunctionCall(
  'change_max_deposit', ['Max. Tickets (yn)'], ['new_max_amount'], [String]
)

const ChangeTime = new FunctionCall(
  'change_time_between_raffles', ['Time (nanoseconds)'], ['new_time'], [String]
)

const ChangePoolFees = new FunctionCall(
  'change_pool_fees', ['Fees (%)'], ['new_fees'], [Number]
)

// propose_new_guardian(new_guardian:string)
//Action('propose_new_guardian', {new_guardian:''}, NO_DEPOSIT, BASIC_GAS)


const proposals = [AddMember, new FunctionCall(), Transfer]

const implemented = {
  'AddMember': AddMember,
  'GrantRequest': Transfer,
  'ChangeMaxUsers': ChangeMaxUsers,
  'ChangeMaxDeposit':ChangeMaxDeposit,
  'ChangeTime': ChangeTime,
  'ChangePoolFees': ChangePoolFees
}


export function get_proposal_name(kind_obj){
  for(let i=0; i<proposals.length;i++){
    if(kind_obj.hasOwnProperty(proposals[i].name)){
      return proposals[i].name
    }
  }
}

export function get_kind_html(kind_obj){
  for(let i=0; i<proposals.length; i++){
    if(kind_obj.hasOwnProperty(proposals[i].name)){
      return proposals[i].object_to_html(kind_obj[proposals[i].name])
    }
  }
}


// Edit ------------------------------------------------
export function create_selector(elem_id){
  $(`#${elem_id}`).html(`
    <select class="form-control my-3" name="kind" onchange="change_kind()" id="kind-select">
      <option value="">--Please choose an option--</option>

      <option value="ChangeMaxDeposit">Limit Tickets per Users</option>      
      <option value="ChangeTime">Change Time Between Raffles</option>
      <option value="ChangePoolFees">Change Reserve Fees</option>
      <option value="ChangeMaxUsers">Limit Number of Pool Users</option>
      <option value="GrantRequest">Grant Request</option>
      <option value="AddMember">Add Member To Role</option>
      
    </select>
    <div id="selected-kind"></div>
    `
  )
}

export function change_kind(){
  const value = $('#kind-select')[0].value
  let html = implemented[value].default_to_html()
  $('#selected-kind').html(html)
}

// Get
export function get_kind(){
  const value = $('#kind-select')[0].value
  return implemented[value].get_object_from_DOM()
}