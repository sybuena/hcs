function setBadge(count) {
	if(typeof window.plugin !== 'undefined') {
		window.plugin.notification.badge.set(count);
	}
	
	var type 	= $('ul.nav-stacked li.active a.left-navigation').attr('id');
	
	if(type == 'Inbox') {
		$('#'+type+' span.badge').html(count);
	    $('#folder-name').html($('a#'+type).html());
	}
}