//window.localStorage.clear(); return false;
//set URL and interval for settings page
window.url 		= localStorage.getItem('url');
window.interval = localStorage.getItem('interval');

//if empty or null
if(window.url == null || window.url == '') { 

	//default value of SOAP URL
	window.url = 'https://webapp.healthcaresynergy.com:8002/demoalpha/CaregiverPortalMobile/CaregiverPortalService.svc';
	
	localStorage.setItem('url', window.url);
}

//if empty or null
if(window.interval == null || window.interval == '') { 
	//default value of refresh Inbox
	window.interval = '5';

	localStorage.setItem('interval', window.interval);
}

/* --------------------------------------------------
			  GLOBAL/CONSTANT VARIABLES
   -------------------------------------------------- */ 
var BASE_URL 				= 'http://hcs-mobile-rest.herokuapp.com/dummy/';
var SOAP_URL 				= window.url+'?singleWsdl';//'https://webapp.healthcaresynergy.com:8002/demoalpha/CaregiverPortalMobile/CaregiverPortalService.svc?singleWsdl';
var PORTAL 					= 'CaregiverPortal';
var NAME_SPACE_URL 			= 'http://www.w3.org/2001/XMLSchema';
var NAME_SPACE_QUALIFIER 	= 'xs';
var SECRET 					= 'w@lkingd3@d!!';
var CONTACT_LIST   			= '<li class="ui-screen-hidden"><a href="#" id="[ID]" class="contact-pick ui-btn ui-btn-icon-right ui-icon-carat-r">[NAME]</a></li>';

window.messages  		= new Messages();
window.user 	 		= new User();
window.messageList  	= [];
window.messageDetail 	= [];
window.users 			= [];
window.contactList  	= [];
window.sender  			= [];
window.online  			= true;
window.start 			= false;
window.username 		= localStorage.getItem('username');
window.password 		= localStorage.getItem('password');
window.snapper;
//scroll message listing up/dowm parameters
window.startCount		= 20;		
window.iscroll;
window.composePage;
//swipe message listing paramaters
var defaultWidth 		= 500;
var	currentImg 			= 0;
var	maxImages 			= 3;
var	speed				= 500;
		
function populateArchive(ids) {
	setTimeout(loaded, 200);
	//clean content
	
	setTimeout(function() {
		for(i in ids) {
			var height = $("#"+ids[i]).css('height');
			
			

			$('#message-archive').append(
				'<div id="delete_'+ids[i]+'" class="row" style="height:'+height+'">'+
	            '<div class="col-xs-6 col-sm-6"></div>'+
	            '<div class="delete-swipe col-xs-6 col-sm-6">'+
	            '<a href="#" onclick="deleteSwipe.call(this,event)" id="'+ids[i]+'"><i class="fa fa-trash-o fa-2x center-swipe"></i></a>'+
	            '</div></div>');
		}
	}, 200);

	
}	

function deleteSwipe(e) {
	$('#message-archive').attr('isOpen', 'true');
	
	var guid = $(this).attr('id');
	var type 	= $('ul.nav-stacked li.active a.left-navigation').attr('id');
	
	window.messages.delete(guid, type);
	
	window.snapper.enable();

	console.log(guid+' delete now')
	return false;
}

function swipeDelete(uid) {

	//make this guys always unique
	$('#'+uid).swipe({
		triggerOnTouchEnd 	: true,
		triggerOnTouchLeave : true,
		allowPageScroll 	: 'vertical',
		swipeStatus 		: function(event, phase, direction, distance, fingers) {
			//get the GUID pf the current div
			var id 		= $(this).attr('id');
			var width 	= parseInt($(this).css('width'))/5;
			
			//disable click on all child of archive 
			$('#message-archive .delete-swipe a').css('pointer-events', 'none');
			//enable specific click
			$('#message-archive #delete_'+id+' .delete-swipe a').css('pointer-events', 'all');
			
			//done process if drag up or down
			if(direction != 'up' && direction != 'down' && direction != 'right') {
				
				//If we are moving before swipe, and we are going L or R, then manually drag the images
				if(phase == "move" && direction == "left") {
					//unset all div 1st
					$('.go-detail').css("-webkit-transform", "translate3d(0px,0px,0px)");
					var duration = 0;
					//if swipe to the left
					if(direction == "left") {
						swipelisting((defaultWidth * currentImg) + distance, duration, id, direction, phase);
					//else it is to the right
					} else if (direction == "right") {
						//swipelisting((defaultWidth * currentImg) - distance, duration, id, direction, phase);
					}	
				//else, cancel means snap back to the begining
				} else if (phase == "cancel") {
					//swipelisting(defaultWidth * currentImg, speed, id, direction, phase);
					swipelisting((defaultWidth * currentImg) + distance, speed, id, direction, phase);	
				//else end means the swipe was completed, so move to the next image
				} else if (phase == "end" ) {
					//on touch end
					swipelisting((defaultWidth * currentImg) + distance, speed, id, direction, phase);	
				}
			//on dragging up or down	
			} else {
				$('#message-list').css('pointer-events', 'all');
				//unset all div in listing
				$('.go-detail').css("-webkit-transform", "translate3d(0px,0px,0px)");
				//enable dragging left panel
				window.snapper.enable();
			}
		},
		
	}); 
}

/**
 * Manually update the position of the div on drag
 *
 */
