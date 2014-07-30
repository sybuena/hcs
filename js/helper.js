function setBadge(count) {
	if(typeof window.plugin !== 'undefined') {
		window.plugin.notification.badge.set(count);
	}
}