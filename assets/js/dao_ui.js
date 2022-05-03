import { getConfig } from './blockchain/aux.js'

function sanitize(html) {
  let doc = new DOMParser().parseFromString(html, 'text/html');
  let text = doc.body.textContent || "";
  return text.replaceAll('"', "'")
}

// HTML to display a label: value as a form group
function html_form_group(label, id, value, editable = false) {
  // The form is editable if the value == ''
  const class_name = (editable) ? 'form-control' : 'form-control-plaintext'

  return `
  <div class="form-group row">
    <label for="${id}" class="col-sm-3 col-form-label">${label}:</label>
    <div class="col-sm-9">
      <input class="${class_name}" id="${id}" value="${sanitize(value)}">
    </div>
  </div>
  `
}

const proposalIcons = {
  'AddMemberToRole': 'fa-user-graduate',
  'FunctionCall': 'fa-vials',
  'Transfer': 'fa-gem',
}

class ProposalKind {
  // All proposals have a 'kind' field, which is an object with
  // different fields. We know the expected value of some fields
  // i.e. we should always target our DAO on a function call
  constructor(name, labels, ids, titleString, defaults) {
    this.name = name
    this.titleString = titleString
    this.labels = labels
    this.ids = ids
    this.default = {}
    for (let i = 0; i < ids.length; i++) {
      this.default[ids[i]] = defaults[i]
    }
  }

  get icon() {
    return proposalIcons[this.name] ? proposalIcons[this.name] : 'fa-landmark'
  }

  extractTitle(proposal) {
    let title = this.titleString;
    for (const id of this.ids) {
      const value = proposal.kind[this.name][id]
      title = title.replace(id, value)
    }
    return title;
  }

  object_to_html(kind_obj = this.default) {
    // Takes a Kind object and transforms it into html
    let html = ''
    let editable = kind_obj == this.default

    for (let i = 0; i < this.ids.length; i++) {
      const value = kind_obj[this.ids[i]]
      html += html_form_group(this.labels[i], this.ids[i], value, !value && editable)
    }

    return html
  }

  get_object_from_DOM() {
    // Reconstructs a kind object from the DOM
    let fields = {}
    for (let i = 0; i < this.ids.length; i++) {
      fields[this.ids[i]] = $(`#${this.ids[i]}`)[0].value
    }

    let result = {}
    result[this.name] = fields
    return result
  }
}

class Action {
  constructor(method_name, args) {
    const encoded_args = Buffer.from(JSON.stringify(args)).toString("base64")

    this.method_name = method_name
    this.args = encoded_args
    this.deposit = "0"
    this.gas = "5000000000000"
  };
}

class FunctionCall {
  constructor(method = '', label = '', param = '', titleString, type = null) {
    this.titleString = titleString
    this.label = label
    this.param = param
    this.method = method
    this.type = type
  }

  get icon() {
    return 'fa-code'
  }

  extractTitle(proposal) {
    const action = proposal.kind.FunctionCall.actions[0]
    let args = (action.args) ? atob(action.args) : ""
    if (args != "") {
      args = JSON.parse(args)[this.param];
    }
    return this.titleString.replace(this.param, args);
  }

  object_to_html(kind_obj = null) {
    if (kind_obj === null) {
      // The HTML is only the parameter we want the user to fill
      return html_form_group(this.label, this.param, '', true)
    }

    // Else: we transform the object into html
    let html = ''

    const receiver = kind_obj['receiver_id']
    html += html_form_group('Contract', 'id_contract', receiver)

    const keys = ['method_name', 'deposit', 'gas', 'args']
    const labels = ['Method', 'Deposit', 'GAS', 'Arguments']
    for (const i in kind_obj['actions']) {
      const action = kind_obj['actions'][i]

      action['args'] = (action.args) ? atob(action.args) : ""
      for (let i = 0; i < keys.length; i++) {
        html += html_form_group(labels[i], '', action[keys[i]])
      }
    }

    return html
  }