function swipelisting(distance, duration, id, direction, phase) { 
	
	var value 	= (distance < 0 ? "" : "-") + Math.abs(distance).toString();
	//get the width of the current div then divided by two as limit
	var limit 	= (parseInt($('#'+id).css('width')) / 2);
	var width 	= (parseInt($('#'+id).css('width')) / 4);

	if(phase == 'start') {
	
		//$('#delete_'+id).show();
		$('#message-list').css('pointer-events', 'all');
		$('.go-detail').css("-webkit-transition-duration", (duration/1000).toFixed(1) + "s");
		//slide to the limit
		$('.go-detail').css("-webkit-transform", "translate3d(-"+limit+"px,0px,0px)");
		//on touch end or leave
	} else if(phase == 'end') {

		$('#message-list').css('pointer-events', 'all');
		//animate
		$('#'+id).css("-webkit-transition-duration", (duration/1000).toFixed(1) + "s");
		//if less than limit
		if(Math.abs(value) < width) {
			window.snapper.enable();
			//$('#delete_'+id).hide();
			//slide to the beginning
			$('#'+id).css("-webkit-transform", "translate3d(0px,0px,0px)");
		//if hit the limit
		} else {
			//slide to the limit
			$('#'+id).css("-webkit-transform", "translate3d(-"+limit+"px,0px,0px)");
			//prevent click 
			$('#message-list').css('pointer-events', 'none');
			//disable dragging left panel
			window.snapper.disable();
		}

	} else if(phase == 'cancel'){
		$('#'+id).css("-webkit-transition-duration", (duration/1000).toFixed(1) + "s");
		$('#'+id).css("-webkit-transform", "translate3d(0px,0px,0px)");
		//enable left panel
		window.snapper.enable();

	} else {
		$('#message-list').css('pointer-events', 'all');
		//animate
		$('#'+id).css("-webkit-transition-duration", (duration/1000).toFixed(1) + "s");
		//follow the touch event in div
		$('#'+id).css("-webkit-transform", "translate3d("+value +"px,0px,0px)");
		//console.log(value);
		//$('#d_'+id).css('width', Math.abs(value)++);
		window.snapper.enable();

		$('#message-list').css('pointer-events', 'all');	
	} 
};

function pullDownAction () {
	
	//get the active listing
	var type = $('ul.nav-stacked li.active a.left-navigation').attr('id');
	
    //now make request to backend
    window.messages.checkInbox(type, 1);
				
	window.messageList[type] = _string.unlock(type);			
}

function addOne() {
	
	var type 			= $('ul.nav-stacked li.active a.left-navigation').attr('id');
	var end 			= window.startCount;
	window.startCount 	= window.startCount + 1;
	
	window.messages.pullDown(window.messageList[type], type, window.startCount, end);	
	
	//Remember to refresh when contents are loaded (ie: on ajax completion)
	window.iscroll.refresh();		
	//On click message listing then load message detail
	//base on Message GUID
	onClickDetail(type);	
}

function pullUpAction () {
	
	var type 			= $('ul.nav-stacked li.active a.left-navigation').attr('id');
	var end 			= window.startCount;
	window.startCount 	= window.startCount + 10;
	
	window.messages.pullDown(window.messageList[type], type, window.startCount, end);	
	$(".list-title").shorten();
	//Remember to refresh when contents are loaded (ie: on ajax completion)
	window.iscroll.refresh();		
	//On click message listing then load message detail
	//base on Message GUID
	onClickDetail(type);	
}

/**
 * Core method on pulling message listing
 * lets go navite javascript
 *
 */
function loaded() {

	if($.isEmptyObject(window.iscroll) || typeof window.iScroll === 'undefined') {
		
		var pullDownEl 		= document.getElementById('pullDown');
		var pullDownOffset 	= pullDownEl.offsetHeight;
		var pullUpEl 		= document.getElementById('pullUp');	
		var pullUpOffset 	= pullUpEl.offsetHeight;
		var option 			= {
			useTransition 	: true,
			topOffset 		: pullDownOffset,
			onRefresh 		: function () {
				if (pullDownEl.className.match('loading')) {
					pullDownEl.className = '';
					pullDownEl.querySelector('.pullDownLabel').innerHTML = '';
				} else if (pullUpEl.className.match('loading')) {
					pullUpEl.className = '';
					pullUpEl.querySelector('.pullUpLabel').innerHTML = '';
				}
			},
			onScrollStart : function() {
				$('.go-detail').css("-webkit-transform", "translate3d(0px,0px,0px)");
				
			},
			onScrollMove 	: function () {
				//check where page we are
				var currentPage = $('.current-page').attr('id');
				
				if(currentPage == 'compose') {
					
					//return false;
				}
				
				window.snapper.enable();

				$('.go-detail').css("-webkit-transform", "translate3d(0px,0px,0px)");
				$('#message-list').css('pointer-events', 'all');

				if (this.y > 5 && !pullDownEl.className.match('flip')) {
					$(pullDownEl).show();
					//hide the swipe delete icons behind the message listing
					$('#message-archive').hide();

					pullDownEl.className = 'flip';
					pullDownEl.querySelector('.pullDownLabel').innerHTML = '';
					this.minScrollY = 0;

				} else if (this.y < 5 && pullDownEl.className.match('flip')) {

					pullDownEl.className = '';
					pullDownEl.querySelector('.pullDownLabel').innerHTML = '';
					this.minScrollY = -pullDownOffset;
				
				} else if (this.y < (this.maxScrollY - 5) && !pullUpEl.className.match('flip')) {
				
					pullUpEl.className = 'flip';
					pullUpEl.querySelector('.pullUpLabel').innerHTML = '';
					this.maxScrollY = this.maxScrollY;
					
				} else if (this.y > (this.maxScrollY + 5) && pullUpEl.className.match('flip')) {
					
					pullUpEl.className = '';
					pullUpEl.querySelector('.pullUpLabel').innerHTML = '';
					this.maxScrollY = pullUpOffset;
				
				}
			},
			onScrollEnd 	: function () {
				
				//check where page we are
				var currentPage = $('.current-page').attr('id');
				
				if(currentPage == 'compose') {
					
					return false;
				}
				
				if (pullDownEl.className.match('flip')) {
					pullDownEl.className = 'loading';
					pullDownEl.querySelector('.pullDownLabel').innerHTML = '';				
					//check messages on pull down
					pullDownAction();	
				} else if (pullUpEl.className.match('flip')) {
					
					pullUpEl.className = 'loading';
					pullUpEl.querySelector('.pullUpLabel').innerHTML = '';				
					pullUpAction();	
					
				}
			}
		}
		
		//execute message listing
		window.iscroll = new iScroll('wrapper', option);

		window.composePage = new iScroll('message-compose', option);

		composePage.options.onBeforeScrollStart = function(e) {                
	        var target = e.target;
	        
	        while (target.nodeType != 1) target = target.parentNode;
	        if (target.tagName != 'SELECT' && target.tagName != 'INPUT' && target.tagName != 'TEXTAREA'){
	            e.preventDefault();
	        }
	   	}
	   	

	}
}


/**
 * Fixed for IOS position : fixed
 *
 */
document.addEventListener('touchmove', function (e) { 	
 	if(e.srcElement.type !== "textarea"){ 
        e.preventDefault();
    } 
    
}, false);

