il.InteractiveVideoPlayerAbstract = (function () {
	'use strict';

	var pub = {}, pro = {}, pri = {};
	
	pub.config = {
		pauseCallback           : null,
		playCallback            : null,
		durationCallback        : null,
		currentTimeCallback     : null,
		setCurrentTimeCallback  : null
	}; 

	pub.pause = function()
	{
		if (typeof pub.config.pauseCallback === 'function') {
			pub.config.pauseCallback();
		}
	};

	pub.play = function()
	{
		if (typeof pub.config.playCallback === 'function') {
			pub.config.playCallback();
		}
	};

	pub.duration = function()
	{
		if (typeof pub.config.durationCallback === 'function') {
			return pub.config.durationCallback();
		}
	};

	pub.currentTime = function()
	{
		if (typeof pub.config.currentTimeCallback === 'function') {
			return pub.config.currentTimeCallback();
		}
	};

	pub.setCurrentTime = function(time)
	{
		if (typeof pub.config.setCurrentTimeCallback === 'function') {
			return pub.config.setCurrentTimeCallback(time);
		}
	};

	pub.protect = pro;
	return pub;

}());