  get_object_from_DOM() {
    let fields = {}
    fields['receiver_id'] = getConfig('pool').contractName

    let args = {}
    const value = $(`#${this.param}`)[0].value
    args[this.param] = this.type(value)  // cast to type

    const action = new Action(this.method, args)

    fields['actions'] = [action]

    return { FunctionCall: fields }
  }
}

// Instances

const AddMemberToRole = new ProposalKind(
  'AddMemberToRole',
  ['Who', 'Role'], ['member_id', 'role'],
  `Give <span>member_id</span> the role of <span>role</span>.`,
  ['', '']
)

const Transfer = new ProposalKind(
  'Transfer',
  ['Token', 'To', 'Amount'], ['token_id', 'receiver_id', "amount"],
  `Grant <span>receiver_id</span> the requested <span>amount</span> N.`,
  //[getConfig('token').contractName, '', '']
  ['', '', '']
)

const ChangeMaxRaffle = new FunctionCall(
  'change_max_raffle', 'Max. Tickets (yn)', 'new_max_raffle',
  `Change max raffle to <span>new_max_raffle</span> tickets.`,
  String
)

const ChangeMaxUsers = new FunctionCall(
  'change_max_users', 'Max. Users', 'new_amount',
  `Change max number of users to <span>new_amount</span>.`,
  Number
)

const ChangeMaxDeposit = new FunctionCall(
  'change_max_deposit', 'Max. Tickets (yn)', 'new_max_deposit',
  `Change max amount of tickets to <span>new_max_amount</span>.`,
  String
)

const ChangeMinDeposit = new FunctionCall(
  'change_min_deposit', 'Max. Tickets (yn)', 'new_min_deposit',
  `Change min amount of tickets to <span>new_min_amount</span>.`,
  String
)

const ChangeTime = new FunctionCall(
  'change_time_between_raffles', 'Time (nanoseconds)', 'new_time',
  `Change time between raffles to <span>new_time</span> nanoseconds.`,
  String
)

const ChangePoolFees = new FunctionCall(
  'change_pool_fees', 'Fees (%)', 'new_fees',
  `Change pool fees to <span>new_fees%</span>.`,
  Number
)


const implemented = {
  'AddMemberToRole': AddMemberToRole,
  //'Transfer': Transfer,
  'FunctionCall': new FunctionCall(),
  'change_max_users': ChangeMaxUsers,
  'change_max_deposit': ChangeMaxDeposit,
  'change_min_deposit': ChangeMinDeposit,
  'change_time_between_raffles': ChangeTime,
  'change_max_raffle': ChangeMaxRaffle,
  'change_pool_fees': ChangePoolFees
}



// Edit ------------------------------------------------
export function create_selector(elem_id) {
  $(`#${elem_id}`).html(`
    <select class="form-control my-3" name="kind" onchange="change_kind()" id="kind-select">
      <option value="">--Please choose an option--</option>

      <option value="change_max_deposit">Limit Tickets per Users</option>      
      <option value="change_time_between_raffles">Change Time Between Raffles</option>
      <option value="change_pool_fees">Change Reserve Fees</option>
      <option value="change_max_users">Limit Number of Pool Users</option>
      <option value="change_max_raffle">Change Maximum Raffle</option>
      <option value="AddMemberToRole">Add Member To Role</option>
      
    </select>
    <div id="selected-kind"></div>
    `
  )
}

export function change_kind() {
  const value = $('#kind-select')[0].value
  let html = implemented[value].object_to_html()
  $('#selected-kind').html(html)
}

export function get_kind() {
  const value = $('#kind-select')[0].value
  return implemented[value].get_object_from_DOM()
}