function init() {
	/* -----------------------------------------
			  LOGIN PAGE/SETTING PAGE
	   ----------------------------------------- */
	//show setting page
	$('#setting-page').click(function() {
		
		$('.login-error').html('Welcome');
		$('#setting-content').show();
		$('#login-content').hide();
		$('#login-page').show();
		$(this).hide();

		$('#soap-url').val(window.url);
		
		$('#setting-button').click(function() {
			if($('#soap-url').val().length == 0) {
				$('.login-error').html('Url cannot be empty');
				return false;
			}
			localStorage.setItem('url', $('#soap-url').val());
			window.url = localStorage.getItem('url');
	  		SOAP_URL = window.url; 
			
			$('.login-error').html('Url successfully saved');
			return false;
		});
	});

	//show login page
	$('#login-page').click(function() {
		
		$('.login-error').html('Welcome');
		$('#login-content').show();
		
		$('#setting-content').hide();
		$('#setting-page').show();
		$('#loading-login').hide();
		$('.loading-circle').hide();
		
		$(this).hide();

	});
}

function bind() { 
	
	//get the login user data
	var loginUser = window.user.get();

	//check if there is a login user
	if($.isEmptyObject(loginUser)) {
		//show login/ make login
  		window.user.login();
  	//else if there is a user	
  	} else {
  		
  		$('#pullDown').hide();
  		
  		//only add event listener to DOM if user is login
		document.addEventListener('DOMContentLoaded', function () { 

			setTimeout(loaded, 200); 
			
		}, false);

		//get the login username
		var name = loginUser.sender['c:Name']['d:m_firstName']+' '+loginUser.sender['c:Name']['d:m_lastName'];
		
		//make all lowercase then capitalize first letter
		var newName = capitalize(name.toLowerCase());
		//now add the user fullname to the left panel
		$('.user-info h5').html('<b>'+newName+'</b>');
		
		//touch start event on every button on navbar	
		$('.navbar-inverse .navbar-nav li a').on('touchstart', function(e){ 
			$(this).css('background-color', '#006687');
		});

		//touch end event on every button on navbar
		$('.navbar-inverse .navbar-nav li a').on('touchend', function(e){
			$(this).css('background-color', '#324a61');
		});

  		//get contact list
  		window.contactList = window.users = _string.unlock('contactList');

  		//left panel toggle initialization
  		window.snapper = new Snap({
		  //core content
		  element: document.getElementById('content')
		});

  		//count unread message in inbox
		window.messages.countFolder('Inbox');
		
		//get INBOX
  		window.messages.get('Inbox', 20, 0);

  		//show main page
  		mainPage(window.snapper,loginUser);

  		//check Inbox only if there is connection
		if(window.connection) { 
	  		//check inbox for new messages (every 5mins as default)
	  		checkInbox(loginUser);
	  		//on first load, check Outbox
	  		checkOutbox();
	  	}
  	}
}

/**
 * Helper function to make first char of
 * string uppercase 
 *
 * @param string
 * @return string
 */
function capitalize(str) {
    strVal 	= '';
    str 	= str.split(' ');
    for(var chr = 0; chr < str.length; chr++) {
        strVal += str[chr].substring(0, 1).toUpperCase() + str[chr].substring(1, str[chr].length) + ' '
    }

    return strVal
}

/**
 * Check outbox and if found items on it,
 * then send it and make outbox empty
 *
 */ 
function checkOutbox() {
	//send draft left
	window.messageList['Outbox'] = _string.unlock('Outbox');

	//if outbox is empty
	if($.isEmptyObject(window.messageList['Outbox'])) {
		
		return false;
	}
	
	//send if ever there is message saved in outbox
	//whenever has internet
	for(i in window.messageList['Outbox']) {
		//prepare variables
		var subject 	= window.messageList['Outbox'][i]['b:Subject'];
		var content 	= window.messageList['Outbox'][i]['content'];
		var priority 	= window.messageList['Outbox'][i]['priority'];
		var recipients 	= window.messageList['Outbox'][i]['recipients'];
		var guidFake 	= window.messageList['Outbox'][i]['b:Label']['b:MessageGUID'];

		//now send
		window.messages.send(subject, content, priority, recipients, 0);
	}

	//empty out Outbox in local storage
	localStorage.setItem('Outbox', '');

}

/**
 * Click event on message in listing
 * (this must be touchstart)
 *
 */
function onClickDetail(type) {
	
	//on tap message in listing
	$('.go-detail').bind('tap', function(e) {
		//prevent double click
		e.stopPropagation();
		e.preventDefault();
		
		//get the GUID of the message
		var id 		= $(this).attr('id');
		var unread 	= $(this).attr('unread');

		//check if message is unread
		if(unread == 'true') {
			//count the current unread message
			var count = $('#Inbox span.badge').html();
			//only process if there is unread message	
			if(count != 0) {
				//do the math
				var plus = parseInt(count) - 1;

				$('#Inbox span.badge').html(plus);
				$('#folder-name').html($('#Inbox').html());
				
				window.plugin.notification.badge.set(plus);
			}

			$(this).css('background-color', '#E4E4E4');
			$(this).css('font-weight', 'none');
		}

		//prepare UI for detail page
		$('#message-detail').hide();
		$('.message-elem').hide();
		
		//main loading
		mainLoader('start');

		//do ajax call and show detail page
		//if message detail is already saved it 
		//the local storage, then just get the saved
		//local data but if not saved then make 
		//SOAP request to get message datail and save 
		//to local storage
		window.messages.getDetail(id, type, unread);

		return false;
	});	
}
/**
 * This guy will run checkInbox function every 
 * 5 secs if there is a user login
 *
 */
function checkInbox() {
	//get the saved settings of interval
  	window.interval = localStorage.getItem('interval');
	//corvert sec to millisec
	timer = Math.floor(Number(window.interval))*60000;

	//start loop 
	window.setInterval(function(){ 
		//we 1st load os done
		if(window.start) {
			//then check inbox for new message
			window.messages.checkInbox('Inbox', 0);
  		}	
  		
	//}, localStorage.getItem('interval')*60000);
	}, timer);
}

/**
 * Main page loading animation
 *
 * @param string
 */
