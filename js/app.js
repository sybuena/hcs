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
		//$('#message-list').scrollz(); 

  		//get contact list
  		window.contactList = window.users = _string.unlock('contactList');

  		var snapper = new Snap({
		  element: document.getElementById('content')
		});

  		//count unread message in inbox
		window.messages.countFolder('Inbox');
		
		//get INBOX
  		window.messages.get('Inbox', 10, 0);

		$('#message-list').scrollz('hidePullHeader');
  		//show main page
  		mainPage(snapper,loginUser);

  		//check Inbox only if there is connection
		if(window.connection) { 
	  		//check inbox for new messages (every 5mins as default)
	  		checkInbox(loginUser);
	  		//on first load, check Outbox
	  		checkOutbox();
	  	}

	  	$('#message-list').scrollz('hidePullHeader');

		//pull to refresh 		
		pullRefresh();	
  	}
}

/**
 * This guys holds the key on pull to refresh
 * function in the message listinf
 *
 * @param string login token 
 */
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

		start++;
		count++;
		//dont go beyond end of list
		if(window.messageList[type].length >= count) {
			
			window.messages.pullDown(window.messageList[type], type, start, 0);	
		}
		
		//On click message listing then load message detail
		//base on Message GUID
		onClickDetail(type);

		
	});
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
		var subject 	= window.messageList['Outbox'][i]['b:Subject'];
		var content 	= window.messageList['Outbox'][i]['content'];
		var priority 	= window.messageList['Outbox'][i]['priority'];
		var recipients 	= window.messageList['Outbox'][i]['recipients'];
		var guidFake 	= window.messageList['Outbox'][i]['b:Label']['b:MessageGUID'];

		window.messages.send(subject, content, priority, recipients, 0);
	}

	//empty out Outbox in local storage
	localStorage.setItem('Outbox', '');

}

function onClickDetail(type) {
	$('.go-detail').unbind().click(function(e) {
		//prevent double click
		e.stopPropagation();
		e.preventDefault();
		
		//get the GUID of the message
		var id 		= $(this).attr('id');
		var unread 	= $(this).attr('unread');

		
		$('.scrollz-container').hide();
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
function checkInbox(loginUser) {

	
  	window.interval = localStorage.getItem('interval');
	
	window.setInterval(function(){ 
		
	  	/// call your function here
		if(window.start) {
			window.messages.checkInbox('Inbox', 0);
  		}	
  	
	}, window.interval*60000);
	//}, 5000);
}

/**
 * Main page loading animation
 *
 * @param string
 *
 */
function mainLoader(action) {
	if(action == 'start') {
		$('.loading-messages').show();
	} else {
		$('.loading-messages').hide();
	}
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

		//if no internet connection
		if(!window.connection) {
			$('#loading-ajax #text').html('Saving Message');
			$('#loading-ajax').popup('open');
					
			saveOutbox(subject, content, priority, recipients);	

		} else { 

			$('#loading-ajax #text').html('Sending Message');
			$('#loading-ajax').popup('open');
			
			//now doa ajax call to send it
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

	//hide the pn pull refresh listing
	$('.scrollz-container').hide();

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
	$('#compose-content').autosize();   	
	 
	//populate the contact listing auto search
	for(i in window.contactList) {
		//append, append, append
		$('#compose-contact-list').append(CONTACT_LIST.
			replace('[ID]', i).
			replace('[NAME]', window.contactList[i].name));
	}

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
	$('.message-ajax').fadeOut(8000);
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
  	window.interval = localStorage.getItem('interval');
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
		if(snapper.state().state=="left" ){
			//close it
			snapper.close();
		//else 	
		} else {
			//open it
			snapper.open('left');
			$('#sidebar').show();
		}

		return false;
	});

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
		snapper.close();

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
		//hide the pull to refresh element
		$('.scrollz-container').hide();
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
			//get message list according on what
			//user clicked on the LI left panel
	  		window.messages.get(type, 10, 1);
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
		snapper.close();
		//prepare compose fields
		compose();
		//handle message sending
		processSend(0);
	}); 
}

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

		$('#loading-ajax #text').html('Saving Message');
		$('#loading-ajax').popup('open');

		saveOutbox(subject, content, priority, recipients);	

		return false;
	}
}

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

		list.push(raw);
	}

	var loginUser 	= window.user.get();
	//just create a random GUID for OUTBOX
    var randLetter 	= String.fromCharCode(65 + Math.floor(Math.random() * 26));
	var guid 		= randLetter + Date.now();

	var data = {
		'b:DateCreated' 		: {
			'c:m_IsDirty' 		: 'false',
			'c:m_StampForma' 	: 'MM/dd/yyyy HH:mm:ss.fff',
			'c:m_When' 			: $.format.date(new Date().getTime(), "yyyy-MM-ddThh:mm:ss")
		},
		'b:DateSent' 			: {
			'c:m_IsDirty' 		: 'false',
			'c:m_StampForma' 	: 'MM/dd/yyyy HH:mm:ss.fff',
			'c:m_When' 			: $.format.date(new Date().getTime(), "yyyy-MM-ddThh:mm:ss")

		},
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
	
	if(window.messageList['Outbox'] === null || window.messageList['Outbox'].length == 0) {
		window.messageList['Outbox'] = [];
	}
	//push 
	window.messageList['Outbox'].push(data);

	//lock and save
	_string.lock(window.messageList['Outbox'], 'Outbox');

	$('#loading-ajax').popup('close');
	$('#process-send').hide();

	notification('Message saved on outbox');

	return false;	
}