// Proposal ----------------------------------------
const status2html = {
  'InProgress': '<span class="text-info"> Voting </span>',
  'Approved': '<span class="text-success"> Approved </span>',
  'Rejected': '<span class="text-danger"> Rejected </span>',
  'Removed': '<span class="text-danger"> Removed </span>',
  'Expired': '<span class="text-danger"> Expired </span>',
  'Moved': '<span class="text-info"> Moved </span>'
}
const statusColor = {
  'InProgress': 'icon-green',
  'Approved': 'icon-pink',
  'Rejected': 'icon-blue',
  'Removed': 'icon-black',
  'Expired': 'icon-black',
  'Moved': 'icon-black'
}


function getProposalTitle(proposal) {
  if (proposal.kind.AddMemberToRole) {
    return `Give <span>${proposal.kind.AddMemberToRole.member_id}</span> the role of <span>${proposal.kind.AddMemberToRole.role}</span>.`
  }
  if (proposal.kind.Transfer) {
    return `Grant <span>${proposal.kind.Transfer.receiver_id}</span> the requested <span>${proposal.kind.Transfer.amount}</span> N.`
  }

}

export function proposal_to_html(proposal) {
  // Compute remainign time from proposal (TODO)
  const remaining = 'time-remaining'

  // Ask the Kind to give the right html
  let pname = Object.keys(proposal.kind)[0].toString()
  if (pname == 'FunctionCall') {
    pname = proposal.kind[pname].actions[0].method_name;
  }
  const proposalMeta = implemented[pname];
  // const kind_html = implemented[pname].object_to_html(proposal.kind[pname])


  const component = $('.proposal-template').clone()
  component.removeClass('proposal-template')

  component.find('.proposal-icon').addClass(proposalMeta.icon)
  component.find('.proposal-icon').addClass(statusColor[proposal.status])
  component.find('.proposal-title').html(proposalMeta.extractTitle(proposal))

  component.find('.proposal-description').html(sanitize(proposal.description))
  component.find('.proposal-raw').html(JSON.stringify(proposal.kind, null, 2))
  console.log(proposal)
  const submission_time = dayjs.unix(proposal.submission_time).format('DD/MM/YYYY')
  component.find('.submission-time').html(submission_time)
  component.find('.proposer').html(proposal.proposer)
  component.find('.proposal-status').html(proposal.status)


  component.find('.btn-vote').prop('proposal', proposal.id)
  component.find('.votes').attr('id', `votes-${proposal.id}`)
  component.find('.see-all-votes').attr('data-bs-target', `#votes-${proposal.id}`)

  // Get votes
  let votes = { yes: [], no: [] }
  let votesList = ""
  for (const k in proposal.votes) {
    const key = proposal.votes[k] == 'Approve' ? 'yes' : 'no'
    votes[key].push(k)
    votesList += `<li><strong>${k}:</strong> ${proposal.votes[k]}</li>`
  }
  component.find('.votes').html(`<ul>${votesList}</ul>`)

  const yesVotes = Math.trunc(votes.yes.length * 100 / council.length)
  const noVotes = Math.trunc(votes.no.length * 100 / council.length)
  const pendingVotes = 100 - yesVotes - noVotes

  component.find('.progress-yes').css('width', `${yesVotes}%`)
  component.find('.progress-yes').html(`<strong>${yesVotes}% Yes</strong>`)
  component.find('.progress-no').css('width', `${noVotes}%`)
  component.find('.progress-no').html(`<strong>${noVotes}% No</strong>`)

  if (proposal.status != 'InProgress') {
    component.find('.voting').addClass('d-none')
    component.find('.progress-pending').css('width', `${pendingVotes}%`)
    component.find('.progress-pending').removeClass('bg-green')
    component.find('.progress-pending').addClass('bg-black')
    component.find('.progress-pending').html(`<strong>${pendingVotes}% Not Casted</strong>`)
  } else {
    component.find('.progress-pending').css('width', `${pendingVotes}%`)
    component.find('.progress-pending').html(`<strong>${pendingVotes}% Pending</strong>`)

  }

  component.removeClass('collapse')

  return component
}