function mainLoader(action) {
	if(action == 'start') {
		$('.loading-messages').show();
	} else {
		$('.loading-messages').hide();
	}
}

function processSendAgain(guid) {

	$('#process-send-again').unbind().click(function() {

		//prepare variables
		var recipients 	= []
		var subject 	= $('#compose-subject').val();
		var content 	= $('#compose-content').val();
		var priority 	= $('#compose-important option:selected').html();

		//get list of recipients
		$('.to-holder div').each(function() {
			recipients.push(window.contactList[this.id]);
		});

		//if no recipients
		if(recipients.length == 0) {
			//add warning
			$('.warning-holder').html('<div class="alert alert-danger" id="11"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button><strong>Please add at least one recipient</strong></div>');
			
			return false;
		}
		
		$('#subject-modal').modal('hide');

		//if no internet connection
		if(!window.connection) {
			//loading animation
			$('#loading-ajax #text').html('Saving Message');
			$('#loading-ajax').popup('open');
			//save message to outbox		
			saveOutbox(subject, content, priority, recipients);	

		} else { 
			//loading animation
			$('#loading-ajax #text').html('Sending Message');
			$('#loading-ajax').popup('open');
			
			//now do ajax call to send it
			window.messages.send(subject, content, priority, recipients, guid);
		}

		return false;
	});
}

/**
 * Send button handler
 *
 * @param string message GUID
 */
function processSend(guid) {
	//on click send button
	$('#process-send').unbind().click(function() {
	
		//prepare variables
		var recipients 	= []
		var subject 	= $('#compose-subject').val();
		var content 	= $('#compose-content').val();
		var priority 	= $('#compose-important option:selected').html();

		//get list of recipients
		$('.to-holder div').each(function() {
			recipients.push(window.contactList[this.id]);
		});

		//if no recipients
		if(recipients.length == 0) {
			//add warning
			$('.warning-holder').html('<div class="alert alert-danger" id="11"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button><strong>Please add at least one recipient</strong></div>');
			
			return false;
		}

		if(subject.length == 0) {
			$('#subject-modal').modal('show');
			processSendAgain(guid);
			return false;
		}
		//if no internet connection
		if(!window.connection) {
			//loading animation
			$('#loading-ajax #text').html('Saving Message');
			$('#loading-ajax').popup('open');
			//save message to outbox		
			saveOutbox(subject, content, priority, recipients);	

		} else { 
			//loading animation
			$('#loading-ajax #text').html('Sending Message');
			$('#loading-ajax').popup('open');
			
			//now do ajax call to send it
			window.messages.send(subject, content, priority, recipients, guid);
		}

		return false;
	});
}

/**
 * On show compose page, 
 *
 * @return false;
 */
function compose() {
	//flag page as COMPOSE
	$('.current-page').attr('id', 'compose');
	
	//navbars
	//hide delete message icon
	$('#delete-message').hide();
	//show send button icon
	$('#process-send').show();
	//hide compose button icon
	$('#compose-message').hide();
	//back button show
	$('#back-top').show();
	//hide sidebar icon	
	$('#sidebar-top').hide();

	//unset compose fields
	$('form.ui-filterable').
		children().
		children().
		first().
		val('');

	//unset message priority	
	$('#compose-important option').
		removeAttr('selected').
		filter('[value=0]').
		attr('selected', true);

	//to Normal as defailt	
    $('#compose-important-button span').html('Normal')     

	$('.loading-messages').hide();
	$('.message-elem').hide();
	$('#message-compose').show();

	$('.to-holder').html('');
	$('#compose-subject').val('');
	$('#compose-content').val('');
	$('#compose-content').html('');
	$('#compose-contact').val('');
	$('#compose-contact').prev().html('');
	$('.warning-holder').html('');
	$('#compose-contact-list').html('');

	//this guys makes teh TEXTAREA of message content 
	//a responsive textarea (jquery plugin)...
	//$('#compose-content').autosize();   

	//populate the contact listing auto search
	for(i in window.contactList) {
		//append, append, append
		$('#compose-contact-list').append(CONTACT_LIST.
			replace('[ID]', i).
			replace('[NAME]', window.contactList[i].name));
		
	}

	$('.ui-filterable input').keyup(function() {
		setTimeout(function(){
			window.composePage.refresh();
		}, 1000)
	});

	//on typing in To field
	$('.contact-pick').click(function() {
		var id 		= $(this).attr('id');
		var name 	= $(this).html();
		var hasID 	= false;

		//empty out the warning error
		$('.warning-holder').html('');

		//prevent dual TO name in listing
		$('.to-holder div').each(function() {
			var ids = $(this).attr('id');

			if(ids == id) {
				hasID = true;
			}
		});

		//now unset 
		$('input#compose-contact-list').val('');
		$('ul#compose-contact-list li').each(function() {
			$(this).addClass('ui-screen-hidden');
		});

		$('form.ui-filterable').children().children().first().val('');
		$('form.ui-filterable').children().children().first().focus();

		//prevent adding the same contacts
		if(!hasID) {
			$('.to-holder').append(TO_COMPOSE.
	    		replace('[ID]', id).
	    		replace('[NAME]', name)
	    	);
		}

		//refresh page
		setTimeout(function(){window.composePage.refresh();
		console.log('xxx');}, 1000)
		

		return false;
	});
}

/**
 * Load if you need to populate 
 * compose UI (ex. draft and outbox 
 * detail page).
 *
 * @param object compose data
 * @param string message type
 */