function checkConnection() {
	
	$('.no-connection').hide();

	if(!window.connection) {
		/* ---------------------------------
			IF NO INTENET CONNECTION	
		   ---------------------------------*/
		mainLoader('stop');
		
		$('#message-list').scrollz('hidePullHeader');
		
		var list 	= $('.scrollz-container').css('display');
		var detail 	= $('#message-detail').css('display');
		var currentPage = $('.current-page').attr('id');
		
		//if no elemet in the field
		if(list == 'none' && detail == 'none' && currentPage != 'compose') {
			$('.current-page').attr('id', 'list');
			//show no connection icon	
			$('.no-connection').show();
		}
		
		
		return false;
	}
}

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
			
			//go back to the previous listing
			$('.scrollz-container').show();
			window.messages.get(parentPage, 10, 1);
			$('#message-list').scrollz('hidePullHeader');

			return false;
		}
		
		$('.scrollz-container').hide();
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
			
			//go back to the previous listing
			$('.scrollz-container').show();
			window.messages.get(parentPage, 10, 1);
			$('#message-list').scrollz('hidePullHeader');
	 		
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
		window.messages.get('Inbox', 10, 1);
		$('#message-list').scrollz('hidePullHeader');

		return false;

 	//else it is not in Inbox listing	
 	} else {
 		$('.scrollz-container').show();
 		
 		window.messages.get(parentPage, 10, 1);
 		$('#message-list').scrollz('hidePullHeader');
 		
 	}  
}

/* --------------------------------------------
			Protected Function
   -------------------------------------------- */

var _search = (function() {
	return {
		object : function(query, object) {
			var data = [];
			for(i in object) {
				//found as false at start always
				found = false; 
				for(x in object[i]) { 
					//if only string
					if(typeof object[i][x] !== 'object') {
						var string = object[i][x].toLowerCase();

						//finding needle in haystack
						if(string.match(query.toLowerCase())) {
							//mak object value as found
							found = true;
						}
					//else it is object	
					} else { 
						/*for(y in object[i][x]) {
							for(z in object[i][x][y]) {
								var string = object[i][x][y][z].toLowerCase();
								//finding needle in haystack
								if(string.match(query.toLowerCase())) {
									//mak object value as found
									found = true;
								}	
							}
						}*/
					}
				}
				//if we found it in object value
				if(found) {
					//push it
					data.push(object[i]);
				}
			}
			return data;
		}
	}
}());

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
	//set autocancel notification on click
   	//window.plugin.notification.local.setDefaults({ autoCancel: true });

   	//Enables the background mode. The app will not pause while in background.
	//window.plugin.backgroundMode.enable();

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
	
	$(document).ready(function(){
		
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




