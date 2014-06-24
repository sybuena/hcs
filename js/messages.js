/* ----------------------------------------
			CONSTANT VARIABLE
   ----------------------------------------- */
var MESSAGE_ROW = 
	'<div unread="false" class="messages go-detail" id="[MESSAGE_ID]" style="background-color: #f7f7f7;"><div class="pull-left" style="width:65%"><p class="list-title">[SUBJECT]</p>'+
	'<p>From: [FROM_NAME]</p><p> To: [TO_NAME]</p></div><div class="pull-right" style="width:35%; text-align:right"><p class="list-date">[DATE]</p>'+
    '<p class="important-star"><i class="fa [IMPORTANT] fa-2x" style="font-size: 20px"></i></p></div><div class="clearfix"></div></div>';

var MESSAGE_ROW_1 = 
	'<div unread="true" class="messages unread go-detail" id="[MESSAGE_ID]"><div class="pull-left" style="width:65%"><p class="list-title">[SUBJECT]</p>'+
    '<p>From: [FROM_NAME]</p><p>To: [TO_NAME]</p></div><div class="pull-right" style="width:35%; text-align:right;"><p class="list-date">[DATE]</p>'+
    '<p class="important-star"><i class="fa [IMPORTANT] fa-2x"></i></p></div><div class="clearfix"></div></div>';

var TO_COMPOSE = 
	'<div style="float: left;margin-right: 7px;" class="alert alert-info" id="[ID]"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">'+
	'&times;</button><strong>[NAME]</strong></div>';

var COMPOSE_CONTACT = 
	'<option value=[ID]>[NAME]</option>';

var EMPTY = 
	' <div class="empty-messages"><div class="icon-holder"><i class="fa fa-info-circle fa-5x"></i>'+
	'<p class="event loading">No messages</p></div></div>';

var Messages = function(type) {
    this.token = [];
}