function composeWith(data, type) {
	//flag page as compose
	$('.current-page').attr('id', 'compose');

	//navbar unset
	//hide delete message icon
	$('#delete-message').hide();
	//show send message icon
	$('#process-send').show();
	//hide compose message icon
	$('#compose-message').hide();
	$('.loading-messages').hide();
	$('.message-elem').hide();
	$('#message-compose').show();
	$('.to-holder').html('');
	$('#compose-contact').val('');
	$('#compose-contact').prev().html('');
	$('.warning-holder').html('');
	$('#compose-contact-list').html('');

	var contactList = window.contactList;

	//FOR OUTBOX
	if(type == 'Outbox') {
		var res = data['b:Recipients']['b:Recipient'];
		//MESSAGE CONTENT
		$('#compose-content').html(data['content']);
 		//MESSAGE SUBJECT
 		$('#compose-subject').val(data['b:Subject']);
 		
 		//MESSAGE PRIORITY
 		if(typeof data['b:Priority'] !== 'undefined'){
			if(typeof data['b:Priority']['m_Value'] !== 'undefined') {
				if(data['b:Priority']['m_Value']['_'] == 'High') {
					$('#compose-important option')
				     .removeAttr('selected')
				     .filter('[value=1]')
				         .attr('selected', true)
				    $('#compose-important-button span').html('High')     
				} else {
					$('#compose-important option')
				     .removeAttr('selected')
				     .filter('[value=0]')
				         .attr('selected', true)
				    $('#compose-important-button span').html('Normal')     
					
				}
			}
		}

	//FOR DRAFT	
	} else {
		var res = data['b:Label']['b:Recipients']['b:Recipient'];
		//MESSAGE CONTENT
		$('#compose-content').html(data['b:Content']);
 		//MESSAGE SUBJECT
 		$('#compose-subject').val(data['b:Label']['b:Subject']);
 		
 		//MESSAGE PRIORITY
		if(typeof data['b:Label']['b:Priority'] !== 'undefined'){
			if(typeof data['b:Label']['b:Priority']['m_Value'] !== 'undefined') {
				if(data['b:Label']['b:Priority']['m_Value']['_'] == 'High') {
					$('#compose-important option')
				     .removeAttr('selected')
				     .filter('[value=1]')
				         .attr('selected', true)
				    $('#compose-important-button span').html('High')     
				} else {
					$('#compose-important option')
				     .removeAttr('selected')
				     .filter('[value=0]')
				         .attr('selected', true)
				    $('#compose-important-button span').html('Normal')     
					
				}
			}
		}	
	}

	//MESSAGE TO LISTING
	//if multiple contact list
	if(typeof res[0] !== 'undefined') {
		//find name
		for(i in res) {
			for(x in contactList) {
				
				if(res[i]['b:m_Receiver']['c:PortalAccess']['c:LoginId'] == contactList[x].data['b:PortalAccess']['b:LoginId']) {
					$('.to-holder').append(TO_COMPOSE.
			    		replace('[ID]', x).
			    		replace('[NAME]', contactList[x].name)
			    	);
				}	
			}
		}

	} else {
		for(x in contactList) {
			
			if(res['b:m_Receiver']['c:PortalAccess']['c:LoginId'] == contactList[x].data['b:PortalAccess']['b:LoginId']) {
				$('.to-holder').append(TO_COMPOSE.
		    		replace('[ID]', x).
		    		replace('[NAME]', contactList[x].name)
		    	);
			}	
		}
	}

	//populate autocomplete with contact listing
	for(i in contactList) {
		
		$('#compose-contact-list').append(CONTACT_LIST.
			replace('[ID]', i).
			replace('[NAME]', contactList[i].name));
	}

	$('.ui-filterable input').keyup(function() {
		setTimeout(function(){
			window.composePage.refresh();
		}, 1000)
	});

	$('.contact-pick').click(function() {
		var id 		= $(this).attr('id');
		var name 	= $(this).html();
		var hasID 	= false;

		//unset warning
		$('.warning-holder').html('');
		
		$('.to-holder div').each(function() {
			var ids = $(this).attr('id');
			if(ids == id) {
				hasID = true;
			}
		});

		//unset now
		$('input#compose-contact-list').val('');
		$('ul#compose-contact-list li').each(function() {
			$(this).addClass('ui-screen-hidden');
		});

		//prevent double TO name in listing
		if(!hasID) {
			$('.to-holder').append(TO_COMPOSE.
	    		replace('[ID]', id).
	    		replace('[NAME]', name)
	    	);
		}

		//refresh page
		setTimeout(function(){window.composePage.refresh();
		console.log('xxx');}, 1000)


	});

	//now get the GUID
	var guid = data['b:Label']['b:MessageGUID'];
	//and put it sa hidden input 
	$('#detail-guid').val(guid);

	//on click send button
	processSend(guid);
}

/**
 * Pops out at th bottom of the application
 * when ever it calls and fade after 5secs.
 *
 * @param string html or text to the notification
 */
function notification(html) {

	$('.message-ajax #message-here').html(html);
	$('.message-ajax').show();
	$('.message-ajax').fadeOut(4000);
}

/**
 * If ever user logout, then the settings for
 * message will be set to default as the user login
 * again inside the system
 *
 * @return bool 
 */
function settings() {
	//get settings variables from local storage
	window.url 		= localStorage.getItem('url');
  	window.interval = parseInt(localStorage.getItem('interval'));
	//populate fields, URL
	$('#settings-url').val(window.url);

	//populate fields, INTERVAL
	$('#settings-interval option').
		removeAttr('selected').
		filter('[value='+window.interval+']').
		attr('selected', true);
	
	$('#settings-interval-button span').html(window.interval);

	//on click save settings button
	$('#save-settings').click(function() {
		//save new settigns to local storage
		localStorage.setItem('url', 		$('#settings-url').val());
		localStorage.setItem('interval', 	$('#settings-interval').val());
		//then update the GLOBAL VARIABLES
		window.url 		= localStorage.getItem('url');
  		window.interval = localStorage.getItem('interval');
  		SOAP_URL 		= window.url; 
  		
  		checkInbox();

		notification('Settings successfully saved');	
	});

	return false;
}

