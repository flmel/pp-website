import {initNEAR, login, logout, get_pool_info, get_account,
        stake, unstake, withdraw, raffle, update_prize,
        get_last_winners, floor, interact_external} from './blockchain/pool.js'

async function get_and_display_user_info(){
  // reset ui
  const spin = '<span class="fas fa-sync fa-spin"></span>'
  $('.user-staked').html(spin)
  $('.user-unstaked').html(spin)
  $('#user-odds').html(spin)
  $('#btn-leave').hide()
  $('#withdraw_btn').hide()
  $('#withdraw-msg').show()
  $('#withdraw-countdown').hide()

  console.log("Getting user information - VIEW")
  window.user = await get_account(window.walletAccount.accountId)
  $('.user-staked').html(user.staked_balance)
  $('.user-unstaked').html(user.unstaked_balance)

  if(user.staked_balance > 0){
    $('#exchange-input')[0].setAttribute("max", user.staked_balance)
    $('#btn-leave').show()
  }

  if(user.unstaked_balance > 0 && !user.available){
    $('#withdraw_btn').hide()
    $('#withdraw-msg').hide()
    $('#withdraw-countdown').show()

    $("#withdraw-time-left").html(user.available_when*2 + " Days")
  }

  if(user.available){
    $('#withdraw-msg').html("You can withdraw your NEAR!");
    $('#withdraw_btn').show()
  }

  if(user.staked_balance > 0){
    const pool = await get_pool_info()
    let odds = user.staked_balance / (pool.total_staked - pool.reserve)
    odds = (odds < 0.01)? "< 1" : (odds*100).toFixed(2)
    $('#user-odds').html(odds+"%")
  }else{
    $('#user-odds').html(0)
  }
}

function flow(){
  if (!window.walletAccount.accountId){
    not_logged_in_flow()
  }else{
    logged_in_flow()
  }

  console.log("Getting winners - VIEW")
  get_last_winners().then((winners) => show_winners(winners))
}

async function not_logged_in_flow(){
  $(".logged-in").hide()
  const pool = await get_pool_info()
  show_pool_info(pool)
}

async function logged_in_flow(){
  $(".logged-out").hide()
 
  $('#account').html(window.walletAccount.accountId)

  let pool = await get_pool_info()
  show_pool_info(pool)

  const twelve_hours = 21600000
  if(Date.now() > pool.last_prize_update + twelve_hours){
    // More than 12hs since last update
    console.log("Asking pool to update prize")
    await ui_update_prize(pool)
  
    if(pool.withdraw_ready){
      console.log("Interacting with external pool")
      await interact_external()
    }
  }

  if(pool.prize == 0){ 
    console.log("Asking pool to update prize")
    await update_prize()
  }


  if(pool.next_raffle < Date.now() && pool.total_staked > 0){
    console.log("Asking pool to update prize")
    await update_prize()

    console.log("Asking pool to make the raffle")
    await raffle()

    pool = await get_pool_info()
    show_pool_info(pool)
  }

  get_and_display_user_info()
}

async function ui_update_prize(pool){
  const sm_spin = '<span class="fas fa-sync fa-spin fs-6 float-end"></span>'
  const prize = pool.prize
  $('.pool-prize').html(floor(prize) + sm_spin)
  update_prize().then((prize) => $('.pool-prize').text(floor(prize)))
}

async function show_pool_info(pool){
  let data = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=near&vs_currencies=usd").then(response => response.json()).then(data => data)
  const n2usd = data['near']['usd']

  $('.pool-tickets').text(floor(pool.total_staked - pool.reserve))
  $('.pool-prize').text("$" + floor(pool.prize*n2usd, 0))
  $('#prize-near').text(floor(pool.prize, 2))
  

  $("#time-left").countdown(pool.next_raffle, {})
  .on('update.countdown', (event) => update_counter(event, false))
  .on('finish.countdown', (event) => update_counter(event, true));
}

function show_winners(winners){
  $('#winners').html('')
  for (var i = 0; i < winners.length; i++) {
    $('#winners').append(
      `<li class="row">
        <div class="col-8 text-start">${winners[i].account_id}</div>
        <div class="col-4 text-end">${winners[i].amount} N  </div>
       </li>`);
  }
}

function update_counter(event, ended){
  if(ended){
    if(window.walletAccount.accountId){
      // logged in
      $("#time-left").text( "Raffling!" );
      logged_in_flow()
    }else{
      $("#time-left").text( "Log in to Raffle!" );
    }
  }else{
    var totalHours = event.offset.totalDays * 24 + event.offset.hours;
    var days = event.offset.totalDays
    $("#time-left").text( event.strftime(`%-d day%!d %H:%M:%S`));
  }

}

window.buy_tickets = function(){
  const hminput = $("#how-much-input")[0]
  if(!hminput.checkValidity()){
    hminput.reportValidity()
    return
  }

  const toStake = floor($("#how-much-input").val());
  if (!isNaN(toStake)){
    $('#buy-btn').html('<span class="fas fa-sync fa-spin text-white"></span>')
    stake(toStake);
  }
}

window.return_ticket = async function(){
  if(window.user.staked_balance > 0){
    const amount = floor($("#exchange-input").val());

    const einput = $("#exchange-input")[0]
    if(!einput.checkValidity()){
      einput.reportValidity()
      return
    }

    $('.user-staked').html('<span class="fas fa-sync fa-spin"></span>')
    const result = await unstake(amount);
    if(result){
      get_and_display_user_info()
      get_pool_info().then((pool) => show_pool_info(pool))
    }
  }
}

window.unstake = unstake
window.interact_external = interact_external

window.withdraw = async function(){
  console.log("Withdrawing all from user")

  $('.user-unstaked').html('<span class="fas fa-sync fa-spin"></span>')

  try{
    await withdraw() // throws error on fail, nothing on success
    get_and_display_user_info() 
  }catch{
    $('.user-unstaked').html('Try again later. If the error persists, login again')
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
window.update_prize = update_prize
$('#accepted')[0].disabled = true