Messages.prototype = {
	/**
	 * Get the Message list according to the message
	 * folder/type pass
	 *
	 * @param string message folder
	 * @return object|mixed
	 */
	get : function(type, start, end, force) {
		
		window.messages.animateList('start', type);

		$('#pullDown').hide();
		
		//mark inbox as home page
		if(type == 'Inbox') {
			$('.current-page').attr('id', 'home');
		//else makr as page	
		} else {
			$('.current-page').attr('id', 'list');	
		}

		$('#message-list').css('pointer-events', 'all');
		$('#back-top').hide();
		$('#sidebar-top').show();
		$('#delete-message').hide();

		$('#folder-name').html($('a#'+type).html());
		//console.log(window.messageList[type]);
		//get json data
		//if(typeof window.messageList[type] === 'undefined') {
			window.messageList[type] = _string.unlock(type);
		//}
		
		//if empty or null
		if(window.messageList[type] == null || window.messageList[type] == '' || force == 1) { 
			//make call to backend to populate messageList
			window.messageList[type] = [];
	    	
	    	this.load(type, start, end);
		//else there is temporary saved data
		} else { 

			//just show the listing
			this.displayMessage(window.messageList[type], type, start, end, 1);
		}

		//this will only work if no ajax call happen
		return window.messageList[type];
	},
	getOutbox : function(loginUser) {		
		$('.current-page').attr('id', 'list');	

		window.messageList['Outbox'] = _string.unlock('Outbox'); 

		//just show the listing
		window.messages.displayMessage(window.messageList['Outbox'], 'Outbox', 7, 0, 1);
	},
	getDetail : function(guid, type, unread) {
		//if message detail page is not it deleted
		if(type != 'Deleted') {
			//show delete button in detail page
			$('#delete-message').show();
		//else if in delete page	
		} else {
			//show undelete button in detail page
			$('#undelete-message').show();
		}

		$('#back-top').show();
		
		$('#sidebar-top').hide();

		//hide send button
		$('#process-send').hide();
		//show compose messahe
		$('#compose-message').show();

		/* ----------------------------------------------
				SPECIAL CASE FOR OUTBOX DETAIL PAGE
		   ---------------------------------------------- */

		//if message detail page is Outbox
		if(type == 'Outbox') {
			//get message listing of Outbox	
			for(i in window.messageList[type]) {
				var detail = null;

				//find the detail page of GUID in lsting 
				if(window.messageList[type][i]['b:MessageGUID'] == guid) {
					//make it as the detail page
					detail = window.messageList[type][i];
					//then stop	
					break;
				}
			}
			//show detail page of Outbox
			window.messages.displayDetail(detail, type, guid, unread);
			
			return false;
		}

		/* ----------------------------------------------
				IF DETAIL MESSAGE PAGE IS NOT OUTBOX
		   ---------------------------------------------- */
		//get and unlock
		window.messageDetail[guid] = _string.unlock(guid);

		//if message detail is not found it local storage	
		if(window.messageDetail[guid] == null) {
			//then request it on backend
         	window.messages.loadDetail(guid, type, unread);
		//else if found	
		} else {
			//just display it
			window.messages.displayDetail(window.messageDetail[guid], type, guid, unread);
		}

		return false;
	},
	loadDetail : function(guid, type, unread) {
		//get Token
		window.user.getToken(window.username, window.password, function(soapResponse){
			
			var results 	= soapResponse.toString();	
	        var json 		= $.xml2json(results);
		 	var response 	= json['s:Envelope']['s:Body']['LoginCaregiverPortalResponse']['LoginCaregiverPortalResult'];
		 	var token 		= response['a:Token'];
		 	var xml 		=
		        ['<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://schemas.microsoft.com/2003/10/Serialization/" xmlns:heal="http://schemas.datacontract.org/2004/07/HealthCareAssistant" xmlns:hsim="http://schemas.datacontract.org/2004/07/HSIMessageExchange">',
		            '<soapenv:Header/>',
		            '<soapenv:Body>',
		                '<RetrieveMessage>',
		                    '<caregiverId>'+token+'</caregiverId>',
		                    '<messageGuid>'+guid+'</messageGuid>',
		                '</RetrieveMessage>',
		            '</soapenv:Body>',
		        '</soapenv:Envelope>'];

			//do ajax SOAP call		        
		    _SOAP.post('RetrieveMessage', xml, function(soapResponse) {
		    	//convert the XML response to string
	            var results = soapResponse.toString(); 
	            //the convert the string to json data
	            var json 	= $.xml2json(results);
	            
	            if(json['s:Envelope']['s:Body']['RetrieveMessageResponse']['RetrieveMessageResult']['a:HasError'] == 'true') {
	            	$('.notification-ajax').show();
					$('.notification-ajax #notification-here').html('<i class="fa fa-warning"></i>'+json['s:Envelope']['s:Body']['RetrieveMessageResponse']['RetrieveMessageResult']['a:Error']);
					mainLoader('stop');
					$('.current-page').attr('id', 'page');
		
	            	return false;
	            }

	            //dig to the main result of the response
	            var data = json['s:Envelope']['s:Body']['RetrieveMessageResponse']['RetrieveMessageResult']['a:MessageResult'];
	            
	            //lock and save
	            _string.lock(data, guid);

	            //get the saved local storage and show it
	            window.messages.displayDetail(data, type, guid, unread);
		    });  
		}); 	
	},
	countFolder : function(type) {
		
		//get Token
		window.user.getToken(window.username, window.password, function(soapResponse){
			
			var results 	= soapResponse.toString();	
	        var json 		= $.xml2json(results);
		 	var response 	= json['s:Envelope']['s:Body']['LoginCaregiverPortalResponse']['LoginCaregiverPortalResult'];
		 	var token 		= response['a:Token'];
			var start 		= '1950-04-01T09:00:00';
			var end 		= $.format.date(new Date().getTime(), "yyyy-MM-ddThh:mm:ss");
			var xml 		=
		        ['<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://schemas.microsoft.com/2003/10/Serialization/" xmlns:heal="http://schemas.datacontract.org/2004/07/HealthCareAssistant" xmlns:hsim="http://schemas.datacontract.org/2004/07/HSIMessageExchange">',
		            '<soapenv:Header/>',
		            '<soapenv:Body>',
		                '<RetrieveMessages>',
		                    '<caregiverId>'+token+'</caregiverId>',
		                    '<messageFolder>',
		                        '<heal:m_IsDirty>false</heal:m_IsDirty>',
		                        '<heal:m_DefaultValue></heal:m_DefaultValue>',
		                        '<heal:m_FilterSet>false</heal:m_FilterSet>',
		                        '<heal:m_Key>'+type+'</heal:m_Key>',
		                        '<heal:m_SerializeList></heal:m_SerializeList>',
		                    '</messageFolder>',
		                    '<dateRange>',
		                        '<heal:m_IsDirty>false</heal:m_IsDirty>',
		                        '<heal:m_EndDate>',
		                            '<heal:m_IsDirty>false</heal:m_IsDirty>',
		                            '<heal:DateName></heal:DateName>',
		                            '<heal:DateStringFormat>YYYY-MM-DDThh:mm:ss</heal:DateStringFormat>',
		                            '<heal:InnerDate>'+end+'</heal:InnerDate>',
		                        '</heal:m_EndDate>',
		                        '<heal:m_StartDate>',
		                            '<heal:m_IsDirty>false</heal:m_IsDirty>',
		                            '<heal:DateName></heal:DateName>',
		                            '<heal:DateStringFormat>YYYY-MM-DDThh:mm:ss</heal:DateStringFormat>',
		                            '<heal:InnerDate>'+start+'</heal:InnerDate>',
		                        '</heal:m_StartDate>',
		                    '</dateRange>',
		                    '<unreadOnly>true</unreadOnly>',
		                '</RetrieveMessages>',
		            '</soapenv:Body>',
		        '</soapenv:Envelope>'];

		    //do ajax SOAP call    
			_SOAP.post('RetrieveMessages', xml, function(soapResponse) { 

				var json 	= $.xml2json(soapResponse.toString()); 
				
	            var data 	= json['s:Envelope']['s:Body'];
	           	var result 	= data['RetrieveMessagesResponse']['RetrieveMessagesResult']['a:MessagesResult'];
         		var count 	= 0;	
         		
         		//if no unread messages
         		if(result['b:MessageLabel'] == null) {

         			$('#'+type+' span.badge').html(count);
         			$('#folder-name').html($('a#'+type).html());
         			
         			return false;
         		} 

         		//if in single
         		if(typeof result['b:MessageLabel'][0] === 'undefined') {
         			count++;
         		//else there s mutiple unread message	
         		} else {
         			for(i in result['b:MessageLabel']) {
         				count++;
         			}
         		}
         		
         		$('#'+type+' span.badge').html(count);
         		$('#folder-name').html($('a#'+type).html());
         		setBadge(count)
         		
			});		        
		});
	},
	loadAll : function() {
	
		//refresh token 
		window.user.getToken(window.username, window.password, function(soapResponse){
			var listing = new Array();
			listing.push('Sent');
			listing.push('Draft');
			listing.push('Deleted');
			listing.push('Outbox');

			
			console.log(listing.length);
			for(i = 0; i < listing.length; i++) {		
				var type = listing[i];
				
				var results 	= soapResponse.toString();	
		        var json 		= $.xml2json(results);
			 	var response 	= json['s:Envelope']['s:Body']['LoginCaregiverPortalResponse']['LoginCaregiverPortalResult'];
			 	var token 		= response['a:Token'];
				var startDate 	= '1950-04-01T09:00:00';
				var endDate 	= $.format.date(new Date().getTime(), "yyyy-MM-ddThh:mm:ss");
				var xml 		=
			        ['<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://schemas.microsoft.com/2003/10/Serialization/" xmlns:heal="http://schemas.datacontract.org/2004/07/HealthCareAssistant" xmlns:hsim="http://schemas.datacontract.org/2004/07/HSIMessageExchange">',
			            '<soapenv:Header/>',
			            '<soapenv:Body>',
			                '<RetrieveMessages>',
			                    '<caregiverId>'+token+'</caregiverId>',
			                    '<messageFolder>',
			                        '<heal:m_IsDirty>false</heal:m_IsDirty>',
			                        '<heal:m_DefaultValue></heal:m_DefaultValue>',
			                        '<heal:m_FilterSet>false</heal:m_FilterSet>',
			                        '<heal:m_Key>'+type+'</heal:m_Key>',
			                        '<heal:m_SerializeList></heal:m_SerializeList>',
			                    '</messageFolder>',
			                    '<dateRange>',
			                        '<heal:m_IsDirty>false</heal:m_IsDirty>',
			                        '<heal:m_EndDate>',
			                            '<heal:m_IsDirty>false</heal:m_IsDirty>',
			                            '<heal:DateName></heal:DateName>',
			                            '<heal:DateStringFormat>YYYY-MM-DDThh:mm:ss</heal:DateStringFormat>',
			                            '<heal:InnerDate>'+endDate+'</heal:InnerDate>',
			                        '</heal:m_EndDate>',
			                        '<heal:m_StartDate>',
			                            '<heal:m_IsDirty>false</heal:m_IsDirty>',
			                            '<heal:DateName></heal:DateName>',
			                            '<heal:DateStringFormat>YYYY-MM-DDThh:mm:ss</heal:DateStringFormat>',
			                            '<heal:InnerDate>'+startDate+'</heal:InnerDate>',
			                        '</heal:m_StartDate>',
			                    '</dateRange>',
			                    '<unreadOnly>false</unreadOnly>',
			                '</RetrieveMessages>',
			            '</soapenv:Body>',
			        '</soapenv:Envelope>'];
			    
			    //do ajax SOAP call    
				_SOAP.post('RetrieveMessages', xml, function(soapResponse) { 
					results = soapResponse.toString(); 
		            json 	= $.xml2json(results);

		            //if has error
		            if(json['s:Envelope']['s:Body']['RetrieveMessagesResponse']['RetrieveMessagesResult']['a:HasError'] == 'true') {
		            	$('.notification-ajax').show();
						$('.notification-ajax #notification-here').html('<i class="fa fa-warning"></i>'+json['s:Envelope']['s:Body']['RetrieveMessagesResponse']['RetrieveMessagesResult']['a:Error']);
						
		            }

		            var data 	= json['s:Envelope']['s:Body']['RetrieveMessagesResponse']['RetrieveMessagesResult']['a:MessagesResult']['b:MessageLabel'];
	         		var raw = [];
	         		
	         		if(typeof data === 'object' && typeof data[0] === 'undefined') { 
	         			raw.push(data)
	         		} else {
	         			raw = data;
	         		}	
	         		
	         		if(typeof raw !== 'undefined') {
	         			//lock and save
	         			_string.lock(raw, type);
	         			window.messageList[type] = raw;
	         		}	

				});
			}    
		});
	},
	load : function(type, start, end) {
		
		//refresh token 
		window.user.getToken(window.username, window.password, function(soapResponse){
			var minus		= 7;
			var today 		= new Date();
   			var rawLastWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - minus);
   			var lastWeek 	= $.format.date(rawLastWeek, "yyyy-MM-ddThh:mm:ss");
   			
			var results 	= soapResponse.toString();	
	        var json 		= $.xml2json(results);
		 	var response 	= json['s:Envelope']['s:Body']['LoginCaregiverPortalResponse']['LoginCaregiverPortalResult'];
		 	var token 		= response['a:Token'];
			//var startDate 	= lastWeek;
			var startDate 	= '1950-04-01T09:00:00';
			var endDate 	= $.format.date(new Date().getTime(), "yyyy-MM-ddThh:mm:ss");
			var xml 		=
		        ['<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://schemas.microsoft.com/2003/10/Serialization/" xmlns:heal="http://schemas.datacontract.org/2004/07/HealthCareAssistant" xmlns:hsim="http://schemas.datacontract.org/2004/07/HSIMessageExchange">',
		            '<soapenv:Header/>',
		            '<soapenv:Body>',
		                '<RetrieveMessages>',
		                    '<caregiverId>'+token+'</caregiverId>',
		                    '<messageFolder>',
		                        '<heal:m_IsDirty>false</heal:m_IsDirty>',
		                        '<heal:m_DefaultValue></heal:m_DefaultValue>',
		                        '<heal:m_FilterSet>false</heal:m_FilterSet>',
		                        '<heal:m_Key>'+type+'</heal:m_Key>',
		                        '<heal:m_SerializeList></heal:m_SerializeList>',
		                    '</messageFolder>',
		                    '<dateRange>',
		                        '<heal:m_IsDirty>false</heal:m_IsDirty>',
		                        '<heal:m_EndDate>',
		                            '<heal:m_IsDirty>false</heal:m_IsDirty>',
		                            '<heal:DateName></heal:DateName>',
		                            '<heal:DateStringFormat>YYYY-MM-DDThh:mm:ss</heal:DateStringFormat>',
		                            '<heal:InnerDate>'+endDate+'</heal:InnerDate>',
		                        '</heal:m_EndDate>',
		                        '<heal:m_StartDate>',
		                            '<heal:m_IsDirty>false</heal:m_IsDirty>',
		                            '<heal:DateName></heal:DateName>',
		                            '<heal:DateStringFormat>YYYY-MM-DDThh:mm:ss</heal:DateStringFormat>',
		                            '<heal:InnerDate>'+startDate+'</heal:InnerDate>',
		                        '</heal:m_StartDate>',
		                    '</dateRange>',
		                    '<unreadOnly>false</unreadOnly>',
		                '</RetrieveMessages>',
		            '</soapenv:Body>',
		        '</soapenv:Envelope>'];

		    //do ajax SOAP call    
			_SOAP.post('RetrieveMessages', xml, function(soapResponse) { 
				results = soapResponse.toString(); 
	            json 	= $.xml2json(results);

	            //if has error
	            if(json['s:Envelope']['s:Body']['RetrieveMessagesResponse']['RetrieveMessagesResult']['a:HasError'] == 'true') {
	            	$('.notification-ajax').show();
					$('.notification-ajax #notification-here').html('<i class="fa fa-warning"></i>'+json['s:Envelope']['s:Body']['RetrieveMessagesResponse']['RetrieveMessagesResult']['a:Error']);	
	            }

	            var data 	= json['s:Envelope']['s:Body']['RetrieveMessagesResponse']['RetrieveMessagesResult']['a:MessagesResult']['b:MessageLabel'];
         		var raw = [];
         		
         		if(typeof data === 'object' && typeof data[0] === 'undefined') { 
         			raw.push(data)
         		} else {
         			raw = data;
         		}	
         		
         		if(typeof raw !== 'undefined') {
         			//lock and save
         			_string.lock(raw, type);
         			window.messageList[type] = raw;
         		}	
         		
         		/*if(window.messageList[type].length < 10) {
         				minus = minus + 7;
         				console.log(minus);
						window.messages.loadAgain(minus, type);
         				return false;
         		}*/

	            //now display it
	            window.messages.displayMessage(raw, type, start, end, 1);
			});    
		});
	},
	loadAgain : function(minus, type) {

		window.user.getToken(window.username, window.password, function(soapResponse){
			
			var today 		= new Date();
   			var rawLastWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - minus);
   			var lastWeek 	= $.format.date(rawLastWeek, "yyyy-MM-ddThh:mm:ss");
   			
			var results 	= soapResponse.toString();	
	        var json 		= $.xml2json(results);
		 	var response 	= json['s:Envelope']['s:Body']['LoginCaregiverPortalResponse']['LoginCaregiverPortalResult'];
		 	var token 		= response['a:Token'];
			var startDate 	= lastWeek;
			//var startDate 	= '1950-04-01T09:00:00';
			var endDate 	= $.format.date(new Date().getTime(), "yyyy-MM-ddThh:mm:ss");
			var xml 		=
		        ['<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://schemas.microsoft.com/2003/10/Serialization/" xmlns:heal="http://schemas.datacontract.org/2004/07/HealthCareAssistant" xmlns:hsim="http://schemas.datacontract.org/2004/07/HSIMessageExchange">',
		            '<soapenv:Header/>',
		            '<soapenv:Body>',
		                '<RetrieveMessages>',
		                    '<caregiverId>'+token+'</caregiverId>',
		                    '<messageFolder>',
		                        '<heal:m_IsDirty>false</heal:m_IsDirty>',
		                        '<heal:m_DefaultValue></heal:m_DefaultValue>',
		                        '<heal:m_FilterSet>false</heal:m_FilterSet>',
		                        '<heal:m_Key>'+type+'</heal:m_Key>',
		                        '<heal:m_SerializeList></heal:m_SerializeList>',
		                    '</messageFolder>',
		                    '<dateRange>',
		                        '<heal:m_IsDirty>false</heal:m_IsDirty>',
		                        '<heal:m_EndDate>',
		                            '<heal:m_IsDirty>false</heal:m_IsDirty>',
		                            '<heal:DateName></heal:DateName>',
		                            '<heal:DateStringFormat>YYYY-MM-DDThh:mm:ss</heal:DateStringFormat>',
		                            '<heal:InnerDate>'+endDate+'</heal:InnerDate>',
		                        '</heal:m_EndDate>',
		                        '<heal:m_StartDate>',
		                            '<heal:m_IsDirty>false</heal:m_IsDirty>',
		                            '<heal:DateName></heal:DateName>',
		                            '<heal:DateStringFormat>YYYY-MM-DDThh:mm:ss</heal:DateStringFormat>',
		                            '<heal:InnerDate>'+startDate+'</heal:InnerDate>',
		                        '</heal:m_StartDate>',
		                    '</dateRange>',
		                    '<unreadOnly>false</unreadOnly>',
		                '</RetrieveMessages>',
		            '</soapenv:Body>',
		        '</soapenv:Envelope>'];

		    //do ajax SOAP call    
			_SOAP.post('RetrieveMessages', xml, function(soapResponse) { 
				results = soapResponse.toString(); 
	            json 	= $.xml2json(results);

	            //if has error
	            if(json['s:Envelope']['s:Body']['RetrieveMessagesResponse']['RetrieveMessagesResult']['a:HasError'] == 'true') {
	            	$('.notification-ajax').show();
					$('.notification-ajax #notification-here').html('<i class="fa fa-warning"></i>'+json['s:Envelope']['s:Body']['RetrieveMessagesResponse']['RetrieveMessagesResult']['a:Error']);
					
	            }

	            var data 	= json['s:Envelope']['s:Body']['RetrieveMessagesResponse']['RetrieveMessagesResult']['a:MessagesResult']['b:MessageLabel'];
         		var raw = [];
         		
         		if(typeof data === 'object' && typeof data[0] === 'undefined') { 
         			raw.push(data)
         		} else {
         			raw = data;
         		}	
         		console.log(data);
         		
         		if(typeof raw !== 'undefined') {
         			var currentList = _string.unlock(type);
         			currentList.push(raw);
         			//lock and save
         			_string.lock(currentList, type);
         			window.messageList[type] = currentList;
         			console.log(window.messageList[type]);
         		} else {
     				minus = minus + 7;
					window.messages.loadAgain(minus);
     				return false;
         		}
         		
         			

	            //now display it
	            window.messages.displayMessage(raw, type, start, end, 1);
			});    
		});

	},
	displayDetail : function(data, type, guid, unread) { 

		$('.no-connection').hide();

		$('.current-page').attr('id', 'page');

		//sometimes the SOAP call getting detail message
		//throw empty data
		if(typeof data['_'] !== 'undefined') {
			//if that happen, then request detail message again
			this.loadDetail(guid, type);
			return false;
		}

		//stop loading animation
		mainLoader('stop');

		/* -----------------------------------------------
				LOAD COMPOSE PAGE IF DRAFT OR OUTBOX
		   ----------------------------------------------- */
		if(type == 'Draft' || type == 'Outbox') { 
			//load compose page	
			composeWith(data, type);

			return false;	
		} 

		//for important message
		var star 		= 'fa-exclamations';
		var fromName 	= 'From : '+data['b:Label']['b:Sender']['c:Name']['d:m_firstName']+' '+data['b:Label']['b:Sender']['c:Name']['d:m_lastName'];
     	var toUser 		= '';
     	//now convert the date email sent to current date to get the
		//date AGO when recieve the email
		var localDate 	= _local.date(data['b:Label']['b:DateSent']['c:m_When']);
		var date 		= moment(localDate).format('MMM D, h:mm');
		date = moment(localDate).fromNow();
		//date = jQuery.format.prettyDate(date);

		//create PRIOROITY
		if(typeof data['b:Label']['b:Priority'] !== 'undefined'){
			if(typeof data['b:Label']['b:Priority']['m_Value'] !== 'undefined') {
				if(data['b:Label']['b:Priority']['m_Value']['_'] == 'High') {
					var star = 'fa-exclamation';
				}
			}
		}

		//create RECIPIENTS
     	if(typeof data['b:Label']['b:Recipients'] == 'object') {
			//append the TO list ig the TO list is more than 1
			if(typeof data['b:Label']['b:Recipients']['b:Recipient'][0] !== 'undefined') {
				for(x in data['b:Label']['b:Recipients']['b:Recipient']) {
					toName = data['b:Label']['b:Recipients']['b:Recipient'][x]['b:m_Receiver']['c:Name']['d:m_firstName']+' '+data['b:Label']['b:Recipients']['b:Recipient'][x]['b:m_Receiver']['c:Name']['d:m_lastName'];	
					toUser += ' To:<span class="gray m-l-25">'+toName+'</span><br />';
				
				}
			//else it is only one	
			} else {	
				toName = data['b:Label']['b:Recipients']['b:Recipient']['b:m_Receiver']['c:Name']['d:m_firstName']+' '+data['b:Label']['b:Recipients']['b:Recipient']['b:m_Receiver']['c:Name']['d:m_lastName'];	
				toUser += ' To:<span class="gray m-l-25">'+toName+'</span><br />';

			}
		}
		var emptySubject = false;
		//for empty subject
 		if(data['b:Label']['b:Subject'].length == 0) {
 			emptySubject = true;
 			data['b:Label']['b:Subject'] = 'Empty Subject';
 		}

 		//MESSAGE CONTENT
 		$('#detail-content').html(data['b:Content'].replace(/\n/g, "<br />"));
 		//MESSAGE SUBJECT
 		$('#detail-subject').html(data['b:Label']['b:Subject']);
 		//MESSAGE FROM
 		$('#detail-from').html(fromName);
 		//MESSAGE TO LIST
 		$('#detail-to').html(toUser);
 		//MESSAGE DATE
 		$('#detail-date').html(date);
 		//MESSAGE PRIORITY
 		$('#detail-important').html('<i class="fa '+star+' fa-2x" id="detail-important"></i>');
 		
 		//we can now show the div for detail page
 		$('#message-detail').show();

 		window.messageDetail.refresh();
 		
 		//if message is not yet read
 		if(unread == 'true') {
 			//get localstorage data
	 		raw 	= _string.unlock(type);
	 		newData = [];
	 		//now remove the message to the local storage
	 		for(i in  raw) {
	 			if(raw[i]['b:MessageGUID'] == guid){
	 				raw[i]['b:MessageRead'] = true;
	 				console.log(raw[i]);
	 			}

	 			newData.push(raw[i]);
	 		}
	 		
	 		//put back together to the local storage
	 		_string.lock(newData, type);
	 		console.log(type);

	 		window.messageList[type] = _string.unlock(type);
		}

 		//reply all button
 		$('#detail-reply-all').unbind().click(function(e) {
 			if(emptySubject == true) {
 				data['b:Label']['b:Subject'] = '';
 			}

 			$(this).attr('isClick', 'true');

 			e.stopPropagation();
			e.preventDefault();
 			compose();
 			window.messages.replyAll(data, 'replyAll');

 			return false;
 		});

 		//reply button
 		$('#detail-reply').unbind().click(function(e) {
 			if(emptySubject == true) {
 				
 				data['b:Label']['b:Subject'] = '';
 			}
 			
 			$(this).attr('isClick', 'true');

 			e.stopPropagation();
			e.preventDefault();
 			compose();
 			window.messages.replyAll(data, 'reply');
 			return false;
 		});

 		//forward button
 		$('#detail-forward').unbind().click(function(e) {
 			if(emptySubject == true) {
 				data['b:Label']['b:Subject'] = '';
 			}

 			$(this).attr('isClick', 'true');

 			e.stopPropagation();
			e.preventDefault();
 			compose();
 			window.messages.forward(data);
 			return false;
 		});
 		
 		//delete message
 		$('#delete-message').unbind().click(function(e) {
 			e.stopPropagation();
			e.preventDefault();
			
 			window.messages.delete(guid, type);
 			return false;
 		});

 		//undelete message
		$('#undelete-message').unbind().click(function(e) {
 			e.stopPropagation();
			e.preventDefault();
			
 			window.messages.undelete(guid, type);
 			return false;
 		});
	},
	displayMessage : function (messageList, type, start, end, keepHide) {

		window.start = true;
		//HTML template for read messages
		var row = MESSAGE_ROW;
		var list = '';
		

		//empty everything
		$('#message-list').html('');
		$('#message-archive').html('');
		if(messageList == null || messageList.length == 0) {
			//stop animation
			this.animateList('stop', type);
			$("#message-list").html(EMPTY);
			
		} else {

			var lister = 0;
			var ids = [];
			var currentGUID = '';

			//for(i in messageList) { 
			for(i = 0; i < start; i++) {	
				
				//if(i ==  end && start > i) {
				//if(end < start) {
				//continue here if object value is not null
				//otherwise this will cause wrong message list 
				//count to unread messages
				if(messageList[i] !== null && typeof messageList[i] !== 'undefined') {
					//use unread HTML template if only in INBOX
					if(type == 'Inbox') {
						//check if message is unread
						if(messageList[i]['b:MessageRead'] == 'false') {
							//HTML template for unread messages
							row = MESSAGE_ROW_1;
						} else {
							row = MESSAGE_ROW;
						}
					}

					//for important message
					var star 		= 'fa-exclamations';
					var toUser 		= '';
					var fromName 	= '';
					var subject 	= '';
					var fromName 	= '';
					var localDate 	= '';

					if(typeof messageList[i]['b:DateSent'] !== 'undefined'){
				  		localDate 	= _local.date(messageList[i]['b:DateSent']['c:m_When']);
				  	}

					//dont show datetime if in Draft and Outbox listing
					if(type == 'Draft' || type == 'Outbox') {
						date = '';
					} else {
				  		//calculate date past
				  		//date = moment(localDate).format('MMM D, h:mm');
				  		date = moment(localDate).fromNow();
				  		//date = jQuery.format.prettyDate(localDate);
				  	}

				  	if(typeof messageList[i]['b:Sender'] !== 'undefined'){
				  		fromName = messageList[i]['b:Sender']['c:Name']['d:m_firstName']+' '+messageList[i]['b:Sender']['c:Name']['d:m_lastName']
				  	}	

				  	if(typeof messageList[i]['b:Subject'] !== 'undefined'){
				  		subject = messageList[i]['b:Subject'];
				  	}	

					//prevent error on Priority
					if(typeof messageList[i]['b:Priority'] !== 'undefined'){
						if(typeof messageList[i]['b:Priority']['m_Value'] !== 'undefined') {
							if(messageList[i]['b:Priority']['m_Value']['_'] == 'High') {
								var star = 'fa-exclamation';
							}
						}
					}
					
					if(typeof messageList[i]['b:Recipients'] == 'object') {
						//if has mutiple recipient
						if(typeof messageList[i]['b:Recipients']['b:Recipient'][0] !== 'undefined') {
							//loop to get all recipient
							for(x in messageList[i]['b:Recipients']['b:Recipient']) {
								//and make HTML format
								toName = messageList[i]['b:Recipients']['b:Recipient'][x]['b:m_Receiver']['c:Name']['d:m_firstName']+' '+messageList[i]['b:Recipients']['b:Recipient'][x]['b:m_Receiver']['c:Name']['d:m_lastName'];	
								toUser += ' <span class="gray m-l-25">'+toName+'</span><br />';
							}
						//otherwise if only one recipient	
						} else {
							//just do HTML format
							toName = messageList[i]['b:Recipients']['b:Recipient']['b:m_Receiver']['c:Name']['d:m_firstName']+' '+messageList[i]['b:Recipients']['b:Recipient']['b:m_Receiver']['c:Name']['d:m_lastName'];	
							toUser += ' <span class="gray m-l-25">'+toName+'</span><br />';
						}
					}
					
					if(subject.length == 0) {
						subject = 'Empty subject';
					}
					
					if(fromName.length == 0) {
						fromName = 'Empty';
					}

					if(toUser.length == 0) {
						toUser = 'Empty<';
					}

					$("#message-list").show();
					//prevent duplicate listing
					if(currentGUID != messageList[i]['b:MessageGUID'] || type == 'Outbox') {
						//build DOM first, 
						//list += row.
						$("#message-list").append(row.
							replace('[MESSAGE_ID]',		messageList[i]['b:MessageGUID']). 	//message GUID
							replace('[MESSAGE_ID2]',	messageList[i]['b:MessageGUID']). 	//message GUID
							replace('[DATE]', 			date).								//date (ex. just now, 1 hour ago)
							replace('[SUBJECT]', 		subject).							//message subject
							replace('[IMPORTANT]', 		star).								//message priority (star)
							replace('[IMPORTANT2]', 	star).								//message priority (star)
							replace('[FROM_NAME]', 		fromName).							//message From name
							replace('[TO_NAME]', 		toUser)); 							//message To name

						ids.push(messageList[i]['b:MessageGUID']);
						
						if(type != 'Deleted') {
							swipeDelete(messageList[i]['b:MessageGUID']);	
						}	
					}
					//get the current GUID (prevent duplicate)
					currentGUID = messageList[i]['b:MessageGUID'];
				//}
				
				}

				//$('#message-archive').html(archive);
				//$("#message-list").html(list);
			}
		}

		//hide no connection image
		$('.no-connection').hide();
		//this guy is responsible for making the SUBJECT length responsive to the 
		//DIV width
		//$(".list-title").shorten();
		
		//On click message listing then load message detail
		//base on Message GUID
		onClickDetail(type);

		if(messageList != null && messageList.length < 10) {
			$('#pullUp').hide();
		} else {
			$('#pullUp').show();	
		}

		if(typeof window.iscroll !== 'undefined') {
			window.iscroll.refresh();
	  		window.iscroll.scrollTo(0, 0);
		}

		//first load flag
		if(keepHide == 1) {
			//show animation/ prepare html
			this.animateList('stop', type);
		}

		$('#wrapper').show();

		populateArchive2(ids);
		
	},
	pullDown : function(messageList,type, start, end) {
		
		var row 		= MESSAGE_ROW;
		//var i 			= start;
		var currentGUID = '';
		var list 		= '';
		var ids 		= [];

		if(messageList.length < start) {
			return false;
		}

		for(i = end; i < start; i++) {	
			if(messageList[i] !== null) {
				//use unread HTML template if only in INBOX
				if(type == 'Inbox') {
					//check if message is unread
					if(messageList[i]['b:MessageRead'] == 'false') {
						//HTML template for unread messages
						row = MESSAGE_ROW_1;
					} else {
						row = MESSAGE_ROW;
					}
				}
				
				//for important message
				var star 		= 'fa-exclamations';
				var toUser 		= '';
				var fromName 	= '';
				var subject 	= messageList[i]['b:Subject'];
				var fromName 	= messageList[i]['b:Sender']['c:Name']['d:m_firstName']+' '+messageList[i]['b:Sender']['c:Name']['d:m_lastName']
				var localDate 	= _local.date(messageList[i]['b:DateSent']['c:m_When']);
				
				//dont show datetime if in Draft and Outbox listing
				if(type == 'Draft' || type == 'Outbox') {
					date = '';
				} else {
			  		//calculate date past
			  		//date = moment(localDate).format('MMM D, h:mm');
			  		date = moment(localDate).fromNow();
			  		//date = jQuery.format.prettyDate(localDate);
			  	}

				//prevent error on Priority
				if(typeof messageList[i]['b:Priority'] !== 'undefined'){
					if(typeof messageList[i]['b:Priority']['m_Value'] !== 'undefined') {
						if(messageList[i]['b:Priority']['m_Value']['_'] == 'High') {
							var star = 'fa-exclamation';
						}
					}
				}
				
				if(subject.length > 20) {
					//subject = subject.substr(0,20)+'..';	
				}

				if(typeof messageList[i]['b:Recipients'] == 'object') {
					//if has mutiple recipient
					if(typeof messageList[i]['b:Recipients']['b:Recipient'][0] !== 'undefined') {
						//loop to get all recipient
						for(x in messageList[i]['b:Recipients']['b:Recipient']) {
							//and make HTML format
							toName = messageList[i]['b:Recipients']['b:Recipient'][x]['b:m_Receiver']['c:Name']['d:m_firstName']+' '+messageList[i]['b:Recipients']['b:Recipient'][x]['b:m_Receiver']['c:Name']['d:m_lastName'];	
							toUser += ' <span class="gray m-l-25">'+toName+'</span><br />';
						}
					//otherwise if only one recipient	
					} else {
						//just do HTML format
						toName = messageList[i]['b:Recipients']['b:Recipient']['b:m_Receiver']['c:Name']['d:m_firstName']+' '+messageList[i]['b:Recipients']['b:Recipient']['b:m_Receiver']['c:Name']['d:m_lastName'];	
						toUser += ' <span class="gray m-l-25">'+toName+'</span><br />';
					}
				}
				
				if(subject.length == 0) {
					subject = 'Empty subject';
				}
				
				if(fromName.length == 0) {
					fromName = 'Empty';
				}

				if(toUser.length == 0) {
					toUser = 'Empty';
				}

				//prevent duplicate listing
				if(currentGUID != messageList[i]['b:MessageGUID'] || type == 'Outbox') {
					//this guys will append everything he gets from loop 
					//and show it to the message list
					$("#message-list").append(row.
						replace('[MESSAGE_ID]',		messageList[i]['b:MessageGUID']). 	//message GUID
						replace('[MESSAGE_ID2]',	messageList[i]['b:MessageGUID']). 	//message GUID
						replace('[DATE]', 			date).								//date (ex. just now, 1 hour ago)
						replace('[SUBJECT]', 		subject).							//message subject
						replace('[IMPORTANT]', 		star).								//message priority (star)
						replace('[IMPORTANT2]', 	star).								//message priority (star)
						replace('[FROM_NAME]', 		fromName).							//message From name
						replace('[TO_NAME]', 		toUser)								//message To name
					);	

					ids.push(messageList[i]['b:MessageGUID']);
					
					if(type != 'Deleted') {
						swipeDelete(messageList[i]['b:MessageGUID']);
					}
				}
				//get the current GUID (prevent duplicate)
				currentGUID = messageList[i]['b:MessageGUID'];
			}
		}
		
		$('#wrapper').show();
		
		populateArchive(ids);
	}, 
	send : function(subject, content, priority, recipients, guid) {

		//get Token
		window.user.getToken(window.username, window.password, function(soapResponse){
				
			var results 	= soapResponse.toString();	
	        var json 		= $.xml2json(results);
		 	var response 	= json['s:Envelope']['s:Body']['LoginCaregiverPortalResponse']['LoginCaregiverPortalResult'];
		 	var token 		= response['a:Token'];
			var list 		= '';
			var currentDate = $.format.date(new Date().getTime(), "yyyy-MM-ddThh:mm:ss");
			var loginUser 	= window.user.get();

			//create xml for recipients   
			for(i in recipients) {
				list += 
				'<hsim:Recipient>'+
		           '<hsim:m_Receiver>'+
						'<heal:m_IsDirty>false</heal:m_IsDirty>'+
			           	'<hsi:Name>'+
			               '<heal:m_IsDirty>false</heal:m_IsDirty>'+
			               '<heal:m_firstName>' + recipients[i].data['b:Name']['c:m_firstName'] + '</heal:m_firstName>'+
			               '<heal:m_lastName>' + recipients[i].data['b:Name']['c:m_lastName'] + '</heal:m_lastName>'+
			               '<heal:m_middleInitial>' + recipients[i].data['b:Name']['c:m_middleInitial'] + '</heal:m_middleInitial>'+
			               '<heal:m_suffix>' + recipients[i].data['b:Name']['c:m_suffix'] + '</heal:m_suffix>'+
			               '<heal:m_title>' + recipients[i].data['b:Name']['c:m_title'] + '</heal:m_title>'+
			           	'</hsi:Name>'+
			           	'<hsi:PortalAccess>'+
			               '<heal:m_IsDirty>false</heal:m_IsDirty>'+
			               '<hsi:AssociationId>' + recipients[i].data['b:PortalAccess']['b:AssociationId'] + '</hsi:AssociationId>'+
			               '<hsi:LoginId>' + recipients[i].data['b:PortalAccess']['b:LoginId'] + '</hsi:LoginId>'+
			               '<hsi:TableReference>' + recipients[i].data['b:PortalAccess']['b:TableReference'] + '</hsi:TableReference>'+
			           '</hsi:PortalAccess>'+
		           '</hsim:m_Receiver>'+
	           	'</hsim:Recipient>';
			}
		
			//if no GUID means it is new message
			if(guid == 0) {
				var xml =
		       [
		           '<?xml version="1.0" encoding="UTF-8"?>',
		               '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://schemas.microsoft.com/2003/10/Serialization/" xmlns:heal="http://schemas.datacontract.org/2004/07/HealthCareAssistant" xmlns:hsim="http://schemas.datacontract.org/2004/07/HSIMessageExchange" xmlns:hsi="http://schemas.datacontract.org/2004/07/HSIAccess">',
		               '<soapenv:Header/>',
		                   '<soapenv:Body>',
		                       '<Send>',
		                           '<caregiverId>'+token+'</caregiverId>',
		                           '<message>',
		                               '<heal:m_IsDirty>false</heal:m_IsDirty>',
		                               '<hsim:Content>' + content + '</hsim:Content>',
		                               '<hsim:Label>',
		                                   '<heal:m_IsDirty>false</heal:m_IsDirty>',
		                                   '<hsim:AssociatedAgency/>',
		                                   '<hsim:DateCreated>',
		                                       '<heal:m_IsDirty>false</heal:m_IsDirty>',
		                                       '<heal:m_StampFormat/>',
		                                       '<heal:m_When>'+currentDate+'</heal:m_When>',
		                                   '</hsim:DateCreated>',
		                                   '<hsim:DateSent>',
		                                       '<heal:m_IsDirty>false</heal:m_IsDirty>',
		                                       '<heal:m_StampFormat/>',
		                                       '<heal:m_When>'+currentDate+'</heal:m_When>',
		                                   '</hsim:DateSent>',
		                                   '<hsim:MessageRead>false</hsim:MessageRead>',
		                                   '<hsim:MessageGUID/>',
		                                   '<hsim:Priority>',
		                                       '<heal:m_IsDirty>false</heal:m_IsDirty>',
		                                       '<heal:m_DefaultValue/>',
		                                       '<heal:m_FilterSet>false</heal:m_FilterSet>',
		                                       '<heal:m_Key>' + priority + '</heal:m_Key>',
		                                       '<heal:m_SerializeList>',
		                                       '</heal:m_SerializeList>',
		                                       '<heal:m_Value>' + priority + '</heal:m_Value>',
		                                   '</hsim:Priority>',
		                                   '<hsim:Recipients>',
		                                   list,
		                                   '</hsim:Recipients>',
		                                   '<hsim:Sender>',
		                                       '<heal:m_IsDirty>'+loginUser['sender']['c:Name']['d:m_IsDirty']+'</heal:m_IsDirty>',
		                                       '<hsi:Name>',
		                                           '<heal:m_IsDirty>'+loginUser['sender']['c:Name']['d:m_IsDirty']+'</heal:m_IsDirty>',
		                                           '<heal:m_firstName>'+loginUser['sender']['c:Name']['d:m_firstName']+'</heal:m_firstName>',
		                                           '<heal:m_lastName>'+loginUser['sender']['c:Name']['d:m_lastName']+'</heal:m_lastName>',
		                                           '<heal:m_middleInitial>'+loginUser['sender']['c:Name']['d:m_middleInitial']+'</heal:m_middleInitial>',
		                                           '<heal:m_suffix>'+loginUser['sender']['c:Name']['d:m_suffix']+'</heal:m_suffix>',
		                                           '<heal:m_title>'+loginUser['sender']['c:Name']['d:m_title']+'</heal:m_title>',
		                                       '</hsi:Name>',
		                                       '<hsi:PortalAccess>',
		                                           '<heal:m_IsDirty>'+loginUser['sender']['c:Name']['d:m_IsDirty']+'</heal:m_IsDirty>',
		                                           '<hsi:AssociationId>'+loginUser['sender']['c:PortalAccess']['c:AssociationId']+'</hsi:AssociationId>',
		                                           '<hsi:LoginId>'+loginUser['sender']['c:PortalAccess']['c:LoginId']+'</hsi:LoginId>',
		                                           '<hsi:TableReference>'+loginUser['sender']['c:PortalAccess']['c:TableReference']+'</hsi:TableReference>',
		                                       '</hsi:PortalAccess>',
		                                   '</hsim:Sender>',
		                                   '<hsim:Subject>' + subject + '</hsim:Subject>',
		                               '</hsim:Label>',
		                           '</message>',
		                       '</Send>',
		                   '</soapenv:Body>',
		               '</soapenv:Envelope>'
		       ];
		    //else it must be REPLY or FORWARD   
	   		} else {
	   			var xml =
		       [
		           '<?xml version="1.0" encoding="UTF-8"?>',
		               '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://schemas.microsoft.com/2003/10/Serialization/" xmlns:heal="http://schemas.datacontract.org/2004/07/HealthCareAssistant" xmlns:hsim="http://schemas.datacontract.org/2004/07/HSIMessageExchange" xmlns:hsi="http://schemas.datacontract.org/2004/07/HSIAccess">',
		               '<soapenv:Header/>',
		                   '<soapenv:Body>',
		                       '<Send>',
		                           '<caregiverId>'+token+'</caregiverId>',
		                           '<message>',
		                               '<heal:m_IsDirty>false</heal:m_IsDirty>',
		                               '<hsim:Content>' + content + '</hsim:Content>',
		                               '<hsim:Label>',
		                                   '<heal:m_IsDirty>false</heal:m_IsDirty>',
		                                   '<hsim:AssociatedAgency/>',
		                                   '<hsim:DateCreated>',
		                                       '<heal:m_IsDirty>false</heal:m_IsDirty>',
		                                       '<heal:m_StampFormat/>',
		                                       '<heal:m_When>'+currentDate+'</heal:m_When>',
		                                   '</hsim:DateCreated>',
		                                   '<hsim:DateSent>',
		                                       '<heal:m_IsDirty>false</heal:m_IsDirty>',
		                                       '<heal:m_StampFormat/>',
		                                       '<heal:m_When>'+currentDate+'</heal:m_When>',
		                                   '</hsim:DateSent>',
		                                   '<hsim:MessageRead>false</hsim:MessageRead>',
		                                   '<hsim:MessageGUID>'+guid+'</hsim:MessageGUID>',
		                                   '<hsim:Priority>',
		                                       '<heal:m_IsDirty>false</heal:m_IsDirty>',
		                                       '<heal:m_DefaultValue/>',
		                                       '<heal:m_FilterSet>false</heal:m_FilterSet>',
		                                       '<heal:m_Key>' + priority + '</heal:m_Key>',
		                                       '<heal:m_SerializeList>',
		                                       '</heal:m_SerializeList>',
		                                       '<heal:m_Value>' + priority + '</heal:m_Value>',
		                                   '</hsim:Priority>',
		                                   '<hsim:Recipients>',
		                                   list,
		                                   '</hsim:Recipients>',
		                                   '<hsim:Sender>',
		                                       '<heal:m_IsDirty>'+loginUser['sender']['c:Name']['d:m_IsDirty']+'</heal:m_IsDirty>',
		                                       '<hsi:Name>',
		                                           '<heal:m_IsDirty>'+loginUser['sender']['c:Name']['d:m_IsDirty']+'</heal:m_IsDirty>',
		                                           '<heal:m_firstName>'+loginUser['sender']['c:Name']['d:m_firstName']+'</heal:m_firstName>',
		                                           '<heal:m_lastName>'+loginUser['sender']['c:Name']['d:m_lastName']+'</heal:m_lastName>',
		                                           '<heal:m_middleInitial>'+loginUser['sender']['c:Name']['d:m_middleInitial']+'</heal:m_middleInitial>',
		                                           '<heal:m_suffix>'+loginUser['sender']['c:Name']['d:m_suffix']+'</heal:m_suffix>',
		                                           '<heal:m_title>'+loginUser['sender']['c:Name']['d:m_title']+'</heal:m_title>',
		                                       '</hsi:Name>',
		                                       '<hsi:PortalAccess>',
		                                           '<heal:m_IsDirty>'+loginUser['sender']['c:Name']['d:m_IsDirty']+'</heal:m_IsDirty>',
		                                           '<hsi:AssociationId>'+loginUser['sender']['c:PortalAccess']['c:AssociationId']+'</hsi:AssociationId>',
		                                           '<hsi:LoginId>'+loginUser['sender']['c:PortalAccess']['c:LoginId']+'</hsi:LoginId>',
		                                           '<hsi:TableReference>'+loginUser['sender']['c:PortalAccess']['c:TableReference']+'</hsi:TableReference>',
		                                       '</hsi:PortalAccess>',
		                                   '</hsim:Sender>',
		                                   '<hsim:Subject>' + subject + '</hsim:Subject>',
		                               '</hsim:Label>',
		                           '</message>',
		                       '</Send>',
		                   '</soapenv:Body>',
		               '</soapenv:Envelope>'
		       ];
	   		} 
	   		
	   		//do ajax SOAP call    
			_SOAP.post('Send', xml, function(soapResponse) { 
				var results = soapResponse.toString();
	           	var json 		= $.xml2json(results);
	           	var data 		= json['s:Envelope']['s:Body']; 
				
				$('#loading-ajax').popup('close');
				
				//if message sent
         		if(data['SendResponse']['SendResult']['a:HasError'] == 'false') {

         			$('#process-send').hide();
					notification('Message successfully sent');
					
					$('.to-holder').html('');
					$('#compose-subject').val('');
					$('#compose-content').val('');
					$('#compose-contact').val('');
					$('#compose-contact').prev().html('');
					$('.warning-holder').html('');
					//unsent sent item so it can load again
					localStorage.setItem('Sent', '');
					
					var clicked = false;

					$('.detail-button-group').each(function() {
						
						if($(this).attr('isClick') == 'true') {
							clicked = true;
						}
					});
					
					if(clicked == 'true') {
						//window.messages.getDetail(id, type, unread);
					} else {
						var parentPage 	= $('ul.nav-stacked li.active a.left-navigation').attr('id');

						window.messages.get(parentPage, 15, 1);
					}
         		} else {
         			notification('Message not send');
         		}

         		return false;	
			});
		});

		return false;	
	},
	draft : function(subject, content, priority, recipients, guid) {
		//get Token
		window.user.getToken(window.username, window.password, function(soapResponse){
			
			var results 	= soapResponse.toString();	
	        var json 		= $.xml2json(results);
		 	var response 	= json['s:Envelope']['s:Body']['LoginCaregiverPortalResponse']['LoginCaregiverPortalResult'];
		 	var token 		= response['a:Token'];
			var list 		= '';
			var currentDate = $.format.date(new Date().getTime(), "yyyy-MM-ddThh:mm:ss");
			var loginUser 	= window.user.get();

			//create xml for recipients   
			for(i in recipients) {
				list += 
				'<hsim:Recipient>'+
		           '<hsim:m_Receiver>'+
						'<heal:m_IsDirty>false</heal:m_IsDirty>'+
			           	'<hsi:Name>'+
			               '<heal:m_IsDirty>false</heal:m_IsDirty>'+
			               '<heal:m_firstName>' + recipients[i].data['b:Name']['c:m_firstName'] + '</heal:m_firstName>'+
			               '<heal:m_lastName>' + recipients[i].data['b:Name']['c:m_lastName'] + '</heal:m_lastName>'+
			               '<heal:m_middleInitial>' + recipients[i].data['b:Name']['c:m_middleInitial'] + '</heal:m_middleInitial>'+
			               '<heal:m_suffix>' + recipients[i].data['b:Name']['c:m_suffix'] + '</heal:m_suffix>'+
			               '<heal:m_title>' + recipients[i].data['b:Name']['c:m_title'] + '</heal:m_title>'+
			           	'</hsi:Name>'+
			           	'<hsi:PortalAccess>'+
			               '<heal:m_IsDirty>false</heal:m_IsDirty>'+
			               '<hsi:AssociationId>' + recipients[i].data['b:PortalAccess']['b:AssociationId'] + '</hsi:AssociationId>'+
			               '<hsi:LoginId>' + recipients[i].data['b:PortalAccess']['b:LoginId'] + '</hsi:LoginId>'+
			               '<hsi:TableReference>' + recipients[i].data['b:PortalAccess']['b:TableReference'] + '</hsi:TableReference>'+
			           '</hsi:PortalAccess>'+
		           '</hsim:m_Receiver>'+
	           	'</hsim:Recipient>';
			}

			if(guid == 0) {
				var xml =
		       		['<?xml version="1.0" encoding="UTF-8"?>',
		               '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://schemas.microsoft.com/2003/10/Serialization/" xmlns:heal="http://schemas.datacontract.org/2004/07/HealthCareAssistant" xmlns:hsim="http://schemas.datacontract.org/2004/07/HSIMessageExchange" xmlns:hsi="http://schemas.datacontract.org/2004/07/HSIAccess">',
		               '<soapenv:Header/>',
		                   '<soapenv:Body>',
		                       '<Draft>',
		                           '<caregiverId>' + token + '</caregiverId>',
		                           '<message>',
		                               '<heal:m_IsDirty>false</heal:m_IsDirty>',
		                               '<hsim:Content>' + content + '</hsim:Content>',
		                               '<hsim:Label>',
		                                   '<heal:m_IsDirty>false</heal:m_IsDirty>',
		                                   '<hsim:AssociatedAgency/>',
		                                   '<hsim:DateCreated>',
		                                       '<heal:m_IsDirty>false</heal:m_IsDirty>',
		                                       '<heal:m_StampFormat/>',
		                                       '<heal:m_When>'+currentDate+'</heal:m_When>',
		                                   '</hsim:DateCreated>',
		                                   '<hsim:DateSent>',
		                                       '<heal:m_IsDirty>false</heal:m_IsDirty>',
		                                       '<heal:m_StampFormat/>',
		                                       '<heal:m_When>'+currentDate+'</heal:m_When>',
		                                   '</hsim:DateSent>',
		                                   '<hsim:MessageRead>false</hsim:MessageRead>',
		                                   '<hsim:MessageGUID/>',
		                                   '<hsim:Priority>',
		                                       '<heal:m_IsDirty>false</heal:m_IsDirty>',
		                                       '<heal:m_DefaultValue/>',
		                                       '<heal:m_FilterSet>false</heal:m_FilterSet>',
		                                       '<heal:m_Key>' + priority + '</heal:m_Key>',
		                                       '<heal:m_SerializeList>',
		                                       '</heal:m_SerializeList>',
		                                       '<heal:m_Value>' + priority + '</heal:m_Value>',
		                                   '</hsim:Priority>',
		                                   '<hsim:Recipients>',
		                                   list,
		                                   '</hsim:Recipients>',
		                                   '<hsim:Sender>',
		                                       '<heal:m_IsDirty>'+loginUser['sender']['c:Name']['d:m_IsDirty']+'</heal:m_IsDirty>',
		                                       '<hsi:Name>',
		                                           '<heal:m_IsDirty>'+loginUser['sender']['c:Name']['d:m_IsDirty']+'</heal:m_IsDirty>',
		                                           '<heal:m_firstName>'+loginUser['sender']['c:Name']['d:m_firstName']+'</heal:m_firstName>',
		                                           '<heal:m_lastName>'+loginUser['sender']['c:Name']['d:m_lastName']+'</heal:m_lastName>',
		                                           '<heal:m_middleInitial>'+loginUser['sender']['c:Name']['d:m_middleInitial']+'</heal:m_middleInitial>',
		                                           '<heal:m_suffix>'+loginUser['sender']['c:Name']['d:m_suffix']+'</heal:m_suffix>',
		                                           '<heal:m_title>'+loginUser['sender']['c:Name']['d:m_title']+'</heal:m_title>',
		                                       '</hsi:Name>',
		                                       '<hsi:PortalAccess>',
		                                           '<heal:m_IsDirty>'+loginUser['sender']['c:Name']['d:m_IsDirty']+'</heal:m_IsDirty>',
		                                           '<hsi:AssociationId>'+loginUser['sender']['c:PortalAccess']['c:AssociationId']+'</hsi:AssociationId>',
		                                           '<hsi:LoginId>'+loginUser['sender']['c:PortalAccess']['c:LoginId']+'</hsi:LoginId>',
		                                           '<hsi:TableReference>'+loginUser['sender']['c:PortalAccess']['c:TableReference']+'</hsi:TableReference>',
		                                       '</hsi:PortalAccess>',
		                                   '</hsim:Sender>',
		                                   '<hsim:Subject>' + subject + '</hsim:Subject>',
		                               '</hsim:Label>',
		                           '</message>',
		                       '</Draft>',
		                   '</soapenv:Body>',
		               '</soapenv:Envelope>'];
			} else {
				var xml =
		       		['<?xml version="1.0" encoding="UTF-8"?>',
		               '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://schemas.microsoft.com/2003/10/Serialization/" xmlns:heal="http://schemas.datacontract.org/2004/07/HealthCareAssistant" xmlns:hsim="http://schemas.datacontract.org/2004/07/HSIMessageExchange" xmlns:hsi="http://schemas.datacontract.org/2004/07/HSIAccess">',
		               '<soapenv:Header/>',
		                   '<soapenv:Body>',
		                       '<Draft>',
		                           '<caregiverId>' + token + '</caregiverId>',
		                           '<message>',
		                               '<heal:m_IsDirty>false</heal:m_IsDirty>',
		                               '<hsim:Content>' + content + '</hsim:Content>',
		                               '<hsim:Label>',
		                                   '<heal:m_IsDirty>false</heal:m_IsDirty>',
		                                   '<hsim:AssociatedAgency/>',
		                                   '<hsim:DateCreated>',
		                                       '<heal:m_IsDirty>false</heal:m_IsDirty>',
		                                       '<heal:m_StampFormat/>',
		                                       '<heal:m_When>'+currentDate+'</heal:m_When>',
		                                   '</hsim:DateCreated>',
		                                   '<hsim:DateSent>',
		                                       '<heal:m_IsDirty>false</heal:m_IsDirty>',
		                                       '<heal:m_StampFormat/>',
		                                       '<heal:m_When>'+currentDate+'</heal:m_When>',
		                                   '</hsim:DateSent>',
		                                   '<hsim:MessageRead>false</hsim:MessageRead>',
		                                   '<hsim:MessageGUID>'+guid+'</hsim:MessageGUID>',
		                                   '<hsim:Priority>',
		                                       '<heal:m_IsDirty>false</heal:m_IsDirty>',
		                                       '<heal:m_DefaultValue/>',
		                                       '<heal:m_FilterSet>false</heal:m_FilterSet>',
		                                       '<heal:m_Key>' + priority + '</heal:m_Key>',
		                                       '<heal:m_SerializeList>',
		                                       '</heal:m_SerializeList>',
		                                       '<heal:m_Value>' + priority + '</heal:m_Value>',
		                                   '</hsim:Priority>',
		                                   '<hsim:Recipients>',
		                                   list,
		                                   '</hsim:Recipients>',
		                                   '<hsim:Sender>',
		                                       '<heal:m_IsDirty>'+loginUser['sender']['c:Name']['d:m_IsDirty']+'</heal:m_IsDirty>',
		                                       '<hsi:Name>',
		                                           '<heal:m_IsDirty>'+loginUser['sender']['c:Name']['d:m_IsDirty']+'</heal:m_IsDirty>',
		                                           '<heal:m_firstName>'+loginUser['sender']['c:Name']['d:m_firstName']+'</heal:m_firstName>',
		                                           '<heal:m_lastName>'+loginUser['sender']['c:Name']['d:m_lastName']+'</heal:m_lastName>',
		                                           '<heal:m_middleInitial>'+loginUser['sender']['c:Name']['d:m_middleInitial']+'</heal:m_middleInitial>',
		                                           '<heal:m_suffix>'+loginUser['sender']['c:Name']['d:m_suffix']+'</heal:m_suffix>',
		                                           '<heal:m_title>'+loginUser['sender']['c:Name']['d:m_title']+'</heal:m_title>',
		                                       '</hsi:Name>',
		                                       '<hsi:PortalAccess>',
		                                           '<heal:m_IsDirty>'+loginUser['sender']['c:Name']['d:m_IsDirty']+'</heal:m_IsDirty>',
		                                           '<hsi:AssociationId>'+loginUser['sender']['c:PortalAccess']['c:AssociationId']+'</hsi:AssociationId>',
		                                           '<hsi:LoginId>'+loginUser['sender']['c:PortalAccess']['c:LoginId']+'</hsi:LoginId>',
		                                           '<hsi:TableReference>'+loginUser['sender']['c:PortalAccess']['c:TableReference']+'</hsi:TableReference>',
		                                       '</hsi:PortalAccess>',
		                                   '</hsim:Sender>',
		                                   '<hsim:Subject>' + subject + '</hsim:Subject>',
		                               '</hsim:Label>',
		                           '</message>',
		                       '</Draft>',
		                   '</soapenv:Body>',
		               '</soapenv:Envelope>'];
			}

			_SOAP.post('Draft', xml, function(soapResponse) { 
				var results = soapResponse.toString();
	           	var json 	= $.xml2json(results);
	           	var data 	= json['s:Envelope']['s:Body']; 
	           	
	           	//navbar unset
				$('#delete-message').hide();
				$('#process-send').hide();
				$('#compose-message').show();
				$('#loading-ajax').popup('close');
	           	$('#process-draft').html('Save');
	           	$('#process-draft').removeAttr('disabled');
	           	$('#test-pop').popup('close');

	           	//if message sent
         		if(data['DraftResponse']['DraftResult']['a:HasError'] == 'false') {

					notification('Message successfully saved');
					localStorage.setItem('Draft', '');	

					//go back to Inbox
					window.messages.get('Inbox', 10, 1);

         		} else {
         			notification('Message not save in draft');
         		}	
			});	    
		});
		return false;	
	},
	forward : function(data) {

		var ToList 		= ''; 
	
		//ADD TO 
		//if more than 1 recipients
		if(typeof data['b:Label']['b:Recipients']['b:Recipient'] === 'object' && typeof data['b:Label']['b:Recipients']['b:Recipient'][0] !== 'undefined') {
			for(i in data['b:Label']['b:Recipients']['b:Recipient']) {
				for(x in window.contactList) {
					//if found
					if(data['b:Label']['b:Recipients']['b:Recipient'][i]['b:m_Receiver']['c:PortalAccess']['c:LoginId'] == window.contactList[x].data['b:PortalAccess']['b:LoginId']) {
							

						ToList += window.contactList[x].name+'; ';
					}
				}
			}
		//else only 1 recipient
		} else {
			for(x in window.contactList) {
				//if found
				if(data['b:Label']['b:Recipients']['b:Recipient']['b:m_Receiver']['c:PortalAccess']['c:LoginId'] == window.contactList[x].data['b:PortalAccess']['b:LoginId']) {
					
			    	ToList += window.contactList[x].name+'; ';
				}
			}
		}

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

		var fromName = data['b:Label']['b:Sender']['c:Name']['d:m_firstName']+' '+data['b:Label']['b:Sender']['c:Name']['d:m_lastName'];
		var messageSent = data['b:Label']['b:DateSent']['c:m_When'];
		var messageSubject = data['b:Label']['b:Subject'];

		//prepare reply content
		var messageBody = "\n\n----------------------------------\n>> From: " +fromName+ "\n";
	        messageBody += ">> Sent: " + messageSent + "\n";
	        messageBody += ">> To: "+ToList+"\n";
	        messageBody += "\n>> Subject: " + messageSubject + "\n";
   	 	var lines = data['b:Content'].split("\n");

        for (i = 0; i < lines.length; i++) {
            messageBody += ">> " + lines[i] + "\n";
        }

		$('#compose-subject').val('FW: '+ messageSubject);
		$('#compose-content').val(messageBody);

		//on click send
		$('#process-send').unbind().click(function() {

			//dont process if no internet
			ifNoInternet();

			//get Token
			window.user.getToken(window.username, window.password, function(soapResponse){
				/* --------------------------------------------
					POPULATE COMPOSE FROM DATA OF DETAIL PAGE
				   -------------------------------------------- */
				var results 	= soapResponse.toString();	
		        var json 		= $.xml2json(results);
			 	var response 	= json['s:Envelope']['s:Body']['LoginCaregiverPortalResponse']['LoginCaregiverPortalResult'];
			 	var token 		= response['a:Token'];
			
				$('#loading-ajax #text').html('Sending Message');
				$('#loading-ajax').popup('open');

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

				var list = '';
				
				for(i in recipients) {
					list += 
					'<hsim:Recipient>'+
			           '<hsim:m_Receiver>'+
							'<heal:m_IsDirty>false</heal:m_IsDirty>'+
				           	'<hsi:Name>'+
				               '<heal:m_IsDirty>false</heal:m_IsDirty>'+
				               '<heal:m_firstName>' + recipients[i].data['b:Name']['c:m_firstName'] + '</heal:m_firstName>'+
				               '<heal:m_lastName>' + recipients[i].data['b:Name']['c:m_lastName'] + '</heal:m_lastName>'+
				               '<heal:m_middleInitial>' + recipients[i].data['b:Name']['c:m_middleInitial'] + '</heal:m_middleInitial>'+
				               '<heal:m_suffix>' + recipients[i].data['b:Name']['c:m_suffix'] + '</heal:m_suffix>'+
				               '<heal:m_title>' + recipients[i].data['b:Name']['c:m_title'] + '</heal:m_title>'+
				           	'</hsi:Name>'+
				           	'<hsi:PortalAccess>'+
				               '<heal:m_IsDirty>false</heal:m_IsDirty>'+
				               '<hsi:AssociationId>' + recipients[i].data['b:PortalAccess']['b:AssociationId'] + '</hsi:AssociationId>'+
				               '<hsi:LoginId>' + recipients[i].data['b:PortalAccess']['b:LoginId'] + '</hsi:LoginId>'+
				               '<hsi:TableReference>' + recipients[i].data['b:PortalAccess']['b:TableReference'] + '</hsi:TableReference>'+
				           '</hsi:PortalAccess>'+
			           '</hsim:m_Receiver>'+
		           	'</hsim:Recipient>';
				}
				
				var xml = 
				[
					'<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://schemas.microsoft.com/2003/10/Serialization/" xmlns:heal="http://schemas.datacontract.org/2004/07/HealthCareAssistant" xmlns:hsim="http://schemas.datacontract.org/2004/07/HSIMessageExchange" xmlns:hsi="http://schemas.datacontract.org/2004/07/HSIAccess">',
					   '<soapenv:Header/>',
					   '<soapenv:Body>',
					      '<Forward>',
					         '<caregiverId>'+token+'</caregiverId>',
					         '<message>',
					         	'<heal:m_IsDirty>false</heal:m_IsDirty>',
					            '<hsim:Content>'+content+'</hsim:Content>',
					            '<hsim:Label>',
					               '<heal:m_IsDirty>false</heal:m_IsDirty>',
					               '<hsim:AssociatedAgency></hsim:AssociatedAgency>',
					               '<hsim:DateCreated>',
			                           '<heal:m_IsDirty>false</heal:m_IsDirty>',
			                           '<heal:m_StampFormat/>',
			                           '<heal:m_When>'+data['b:Label']['b:DateCreated']['c:m_When']+'</heal:m_When>',
			                       '</hsim:DateCreated>',
			                       '<hsim:DateSent>',
			                           '<heal:m_IsDirty>false</heal:m_IsDirty>',
			                           '<heal:m_StampFormat/>',
			                           '<heal:m_When>'+data['b:Label']['b:DateSent']['c:m_When']+'</heal:m_When>',
			                       '</hsim:DateSent>',
					               '<hsim:MessageGUID>'+data['b:Label']['b:MessageGUID']+'</hsim:MessageGUID>',
					               '<hsim:MessageRead>true</hsim:MessageRead>',
					               '<hsim:Priority>',
			                           '<heal:m_IsDirty>false</heal:m_IsDirty>',
			                           '<heal:m_DefaultValue/>',
			                           '<heal:m_FilterSet>false</heal:m_FilterSet>',
			                           '<heal:m_Key>' + priority + '</heal:m_Key>',
			                           '<heal:m_SerializeList>',
			                           '</heal:m_SerializeList>',
			                           '<heal:m_Value>' + priority + '</heal:m_Value>',
					               '</hsim:Priority>',
					               '<hsim:Recipients>',
					                  list,
					               '</hsim:Recipients>',
					               '<hsim:Sender>',
								        '<heal:m_IsDirty>false</heal:m_IsDirty>',
								        '<hsi:Name>',
								        '<heal:m_IsDirty>false</heal:m_IsDirty>',
								            '<heal:m_firstName>' + data['b:Label']['b:Sender']['c:Name']['d:m_firstName'] + '</heal:m_firstName>',
								            '<heal:m_lastName>' + data['b:Label']['b:Sender']['c:Name']['d:m_latName'] + '</heal:m_lastName>',
								            '<heal:m_middleInitial>' + data['b:Label']['b:Sender']['c:Name']['d:m_middleInitial'] + '</heal:m_middleInitial>',
								            '<heal:m_suffix>' + data['b:Label']['b:Sender']['c:Name']['d:m_suffix'] + '</heal:m_suffix>',
								            '<heal:m_title>' + data['b:Label']['b:Sender']['c:Name']['d:m_title'] + '</heal:m_title>',
								        '</hsi:Name>',
								        '<hsi:PortalAccess>',
								        '<heal:m_IsDirty>false</heal:m_IsDirty>',
								            '<hsi:AssociationId>' + data['b:Label']['b:Sender']['c:PortalAccess']['c:AssociationId'] + '</hsi:AssociationId>',
								            '<hsi:LoginId>' + data['b:Label']['b:Sender']['c:PortalAccess']['c:LoginId'] + '</hsi:LoginId>',
								            '<hsi:TableReference>' + data['b:Label']['b:Sender']['c:PortalAccess']['c:TableReference'] + '</hsi:TableReference>',
								        '</hsi:PortalAccess>',
								   '</hsim:Sender>',
					               '<hsim:Subject>Re: '+subject+'</hsim:Subject>',
					            '</hsim:Label>',
					            '<hsim:ReplyingTo>'+data['b:Label']['b:MessageGUID']+'</hsim:ReplyingTo>',
					         '</message>',
					         '<retainPreviousMessage>true</retainPreviousMessage>',
					      '</Forward>',
					   '</soapenv:Body>',
					'</soapenv:Envelope>'];
				
				_SOAP.post('Forward', xml, function(soapResponse) { 
					var results = soapResponse.toString();
		           	var json 	= $.xml2json(results);
		           	var data 	= json['s:Envelope']['s:Body']['ForwardResponse']['ForwardResult'];
		           	
		           	//now send it
		        	window.messages.send(subject, content, priority, recipients, data['a:MessageResult']['b:ReplyingTo']);	
				});	
			});
		});
		
		return false;
	},
	replyAll : function(data, action) {
		var ToList 		= ''; 
		var foundInTo 	= false; 
		
		if(action == 'replyAll') {
			//if more than 1 recipients
			if(typeof data['b:Label']['b:Recipients']['b:Recipient'] === 'object' && typeof data['b:Label']['b:Recipients']['b:Recipient'][0] !== 'undefined') {
				for(i in data['b:Label']['b:Recipients']['b:Recipient']) {
					for(x in window.contactList) {
						//if found
						if(data['b:Label']['b:Recipients']['b:Recipient'][i]['b:m_Receiver']['c:PortalAccess']['c:LoginId'] == window.contactList[x].data['b:PortalAccess']['b:LoginId']) {
							$('.to-holder').append(TO_COMPOSE.
					    		replace('[ID]', x).
					    		replace('[NAME]', window.contactList[x].name)
					    	);		

							ToList += window.contactList[x].name+'; ';
						}

						//checker if FROM name is also in TO 
						if(data['b:Label']['b:Recipients']['b:Recipient'][i]['b:m_Receiver']['c:PortalAccess']['c:LoginId'] == data['b:Label']['b:Sender']['c:PortalAccess']['c:LoginId']) {
							foundInTo = true;
						}
					}
				}
			//else only 1 recipient
			} else {
				for(x in window.contactList) {
					//if found
					if(data['b:Label']['b:Recipients']['b:Recipient']['b:m_Receiver']['c:PortalAccess']['c:LoginId'] == window.contactList[x].data['b:PortalAccess']['b:LoginId']) {
						
						$('.to-holder').append(TO_COMPOSE.
				    		replace('[ID]', x).
				    		replace('[NAME]', window.contactList[x].name)
				    	);

				    	ToList += window.contactList[x].name+'; ';

				    	//checker if FROM name is also in TO 
						if(data['b:Label']['b:Recipients']['b:Recipient']['b:m_Receiver']['c:PortalAccess']['c:LoginId'] == data['b:Label']['b:Sender']['c:PortalAccess']['c:LoginId']) {
							foundInTo = true;
						}			
					}
				}
			}

			//prevent mutiple TO list if ever FROM detail message is 
			//already found in TO listing of detail message
			if(!foundInTo) {
				//ADD FROM
				for(x in window.contactList) {
					//if found in contact list
					if(data['b:Label']['b:Sender']['c:PortalAccess']['c:LoginId'] == window.contactList[x].data['b:PortalAccess']['b:LoginId']) {
						
						$('.to-holder').append(TO_COMPOSE.
				    		replace('[ID]', x).
				    		replace('[NAME]', window.contactList[x].name)
				    	);
					}
				}
			}
		} else {
			if(!foundInTo) {
				//ADD FROM
				for(x in window.contactList) {
					//if found in contact list
					if(data['b:Label']['b:Sender']['c:PortalAccess']['c:LoginId'] == window.contactList[x].data['b:PortalAccess']['b:LoginId']) {
						
						$('.to-holder').append(TO_COMPOSE.
				    		replace('[ID]', x).
				    		replace('[NAME]', window.contactList[x].name)
				    	);
					}
				}
			}
		}				

		var fromName = data['b:Label']['b:Sender']['c:Name']['d:m_firstName']+' '+data['b:Label']['b:Sender']['c:Name']['d:m_lastName'];
		var messageSent = data['b:Label']['b:DateSent']['c:m_When'];
		var messageSubject = data['b:Label']['b:Subject'];

		//prepare reply content
		var messageBody = "\n\n----------------------------------\n>> From: " +fromName+ "\n";
	        messageBody += ">> Sent: " + messageSent + "\n";
	        messageBody += ">> To: "+ToList+"\n";
	        messageBody += "\n>> Subject: " + messageSubject + "\n";
        var lines = data['b:Content'].split("\n");

        for (i = 0; i < lines.length; i++) {
            messageBody += ">> " + lines[i] + "\n";
        }

		$('#compose-subject').val('Re: '+ messageSubject);
		$('#compose-content').val(messageBody);

		//on click compose
		$('#process-send').unbind().click(function() {
			
			//dont process if no internet
			ifNoInternet();

			//get Token
			window.user.getToken(window.username, window.password, function(soapResponse){
				/* --------------------------------------------
					POPULATE COMPOSE FROM DATA OF DETAIL PAGE
				   -------------------------------------------- */
				var results 	= soapResponse.toString();	
		        var json 		= $.xml2json(results);
			 	var response 	= json['s:Envelope']['s:Body']['LoginCaregiverPortalResponse']['LoginCaregiverPortalResult'];
			 	var token 		= response['a:Token'];
				
				$('#loading-ajax #text').html('Sending Message');
				$('#loading-ajax').popup('open');

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

				//show something loading
				$('#send-compose').attr('disabled', 'disabled');
				$('#send-compose').html('Sending...');
				
				var list = '';
				
				for(i in recipients) {
					list += 
					'<hsim:Recipient>'+
			           '<hsim:m_Receiver>'+
							'<heal:m_IsDirty>false</heal:m_IsDirty>'+
				           	'<hsi:Name>'+
				               '<heal:m_IsDirty>false</heal:m_IsDirty>'+
				               '<heal:m_firstName>' + recipients[i].data['b:Name']['c:m_firstName'] + '</heal:m_firstName>'+
				               '<heal:m_lastName>' + recipients[i].data['b:Name']['c:m_lastName'] + '</heal:m_lastName>'+
				               '<heal:m_middleInitial>' + recipients[i].data['b:Name']['c:m_middleInitial'] + '</heal:m_middleInitial>'+
				               '<heal:m_suffix>' + recipients[i].data['b:Name']['c:m_suffix'] + '</heal:m_suffix>'+
				               '<heal:m_title>' + recipients[i].data['b:Name']['c:m_title'] + '</heal:m_title>'+
				           	'</hsi:Name>'+
				           	'<hsi:PortalAccess>'+
				               '<heal:m_IsDirty>false</heal:m_IsDirty>'+
				               '<hsi:AssociationId>' + recipients[i].data['b:PortalAccess']['b:AssociationId'] + '</hsi:AssociationId>'+
				               '<hsi:LoginId>' + recipients[i].data['b:PortalAccess']['b:LoginId'] + '</hsi:LoginId>'+
				               '<hsi:TableReference>' + recipients[i].data['b:PortalAccess']['b:TableReference'] + '</hsi:TableReference>'+
				           '</hsi:PortalAccess>'+
			           '</hsim:m_Receiver>'+
		           	'</hsim:Recipient>';
				}

				var xml = 
				[
					'<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://schemas.microsoft.com/2003/10/Serialization/" xmlns:heal="http://schemas.datacontract.org/2004/07/HealthCareAssistant" xmlns:hsim="http://schemas.datacontract.org/2004/07/HSIMessageExchange" xmlns:hsi="http://schemas.datacontract.org/2004/07/HSIAccess">',
					   '<soapenv:Header/>',
					   '<soapenv:Body>',
					      '<Reply>',
					         '<caregiverId>'+token+'</caregiverId>',
					         '<message>',
					         	'<heal:m_IsDirty>false</heal:m_IsDirty>',
					            '<hsim:Content>'+content+'</hsim:Content>',
					            '<hsim:Label>',
					               '<heal:m_IsDirty>false</heal:m_IsDirty>',
					               '<hsim:AssociatedAgency></hsim:AssociatedAgency>',
					               '<hsim:DateCreated>',
			                           '<heal:m_IsDirty>false</heal:m_IsDirty>',
			                           '<heal:m_StampFormat/>',
			                           '<heal:m_When>'+data['b:Label']['b:DateCreated']['c:m_When']+'</heal:m_When>',
			                       '</hsim:DateCreated>',
			                       '<hsim:DateSent>',
			                           '<heal:m_IsDirty>false</heal:m_IsDirty>',
			                           '<heal:m_StampFormat/>',
			                           '<heal:m_When>'+data['b:Label']['b:DateSent']['c:m_When']+'</heal:m_When>',
			                       '</hsim:DateSent>',
					               '<hsim:MessageGUID>'+data['b:Label']['b:MessageGUID']+'</hsim:MessageGUID>',
					               '<hsim:MessageRead>true</hsim:MessageRead>',
					               '<hsim:Priority>',
			                           '<heal:m_IsDirty>false</heal:m_IsDirty>',
			                           '<heal:m_DefaultValue/>',
			                           '<heal:m_FilterSet>false</heal:m_FilterSet>',
			                           '<heal:m_Key>' + priority + '</heal:m_Key>',
			                           '<heal:m_SerializeList>',
			                           '</heal:m_SerializeList>',
			                           '<heal:m_Value>' + priority + '</heal:m_Value>',
					               '</hsim:Priority>',
					               '<hsim:Recipients>',
					                  list,
					               '</hsim:Recipients>',
					               '<hsim:Sender>',
								        '<heal:m_IsDirty>false</heal:m_IsDirty>',
								        '<hsi:Name>',
								        '<heal:m_IsDirty>false</heal:m_IsDirty>',
								            '<heal:m_firstName>' + data['b:Label']['b:Sender']['c:Name']['d:m_firstName'] + '</heal:m_firstName>',
								            '<heal:m_lastName>' + data['b:Label']['b:Sender']['c:Name']['d:m_latName'] + '</heal:m_lastName>',
								            '<heal:m_middleInitial>' + data['b:Label']['b:Sender']['c:Name']['d:m_middleInitial'] + '</heal:m_middleInitial>',
								            '<heal:m_suffix>' + data['b:Label']['b:Sender']['c:Name']['d:m_suffix'] + '</heal:m_suffix>',
								            '<heal:m_title>' + data['b:Label']['b:Sender']['c:Name']['d:m_title'] + '</heal:m_title>',
								        '</hsi:Name>',
								        '<hsi:PortalAccess>',
								        '<heal:m_IsDirty>false</heal:m_IsDirty>',
								            '<hsi:AssociationId>' + data['b:Label']['b:Sender']['c:PortalAccess']['c:AssociationId'] + '</hsi:AssociationId>',
								            '<hsi:LoginId>' + data['b:Label']['b:Sender']['c:PortalAccess']['c:LoginId'] + '</hsi:LoginId>',
								            '<hsi:TableReference>' + data['b:Label']['b:Sender']['c:PortalAccess']['c:TableReference'] + '</hsi:TableReference>',
								        '</hsi:PortalAccess>',
								   '</hsim:Sender>',
					               '<hsim:Subject>Re: '+subject+'</hsim:Subject>',
					            '</hsim:Label>',
					            '<hsim:ReplyingTo>'+data['b:Label']['b:MessageGUID']+'</hsim:ReplyingTo>',
					         '</message>',
					         '<retainPreviousMessage>true</retainPreviousMessage>',
					      '</Reply>',
					   '</soapenv:Body>',
					'</soapenv:Envelope>'];

					_SOAP.post('Reply', xml, function(soapResponse) { 
						var results = soapResponse.toString();
			           	var json 	= $.xml2json(results);
			           	var data 	= json['s:Envelope']['s:Body']['ReplyResponse']['ReplyResult'];
			           	
			           	//now send it
			           	window.messages.send(subject, content, priority, recipients, data['a:MessageResult']['b:ReplyingTo']);	
				       		
					});	
			});
		});

		return false;
	},
	/**
	 * Delete message SOAP call
	 *
	 * @param string message guid
	 * @param string message type
	 * @return mixed
	 */
	delete : function(guid, type) {
		$('#message-list').css('pointer-events', 'all');			
		$('#loading-ajax #text').html('Deleting Message');
		$('#loading-ajax').popup('open');
		

		//	$('#'+guid).css("-webkit-transition-duration", 1 + "s");
		//	$('#'+guid).css("-webkit-transform", "translate3d(1000px,0px,0px)");
		
		//$('#delete_'+guid).css("-webkit-transition-duration", 1 + "s");
		//$('#delete_'+guid).css("-webkit-transform", "translate3d(1000px,0px,0px)");
		//return false;
		//get Token
		window.user.getToken(window.username, window.password, function(soapResponse){
			
			var results 	= soapResponse.toString();	
	        var json 		= $.xml2json(results);
		 	var response 	= json['s:Envelope']['s:Body']['LoginCaregiverPortalResponse']['LoginCaregiverPortalResult'];
		 	var token 		= response['a:Token'];
		
			var xml = 
			['<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://schemas.microsoft.com/2003/10/Serialization/" xmlns:heal="http://schemas.datacontract.org/2004/07/HealthCareAssistant" xmlns:hsim="http://schemas.datacontract.org/2004/07/HSIMessageExchange">',
				'<soapenv:Header/>',
				   '<soapenv:Body>',
				      '<DeleteMessage>',
				         '<caregiverId>'+token+'</caregiverId>',
				         '<messageFolder>',
				            '<heal:m_IsDirty>false</heal:m_IsDirty>',
				            '<heal:m_DefaultValue></heal:m_DefaultValue>',
				            '<heal:m_FilterSet>false</heal:m_FilterSet>',
				            '<heal:m_Key>' + type + '</heal:m_Key>',
				            '<heal:m_SerializeList></heal:m_SerializeList>',
				         '</messageFolder>',
				         '<messageGuid>'+guid+'</messageGuid>',
				      '</DeleteMessage>',
				   '</soapenv:Body>',
				'</soapenv:Envelope>'
			];
			
			_SOAP.post('DeleteMessage', xml, function(soapResponse) { 
				var results = soapResponse.toString(); 
	            var json 	= $.xml2json(results);
	        	var newMessage = $('#'+guid).attr('unread');
	        	
	        	if(newMessage == 'true') {

	        		var count = $('#'+type+' span.badge').html();
					
					//only process if there is unread message	
					if(count != 0) {
						//do the math
						var plus = parseInt(count) - 1;

						$('#'+type+' span.badge').html(plus);
						$('#folder-name').html($('#'+type).html());
						setBadge(plus);						
					}
	        	}    
	           
	            //throw message that the message is deleted
	           //	notification('Message deleted');
	           	
         		//get local Storage data
	           	var data 	= _string.unlock(type);
	           	var data2 	= _string.unlock('Deleted');
         		var newData = [];

         		//now remove the message to the local storage
         		for(i in  data) {

         			if(data[i]['b:MessageGUID'] != guid){

         				newData.push(data[i])
         			} else {
         				//only add if deleted message is already loaded
         				if(data2 !== null) {
         					//push to the beginning of the listing
         					data2.splice(0, 0, data[i]);
         					_string.lock(data2, 'Deleted');
         				}
         			}
         		}
         		
         		_string.lock(newData, type);
         		
	           	var currentPage = $('.current-page').attr('id');
	        	
	        	if(currentPage == 'home') {
					$('#'+guid).hide();
					$('#delete_'+guid).hide();
					addOne()
				} else {
					var next = $('#'+guid).next().attr('id');
					//if end of the list
					if(typeof next === 'undefined') {
						//we jsut go back to the listing
						window.startCount = 10;
						window.messages.get(type,15,1);	
					//go to the next message detail				
					} else {
						
						var unread 	= $('#'+next).attr('unread');

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
								
								setBadge(plus);
							}
							$('#'+next).css('background-color', '#E4E4E4');
							$('#'+next).css('font-weight', 'none');
							
						}

						window.messages.getDetail(next, type, unread);	
					}	
				}

				setTimeout(function() {

					$('#loading-ajax').popup('close');
					//$('#message-list').css('pointer-events', 'all');
				
				}, 1000);

			
			});
		});

		return false;
	},
	undelete : function(guid, type) {
		//get Token
		window.user.getToken(window.username, window.password, function(soapResponse){
			
			var results 	= soapResponse.toString();	
	        var json 		= $.xml2json(results);
		 	var response 	= json['s:Envelope']['s:Body']['LoginCaregiverPortalResponse']['LoginCaregiverPortalResult'];
		 	var token 		= response['a:Token'];
		
			$('#loading-ajax #text').html('Undeleting Message');
			$('#loading-ajax').popup('open');

			var xml = [
				'<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">',
			   '<soapenv:Header/>',
			   '<soapenv:Body>',
			      '<UnDeleteMessage>',
			         
			         '<caregiverId>'+token+'</caregiverId>',
			         
			         '<messageGuid>'+guid+'</messageGuid>',
			      '</UnDeleteMessage>',
			   '</soapenv:Body>',
			'</soapenv:Envelope>'
			];

			_SOAP.post('UnDeleteMessage', xml, function(soapResponse) { 
				$('#loading-ajax').popup('close');
	        	
	            var results = soapResponse.toString(); 
	            var json 	= $.xml2json(results);
	            //throw message that the message is deleted
	           	notification('Message undeleted');
	           	
	           	var data = _string.unlock(type);

	           	newData = [];
				 		
         		//now remove the message to the local storage
         		for(i in  data) {
         			if(data[i]['b:MessageGUID'] != guid){
         				newData.push(data[i])
	         		}
         		}
         		
         		//lock and save
         		_string.lock(newData, type)

         		//put it back
	            window.messages.get(type,15,1);
	            //unset all
	            localStorage.setItem('Inbox', '');
	            localStorage.setItem('Draft', '');
	            localStorage.setItem('Sent', '');
	            
			});
			
		});
	},

	/**
	 * Get the detail content of the message using
	 * the MESSAGE GUID
	 *
	 * @param string GUID
	 * @return mixed
	 */
	checkInbox : function(type, manual) { 
		
		//refresh token first
		window.user.getToken(window.username, window.password, function(soapResponse){
			
			var results 	= soapResponse.toString();	
	        var json 		= $.xml2json(results);
		 	var response 	= json['s:Envelope']['s:Body']['LoginCaregiverPortalResponse']['LoginCaregiverPortalResult'];
		 	var token 		= response['a:Token'];
			var start 		= '1950-04-01T09:00:00';
			var end 		= $.format.date(new Date().getTime(), "yyyy-MM-ddThh:mm:ss");
			
			var xml 	=
	        ['<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://schemas.microsoft.com/2003/10/Serialization/" xmlns:heal="http://schemas.datacontract.org/2004/07/HealthCareAssistant" xmlns:hsim="http://schemas.datacontract.org/2004/07/HSIMessageExchange">',
	            '<soapenv:Header/>',
	            '<soapenv:Body>',
	                '<RetrieveMessages>',
	                    '<caregiverId>' + token + '</caregiverId>',
	                    '<messageFolder>',
	                        '<heal:m_IsDirty>false</heal:m_IsDirty>',
	                        '<heal:m_DefaultValue></heal:m_DefaultValue>',
	                        '<heal:m_FilterSet>false</heal:m_FilterSet>',
	                        '<heal:m_Key>'+type+'</heal:m_Key>',
	                        '<heal:m_SerializeList></heal:m_SerializeList>',
	                    '</messageFolder>',
	                    '<dateRange>',
	                        '<heal:m_IsDirty>false</heal:m_IsDirty>',
	                        '<heal:m_EndDate>',
	                            '<heal:m_IsDirty>false</heal:m_IsDirty>',
	                            '<heal:DateName></heal:DateName>',
	                            '<heal:DateStringFormat>YYYY-MM-DDThh:mm:ss</heal:DateStringFormat>',
	                            '<heal:InnerDate>'+end+'</heal:InnerDate>',
	                        '</heal:m_EndDate>',
	                        '<heal:m_StartDate>',
	                            '<heal:m_IsDirty>false</heal:m_IsDirty>',
	                            '<heal:DateName></heal:DateName>',
	                            '<heal:DateStringFormat>YYYY-MM-DDThh:mm:ss</heal:DateStringFormat>',
	                            '<heal:InnerDate>'+start+'</heal:InnerDate>',
	                        '</heal:m_StartDate>',
	                    '</dateRange>',
	                    '<unreadOnly>true</unreadOnly>',
	                '</RetrieveMessages>',
	            '</soapenv:Body>',
	        '</soapenv:Envelope>'
	        ];

	        _SOAP.post('RetrieveMessages', xml, function(soapResponse) { 
	        
	        	$('#pullDown').hide();
	        	$('#message-archive').show();
	        	$('#message-archive').css('margin-top', '0px');

	            var results 	= soapResponse.toString(); 
	            var json 		= $.xml2json(results);
	            var data 		= json['s:Envelope']['s:Body']['RetrieveMessagesResponse']['RetrieveMessagesResult']['a:MessagesResult']['b:MessageLabel'];
         		var page 		= $('ul.nav-stacked li.active a.left-navigation').attr('id');
         		var currentPage = $('.current-page').attr('id');
         		//get data
         		window.messageList[type] = _string.unlock(type);
         		
         		if(window.messageList[type] == null || window.messageList[type] == '') { 
									
					window.messageList[type] = [];
				}

         		//if there is a new message
         		if(typeof data !== 'undefined') { 
         			//if there is multiple data
         			if(typeof data === 'object' && typeof data[0] !== 'undefined') { 
         				
         				var count = 0;
         				
         				//now loop array in display data
		         		for(i in data) {
		         			var inListing = false;
		         			//check if unread message is already in the listing
		         			for(x in window.messageList[type]) {
		         				//mark flag is new message is already existing
		         				if(window.messageList[type][x]['b:MessageGUID'] == data[i]['b:MessageGUID']) {
		         					inListing = true;
		         				}
		         			}
			         		
			         		count++; 
			         		//if not in listing
		         			if(!inListing && type == 'Inbox') {
		         				 
		         				//push everything
		         				window.messageList[type].splice(0, 0, data[i]);
		         				
		         				//get unread count	
		         				var count = $('#'+type+' span.badge').html();
								
								//do the Math in the Message unread Count
				 				if(count != 0) {

				 					//do the math
				 					var plus = parseInt(count) + 1;
				 					//and display
				 					$('#'+type+' span.badge').html(plus);
				 					$('#folder-name').html($('#'+type).html());
				 					setBadge(plus);
				 					
				 				//else if count is zero
				 				} else {
				 					//just add one
				 					$('#'+type+' span.badge').html('1');
				 					//and display
				 					$('#folder-name').html($('#'+type).html());
				 					setBadge(1)
				 				
				 				}

				 				//lock and save
				 				_string.lock(window.messageList[type], type);
				 				
				 				if(page == 'Inbox' && currentPage == 'home') {
			     					
				         			window.messages.displayMessage(window.messageList[type], type, 10, 1);
				         		}

				 				//show only notification count if inside Inbox
		         				if(type == 'Inbox') {
		         					
		         					window.plugin.notification.local.add({ 
										message : '"'+data[i]['b:Subject']+'"',
										//message 	: '',
										title 		: 'New message received',
										autoCancel: true
									});

		         					notification('New message recieve');
			         				
		         					
		         				}
		         			}
		         		}	
		         			
         			} else {
         				
         				var inListing = false;
         				//check if unread message is already in the listing
	         			for(x in window.messageList[type]) { 
	         				
	         				//mark flag if new message is already existing
	         				if(window.messageList[type][x]['b:MessageGUID'] == data['b:MessageGUID']) {	
	         					inListing = true;
	         				} 

	         			}

	         			if(!inListing && type == 'Inbox') {

	         				window.messageList[type].splice(0, 0, data);
	         				//window.messageList[type].unshift(data);
	         				
	         				//get unread count	
	         				var count = $('#'+type+' span.badge').html();
 							
 							//do the Math in the Message unread Count
			 				if(count != 0) {
			 					//do the math
			 					var plus = parseInt(count) + 1;
			 					//and display
			 					$('#'+type+' span.badge').html(plus);
			 					$('#folder-name').html($('#'+type).html());
			 					setBadge(plus);
			 					
			 				//else if count is zero	
			 				} else {
			 					//just add one
			 					$('#'+type+' span.badge').html('1');
			 					//and display
			 					$('#folder-name').html($('#'+type).html());
			 					setBadge(1)
			 				
			 				}
			 				
			 				//lock and save
			 				_string.lock(window.messageList[type], type);
			 				
			 				if(page == 'Inbox' && currentPage == 'home') {
		     					
			         			window.messages.displayMessage(window.messageList[type], type, 10, 1);
			         		}

			         		//show only notification count if inside Inbox
			 				if(type == 'Inbox') {
	         					
	         					window.plugin.notification.local.add({ 
									message : '"'+data['b:Subject']+'"',
									title 		: 'New message received',
									autoCancel: true
								});

								notification('New message recieve');	
		         				
	         				}
	         			}
         			}
         		}

     			if(typeof window.iscroll !== 'undefined') {
					//Remember to refresh when contents are loaded (ie: on ajax completion)
					window.iscroll.refresh();		
     			}
	        });
		});
	},
	animateList : function(set, type) {
		
		//show only if in detail page
		$('#search-message').show();
		//point the search to the message type
		$('.form-search').attr('id', type);
		//empty out search input
		$('#search-queue').val('');
	
		//hide everything 1st
		$('.message-elem').hide();
		//then show specific page
		//$('#message-list').show();
		
		//icon set to the navbar
		$('#delete-message').hide();
		$('#compose-message').show();
		$('#undelete-message').hide();

		//hide loading
		mainLoader(set);

		return this;	
	}
};