function mainPage(snapper, loginUser) {

	//hide the login and show the main page
	$('#login').hide();
	$('.main-page').show();

	/**
	 * Left Panel navigation toggle
	 * no loading happening just static
	 * html/css
	 *
	 */
	$('.deploy-sidebar').click(function(){
		//if panel already active	
		if(window.snapper.state().state=="left" ){
			//close it
			window.snapper.close();
		//else 	
		} else {
			//open it
			window.snapper.open('left');
			$('#sidebar').show();
		}

		return false;
	});

	//on click back button
	$('#back-top').click(function() {
		backEvent();
	});

	/**
	 * On click link in left panel
	 * load specific message folder list
	 *
	 */
	$('.left-navigation').click(function() {
		//close left panel
		window.snapper.close();
			
		$('.no-connection').hide();
		//hide send message icon
		$('#process-send').hide();
		//show compose message icon
		$('#compose-message').show();
		//remove active class
		$('.left-navigation').parent().removeClass('active');
		//then add active class to current element
		$(this).parent().addClass('active');
		//show loading it main content
		$('.loading-messages').show();
		//hide detail page
		$('#message-detail').hide();
		//hide compose page
		$('#message-compose').hide();
		//hide settings page
		$('#message-settings').hide();
		
		//get the message folder type
		var type = $(this).attr('id');
		
		//on logout
		if(type == 'logout') {
			$('.message-elem').hide();
			//clear local storage
			window.localStorage.clear();
			
		 	bind();
		 	location.reload();
			//bind();
			return false;
		/* ------------------------------------
			SPECIAL CASE : if setting page is 
			click, then show message settings
		   ------------------------------------ */
		} else if(type == 'Settings') {
			//flag currrent page as LIST
			$('.message-elem').hide();
			$('.current-page').attr('id', 'list');	
			$('#folder-name').html('Settings');
			$('.loading-messages').hide();
			$('#message-settings').show();
			//show message settings page 
			settings();

			return false
		
		/* ------------------------------------
			SPECIAL CASE : if OUTBOX page is 
			click, then dont make any SOAP CALL
			just check local storage for data
			(if user logout, then outbox listing 
			will be deleted)
		   ------------------------------------ */
		} else if(type == 'Outbox') {

			$('#folder-name').html($('a#Outbox').html());
			$('.loading-messages').hide();
			//get outbox from localstorage
			window.messages.
	  			getOutbox(loginUser);
	  		//pullDown();

	  	//else it is common page loading
		} else {
			//unset pagination whenevery changing to another
			//message listing
			window.startCount = 10;

			//get message list according on what
			//user clicked on the LI left panel
	  		window.messages.get(type, 15, 1);
  		}	

		return false;
	});

	/**
	 * On click Compose message on the navbar
	 *
	 */   	   
	$('#compose-message').click(function() { 
		$('#folder-name').html('Compose');
		//close snapper/left panel
		window.snapper.close();
		//prepare compose fields
		compose();
		//handle message sending
		processSend(0);
	}); 
}

/**
 * If no internet connection, all sending will 
 * be save to outbox
 *
 */
function ifNoInternet() {

	//if no internet access
	if(!window.connection) {
		
		//prepare variables
		var recipients 	= []
		var subject 	= $('#compose-subject').val();
		var content 	= $('#compose-content').val();
		var priority 	= $('#compose-important option:selected').html();

		//get list of recipients
		$('.to-holder div').each(function() {
			recipients.push(window.contactList[this.id]);
		});

		//if no recipients
		if(recipients.length == 0) {
			//add warning
			$('.warning-holder').html('<div class="alert alert-danger" id="11"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button><strong>Please add at least one recipient</strong></div>');
			
			return false;
		}
		//do some animation
		$('#loading-ajax #text').html('Saving Message');
		$('#loading-ajax').popup('open');

		//save to outbox
		saveOutbox(subject, content, priority, recipients);	

		return false;
	}
}

/**
 * Save messages to outbox, (lock and save)
 *
 */
function saveOutbox(subject, content, priority, recipients) { 
	var list = [];
	//i hate this part
	//manually create XML 		
	for(i in recipients) {
		var raw = {
			'b:m_Receiver' : {
				'c:Name' : {
					'd:m_IsDirty' 		: recipients[i].data['b:Name']['c:m_IsDirty'],
					'd:m_firstName' 	: recipients[i].data['b:Name']['c:m_firstName'],
					'd:m_lastName' 		: recipients[i].data['b:Name']['c:m_lastName'],
					'd:m_middleInitial' : recipients[i].data['b:Name']['c:m_middleInitial'],
					'd:m_suffix' 		: recipients[i].data['b:Name']['c:m_suffix'],
					'd:m_title' 		: recipients[i].data['b:Name']['c:m_title'],
				},
				'c:PortalAccess' : {
					'c:LoginId' : recipients[i].data['b:PortalAccess']['b:LoginId']
				}
			}
		}
		//push, push, push
		list.push(raw);
	}

	//get the login user detail
	var loginUser 	= window.user.get();
	
	//just create a random GUID for OUTBOX
    var randLetter 	= String.fromCharCode(65 + Math.floor(Math.random() * 26));
	var guid 		= randLetter + Date.now();

	//XML again
	var data = {
		'b:DateCreated' 		: {
			'c:m_IsDirty' 		: 'false',
			'c:m_StampForma' 	: 'MM/dd/yyyy HH:mm:ss.fff',
			//use current date
			'c:m_When' 			: $.format.date(new Date().getTime(), "yyyy-MM-ddThh:mm:ss")
		},
		'b:DateSent' 			: {
			'c:m_IsDirty' 		: 'false',
			'c:m_StampForma' 	: 'MM/dd/yyyy HH:mm:ss.fff',
			//use current date
			'c:m_When' 			: $.format.date(new Date().getTime(), "yyyy-MM-ddThh:mm:ss")

		},
		//the random GUID we generated
		'b:MessageGUID' 		: guid,
		'b:Label'				: {
			'b:MessageGUID' 	: guid,
			'b:Sender' 			: loginUser.sender,
			'b:Recipients'  	: {
				'b:Recipient' 	: list
			},
			'b:Priority' 		: {
				'm_Value' 		: {
					'_' 		: priority
				}
			},
			'b:Content' 		: content
		},
		'b:MessageRead'		 	: 'false',
		'b:Priority' 			: {
			'm_Value' 			: {
				'_' 			: priority
			}
		},
		'b:Recipients'  		: {
			'b:Recipient' 		: list
		},

		'b:Sender' 				: loginUser.sender,
		'b:Subject' 			: subject,
		'content' 				: content,
		'priority' 				: priority,
		'recipients' 			: recipients
	};

	window.messageList['Outbox'] = _string.unlock('Outbox');
	//if everthe outbox listing is empty
	if(window.messageList['Outbox'] === null || window.messageList['Outbox'].length == 0) {
		//make it an empty array
		window.messageList['Outbox'] = [];
	}

	//push 
	window.messageList['Outbox'].push(data);

	//lock and save
	_string.lock(window.messageList['Outbox'], 'Outbox');

	$('#loading-ajax').popup('close');
	$('#process-send').hide();

	//show nofication
	notification('Message saved on outbox');

	return false;	
}

