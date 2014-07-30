var NO_CONNECTION = 
	' <div class="empty-messages"><div class="icon-holder"><i class="fa fa-warning fa-5x"></i>'+
	'<p class="event loading">No internet connection</p></div></div>';   

var User = function() {};

User.prototype = {
	/**
	 * Get login user information from 
	 * local storage
	 * 
	 */
	get 	: function() {
		//unlock it!!
		window.users = _string.unlock('loginUser');		
    	
    	return window.users;
    },
    /**
     * Login handler, this dude handle all the login and 
     * getting all the login user information
     * 
     *
     */
    login 	: function() {
    	//show login form
    	$('#login').show();	
    	
    	//on click login button
		$('#login-button').click(function() {

			//add loading screen in button
			$('#loading-login').show();
			$('.loading-circle').show();

			$('#login-content').hide();
			$('.login-error').hide();
			$('#setting-page').hide();
			$('.login-error').html('Logging in...');
			
			//prepare variables
			var username 	= $('input[name="username"]').val();
			var password 	= $('input[name="password"]').val();
			var error 		= false;

			//string length
			if(username.length == 0) {
				error = true;
				$('.login-error').html('Username cannot be empty');
			} 
			//string length
			if(password.length == 0) {
				error = true;
				$('.login-error').html('Password cannot be empty');
			}

			//if no internet
			if(!window.connection) {
					error = true;
				$('.login-error').html('No Internet Connection');
				
			}

			//if there is an error in fields
			if(error == true) {
				
				
				$('#login-content').show();
				$('#loading-login').hide();
				$('.loading-circle').hide();

				$('.login-error').show();
				$('#setting-page').show();
				//stay on page
				return false;

			} else {
				
				var data = {
		            userName 	: _string.encrypt(username), //useless paramater
		            password 	: _string.encrypt(password), //useless paramater
		            portal 		: PORTAL,
		            caregiverID : _string.encrypt(username), // the REAL user name SYNERGY
		            timeStamp	: _string.encrypt(password)  // the REAL password 4CAREGIVER
		        };

		        //save and encryt it to local storage
		        window.username = _string.encrypt(username);
		        window.password = _string.encrypt(password);

		        //save the encrypted username and password to the local storage
		        localStorage.setItem('username', window.username);
		        localStorage.setItem('password', window.password);

		        var method = 'LoginCaregiverPortal';

				$.soap({
			        url 				: SOAP_URL,
			        method 				: method,
			        SOAPAction 			: 'urn:CaregiverPortalService/'+method,
			        data 				: data,
			        appendMethodToURL	: false,
			        success				: function (soapResponse) {

			        	//format XML as STRING
			            var results 	= soapResponse.toString();
			            //STRING to JSON	
			            var json 		= $.xml2json(results);
           	 			var response 	=  json['s:Envelope']['s:Body'][method+'Response'][method+'Result'];
           	 			
           	 			//if there is an error
           	 			if(response['a:HasError'] == 'true') {
           	 				//throw error message to the UI
							$('#loading-login').hide();
							$('.loading-circle').hide();
							$('#login-content').show();
							$('.login-error').html(response['a:Error']);
							$('.login-error').show();
							$('#setting-page').show();
						
           	 				return false;
           	 			}

           	 			//find needle in haystack
			            var xmlDoc 	= $.parseXML(soapResponse.toString());
			            var xml 	= $(xmlDoc);
			            
			            //parse xml response for better json format
			            var loginUser  = {
			            	'token' 		: xml.find('Token').text(),
			            	'name' 			: xml.find('AgencyFullName').text(),
			            	'AgencyCode' 	: xml.find('AgencyCode').text(),
			            	'ID'			: {
			            		'm_GUID' 	: xml.find('m_GUID').text(),
			            		'm_ID' 		: xml.find('m_ID').text(),
			            	}
			            }

			            //add token 
			            loginUser['caregiverID'] = _string.encrypt(username);
			            this.user = loginUser;
						
						//after making successfull login
						//get login user information
						//because LoginCaregiverPortal function 
						//is aa pain, it never return any usefull
						//information
						window.user.getSender(loginUser);
			            
			        },
			        error 			: function (SOAPResponse) {
			            
			        	$('#loading-login').hide();
						$('#login-content').show();
						$('.login-error').html('Internal Server Error');
			        }
			    });
			}
		});
    },
    /**
     * Get login user information and contact list by making compose request
     * and getting the sender information as login user
     * information
     * 
     * @param object
     *
     */ 
    getSender : function(loginUser) {

    	//use the token from the previous login
    	var xml = 
    	[	'<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://schemas.microsoft.com/2003/10/Serialization/" xmlns:heal="http://schemas.datacontract.org/2004/07/HealthCareAssistant" xmlns:hsi="http://schemas.datacontract.org/2004/07/HSIAccess" xmlns:hsim="http://schemas.datacontract.org/2004/07/HSIMessageExchange">'+
			   '<soapenv:Header/>'+
			   '<soapenv:Body>'+
			      '<Compose>'+
			         '<caregiverId>'+loginUser.token+'</caregiverId>'+
			      '</Compose>'+
			   '</soapenv:Body>'+
			'</soapenv:Envelope>'
    	];
    	
    	//do compose soap call
    	$.soap({
	        url 				: SOAP_URL,
	        method 				: 'Compose',
	        SOAPAction 			: 'urn:CaregiverPortalService/Compose',
	        data 				: xml.join(''),
	        appendMethodToURL	: false,
	        success				: function (soapResponse) {

	            var results 	= soapResponse.toString();	
	            var json 		= $.xml2json(results);
   	 			var response 	= json['s:Envelope']['s:Body']['ComposeResponse']['ComposeResult']['a:MessageResult'];
   	 			var data 		= response['b:Label']['b:Sender'];
   	 			var raw 		= json['s:Envelope']['s:Body']['ComposeResponse']['ComposeResult']['a:Members']['b:Member'];
   	 			var contactList = [];

   	 			//get contact list of the sender
   	 			for(i in raw) {
			  		//parse it for better format
			  		contact = {
			  			'name' 			: raw[i]['b:Name']['c:m_firstName']+' '+raw[i]['b:Name']['c:m_lastName'],
			  			'first_name' 	: raw[i]['b:Name']['c:m_firstName'],
			  			'last_name' 	: raw[i]['b:Name']['c:m_lastName'],
			  			'data' 			: raw[i]
			  		}
			  		//push, push, push
			  		contactList.push(contact);
			  	}
			  	
			  	//sort by name
			  	contactList.sort(function(a, b){
				 	var nameA = a.name.toLowerCase();
				 	var	nameB = b.name.toLowerCase();
				 	
				 	if (nameA < nameB) //sort string ascending
				  		return -1 
				 	
				 	if (nameA > nameB)
				  		return 1
				 	return 0 //default return value (no sorting)
				})

			  	//lock and save data to local storage
			  	_string.lock(contactList, 'contactList');
			  	//save to global variable
  				window.contactList = contactList;

   	 			loginUser['sender'] = data;

   	 			//save the login user information
   	 			window.user.set(loginUser);   

	            //run again
	            bind();	 			
   	 			
	        },
	        error 			: function (SOAPResponse) {
	           
	        }
	    });
		
    },
    /**
     * This function call every time making SOAP call
     * to get new token (relogin user with username and
     * password). When ever getToken SOAP call is success
     * it will get the new token and make SOAP call 
     *
     * @param string encrypted username
     * @param string encrypted password
     * @param string success callback of soap calll
     *
     */
    getToken : function(username, password, callback) {
    	//check connection always first before making
    	//any SOAP call
    	checkConnection();

    	//prepare variables
    	var data = {
	        userName 	: username, //nonsense parameters :-(
	        password 	: password,	//nonsense parameters :-(
	        portal 		: PORTAL,
	        caregiverID : username, // the REAL user name SYNERGY
	        timeStamp	: password  // the REAL password 4CAREGIVER
	    };
	    
	    //do ajax call
		$.soap({
	        url 				: SOAP_URL,
	        method 				: 'LoginCaregiverPortal',
	        SOAPAction 			: 'urn:CaregiverPortalService/LoginCaregiverPortal',
	        data 				: data,
	        appendMethodToURL	: false,
	        namespaceQualifier	: NAME_SPACE_QUALIFIER,                     
	        namespaceURL		: NAME_SPACE_URL,    
	        noPrefix			: true,
	        //success callback will be coming to parameters
	        success				: callback,
	        error 				: function (SOAPResponse) {
	        	
	        }
	    });
						
    },
    /**
     * Save and lock the user information to the 
     * local storage
     * 
     * @param object|array
     */
    set 	: function(object) {
    	//lock and save
    	_string.lock(object, 'loginUser');

    	return window.users = object;
    }
}