/**
 * Check whenever there is an internet connection
 *
 */
function checkConnection() {
	
	$('.no-connection').hide();

	//if no internet
	if(!window.connection) {
		/* ---------------------------------
			IF NO INTENET CONNECTION	
		   ---------------------------------*/
		//stop all loading stuff in the main page 
		mainLoader('stop');
		var detail 	= $('#message-detail').css('display');
		var currentPage = $('.current-page').attr('id');
		
		//if no elemet in the field
		if(detail == 'none' && currentPage != 'compose') {
			$('.current-page').attr('id', 'list');
			//show no connection icon	
			$('.no-connection').show();
		}
		
		return false;
	}
}

/**
 * Back event happen whenever user click the back button 
 * on the app or the hitting the back button of the phone
 *
 */
function backEvent() {
	//get the login user
	var loginUser 	= window.user.get();
	//get the current page if (home, list)
	var currentPage = $('.current-page').attr('id');
	//get the parent page from the LI active to the left swipe
	var parentPage 	= $('ul.nav-stacked li.active a.left-navigation').attr('id');
	
	//stop the main loader
	mainLoader('stop');
	
	$('.no-connection').hide();

	//if in compose then hit back button
	if(currentPage == 'compose') {
		//prepare variables
		var recipients 	= [];
		var subject 	= $('#compose-subject').val();
		var content 	= $('#compose-content').val();
		var priority 	= $('#compose-important option:selected').html();
		var guid 		= $('#detail-guid').val();
		var empty 		= true;
		//if no GUID found
		if($.isEmptyObject(guid)) {
			guid = 0;
		}
		
		//get list of recipients
		$('.to-holder div').each(function() {
			recipients.push(window.contactList[this.id]);
		});

		
		if(subject.length > 0 || content.length > 0 || recipients.length > 0) {
			empty = false;
		}

		//if everything is empty, then dont show modal
		if(empty) {
			$('#draft-modal').modal('hide');
			$('#process-send').hide();	
			
			//unset pagination whenevery changing to another
			//message listing
			window.startCount = 10;

			//get message list according on what
			//user clicked on the LI left panel
	  		window.messages.get(parentPage, 15, 1);
			
			return false;
		}
		
		//show dialog
		$('#draft-modal').modal('show');

		//on click Save 
		$('#process-draft').unbind().click(function() {
			$('#draft-modal').modal('hide');

			if(!window.connection) {
				$('.no-connection').hide();
				/* ---------------------------------
					IF NO INTENET CONNECTION	
				   ---------------------------------*/
				$('.notification-ajax').show();
				$('.notification-ajax #notification-here').html('<i class="fa fa-warning"></i> No Internet connection');
				return false;
			}
			
			$('#loading-ajax #text').html('saving message')
			$('#loading-ajax').popup('open');
			
			//now do a ajax call to send it
			window.messages.draft(subject, content, priority, recipients, guid);
			
			$('#process-send').hide();
		});
	
		//on click Discard
		$('#cancel-draft').click(function() {
			
			$('#draft-modal').modal('hide');
			$('#process-send').hide();	

			//unset pagination whenevery changing to another
			//message listing
			window.startCount = 10;

			//get message list according on what
			//user clicked on the LI left panel
	  		window.messages.get(parentPage, 15, 1);
		});

		return false;

	//if page is in Inbox Listing	
 	} else if(parentPage == 'Inbox' && currentPage == 'home'){
 		console.log('time to go');
 		//time to exit app
 		navigator.app.exitApp();

 		return false;

 	} else if(currentPage == 'list') {
 		//put Inbox as Active LI to prevent error on 
 		//next back click
		$('ul.nav-stacked li.active').removeClass('active');
		$('ul.nav-stacked li #Inbox').parent().addClass('active');

		//checkConnection();
		//go back to Inbox
		window.messages.get('Inbox', 20, 1);

		return false;

 	//else it is not in Inbox listing	
 	} else {
 		//unset pagination whenevery changing to another
			//message listing
			window.startCount = 10;

			//get message list according on what
			//user clicked on the LI left panel
	  		window.messages.get(parentPage, 15, 1);
 	}  
}

function short(length) {
    var s = document.getElementsByClassName("list-title");
    var len = s.length;
    for(var i = 0; i < len; i++) {
       var g = s[i].innerHTML;
       var x = ". . .";
       var leng = length-5;
       var html = g.substring(0, leng)+"";
       var allHTML = html+x;
       s[i].innerHTML = allHTML;
    }
}

/* --------------------------------------------
			Protected Function
   -------------------------------------------- */
var _date = (function() {
	return {
		minus : function(days) {
			var d 	= new Date($.format.date(new Date().getTime(), "yyyy-MM-ddThh:mm:ss"));
			var end = d.setDate(d.getDate() - days);

			return $.format.date(end, "yyyy-MM-ddThh:mm:ss");			
		}
	}
}());

/**
 * Convert Date to current local timezone
 * 
 * @param date
 * 
 */
var _local = (function() {
	return {
		date : function(date) {
			//get local UTC offset by hour
			var localOffset = Math.abs((new Date().getTimezoneOffset()/60*2)+1);
			//server date from SOAP call
			var serverDate 	= new Date(date);
			//get server offset by msec
		  	var serverOffset = serverDate.getTimezoneOffset() * 60000;
		  	//convert server date as timstamp
		  	var serverTimeStamp = serverDate.getTime();
		  	//get UTC time in msec
		  	var utc = serverTimeStamp + serverOffset;
		  	var now = utc + (3600000*localOffset);

			return now;
		}
	}
}());

var _string = (function() {

	return {
		encrypt : function(text) {
			var keyBase64 = CryptoJS.enc.Base64.parse("ITU2NjNhI0tOc2FmZExOTQ==");
			var iv = CryptoJS.enc.Base64.parse('AAAAAAAAAAAAAAAAAAAAAA==');

			var encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(text), keyBase64,
				{
					keySize: 128 / 8,
					iv: iv,
					mode: CryptoJS.mode.CBC,
					padding: CryptoJS.pad.Pkcs7
				});

			//alert("Encrypted = " + encrypted);
			// Returns a Base64 encoded string.
			return encrypted.toString();
		},

		//convert array to string, encryp string then save to local storage
		lock : function(object, key) {
			//convert object to string format
			var string = JSON.stringify(object);
			
			if(key != 'Inbox' && key != 'Sent' && key != 'Draft' && key != 'Deleted' && key != 'Outbox') {
				
				//now encrypt it
				var encrypted = CryptoJS.AES.encrypt(string, SECRET);
				
				//save to local storage together with KEY
				localStorage.setItem(key, encrypted.toString());
				return encrypted.toString();
			} else {
				localStorage.setItem(key, string);
				return string;
			}
			
			
		},
		//get local storage, decryp string
		unlock : function(key) {
			
			var string = localStorage.getItem(key);
			
			//if string from local storage is null
			if(string === null || $.isEmptyObject(string)) { 
				//just return it, do nothing
				return string;
			}
			
			if(key != 'Inbox' && key != 'Sent' && key != 'Draft' && key != 'Deleted' && key != 'Outbox') { 
				var decrypted = CryptoJS.AES.decrypt(string, SECRET);
				var json = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
			} else { 
				var json = JSON.parse(string);
			}

			return json;
		}
	}
}());

/**
 * Do the jquery SOAP call
 *
 * @param string
 * @param string
 * @param function|callback 
 *
 */
var _SOAP = (function() {
	return {
		//all ajax call goes here
		post : function(method, xml, callback) {
			
			$.soap({
		        url 		: SOAP_URL,
		        method 		: method,
		        SOAPAction 	: 'urn:CaregiverPortalService/'+method,
		        data 		: xml.join(''),
				appendMethodToURL: false,
		        success: callback,
		        error: function (SOAPResponse) {
		            
		        }
		    });
		}
	}
}());

document.addEventListener('deviceready', function() {	
	
	//Enables the background mode. The app will not pause while in background.
	window.plugin.backgroundMode.enable();
	//unset badge
	window.plugin.notification.badge.set(0);
	
	navigator.geolocation.getCurrentPosition(
		//do nothing
		function() {

		}, 
		//do nothing
		function() {

		}
	);
	
    //check internet on load
	window.connection = window.navigator.onLine;
	
	//whenever app is open, check if there is internet connection
	if(!window.connection) {
		//if no connection
		//show no connection at the bottom
		$('.notification-ajax').show();
		$('.notification-ajax #notification-here').html('<i class="fa fa-warning"></i> No Internet connection');
	}

	/**
	 * This guy will only trigger if there is an internet connection
	 * Does not trigger on first load of app
	 *
	 */
	document.addEventListener("online", function(e) {
		window.connection = true;
		//hide notification
		$('.notification-ajax').hide();
		//check outbox
		checkOutbox();
		
	}, false);

	//for WEB TEST
	window.addEventListener("online", function(e) {
		window.connection = true;
		$('.notification-ajax').hide();
		checkOutbox();
	});

	/**
	 * This guy will only trigger if connection is lost
	 * Does not trigger on first load of app
	 *
	 */
	document.addEventListener("offline", function(e) {
		window.connection = false;

		//sho no connection notification
		$('.notification-ajax').show();
		$('.notification-ajax #notification-here').html('<i class="fa fa-warning"></i> No Internet connection');

	}, false);

	//for WEB TEST
	window.addEventListener("offline", function(e) {
		window.connection = false;
		
		$('.notification-ajax').show();
		$('.notification-ajax #notification-here').html('<i class="fa fa-warning"></i> No Internet connection');
		
	});

	//if all DOM is loaded
	$(document).ready(function(){
		//do the responsive font size
		$('body').flowtype({
			 minimum   : 300,
			 maximum   : 1200,
			 minFont   : 12,
			 maxFont   : 15,
			 fontRatio : 30
		});
		
		//document.body.style.height = screen.availHeight + 'px';

		//$("#message-compose").niceScroll();
		//$("#compose-content").niceScroll();
		//for login UI
		init();
		//start application
		bind();
	});

}, false);

/**
 * On hitting back button event, if page is in Inbox listing,
 * then we will exit the app or if it is in componse, then we will
 * save compose as draft, else if not then just go back to the 
 * previous listing page
 *
 * @return mixed
 */
document.addEventListener("backbutton", function(e){
	
	backEvent();

}, false);



/* ------------------------------------------------------------
		OLD FUNCTION, NOT USING ANYMORE FOR BACKUP PURPOSE
   ------------------------------------------------------------ */





/**

function pullRefresh() {
	
	//get the active listing
	var type = $('ul.nav-stacked li.active a.left-navigation').attr('id');
	var start = 10;
	var end  = 0;
	//on pull down the message listing
	$(document).on('pulled', '#message-list', function() {
	    //now make request to backend
	    window.messages.checkInbox(type, 1);
	});	
	
	window.messageList[type] = _string.unlock(type);

}

function pullDown() {

	var type = $('ul.nav-stacked li.active a.left-navigation').attr('id');
	var start = 10;
	var count = 11;
	
	//window.messageList[type] = _string.unlock(type);
	
	$(document).on('bottomreached', '#message-list', function() {

		start = start = 10;
		count++;
		//dont go beyond end of list
		if(window.messageList[type].length >= count) {
			
			window.messages.pullDown(window.messageList[type], type, start, 0);	
		}
		
		//On click message listing then load message detail
		//base on Message GUID
		onClickDetail(type);
		//$(".list-title").shorten();
		
	});
}
*/

/*function swipelisting(distance, duration, id, direction,phase) {
	//do some math
	var limit 	= parseInt($('#'+id).css('width')) / 2;	
	//inverse the number we set in the css
	var value = (distance<0 ? "" : "-") + Math.abs(distance).toString();
	
	//if drag value is bigger than limit and drag end
	if(Math.abs(value) > limit && phase == 'end') {
		//remove the div from the listing
		$('#'+id).hide(500);
	//if drag end but not more than the limit	
	} else if(phase == 'end') {
		//animate
		$('#'+id).css("-webkit-transition-duration", (duration/1000).toFixed(1) + "s");
		//slide to the beginning
		$('#'+id).css("-webkit-transform", "translate3d(0px,0px,0px)");
	} else {
		//animate
		$('#'+id).css("-webkit-transition-duration", (duration/1000).toFixed(1) + "s");
		//follow the touch event in div
		$('#'+id).css("-webkit-transform", "translate3d("+value +"px,0px,0px)");
	}
}*/

