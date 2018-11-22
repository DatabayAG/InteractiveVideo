il.InteractiveVideoPlayerAbstract = (function (scope) {
	'use strict';

	var pub = {}, pro = {};
	
	pub.config = {
		pauseCallback           : null,
		playCallback            : null,
		durationCallback        : null,
		currentTimeCallback     : null,
		setCurrentTimeCallback  : null
	}; 

	pro.first_play_action = true;

	pub.pause = function(player)
	{
		if (typeof pub.config.pauseCallback === 'function') {
			pub.config.pauseCallback();
		}
	};

	pub.play = function(player)
	{
		if (pro.first_play_action) {
			pro.first_play_action = false;
			il.InteractiveVideoPlayerFunction.triggerVideoStarted(player);
		}

		if (typeof pub.config.playCallback === 'function') {
			pub.config.playCallback();
		}
	};

	pub.duration = function(player)
	{
		var value = -1;
		if (typeof pub.config.durationCallback === 'function') {
			value = pub.config.durationCallback();
		}
		return value;
	};

	pub.currentTime = function(player)
	{
		var value = -1;
		if (typeof pub.config.currentTimeCallback === 'function') {
			value = pub.config.currentTimeCallback();
		}
		return value;
	};

	pub.setCurrentTime = function(time, player)
	{
		if (typeof pub.config.setCurrentTimeCallback === 'function') {
			pub.config.setCurrentTimeCallback(time);
		}
	};

	pub.jumpToTimeInVideo = function (time, player)
	{
		pub.play();
		pub.pause();
		if(time !== null)
		{
			pub.setCurrentTime(time);
			scope.InteractiveVideoPlayerFunction.getPlayerIdFromPlayerObject(player).last_stopPoint = time;
		}
		pub.resumeVideo();
	};

	pub.resumeVideo = function (player)
	{
		if(scope.InteractiveVideoPlayerFunction.getPlayerIdFromPlayerObject(player).auto_resume === true)
		{
			pub.play();
		}
	};

	pub.videoFinished = function(player)
	{
		il.InteractiveVideoPlayerFunction.triggerVideoFinished();

		if(il.InteractiveVideoPlayerFunction.doesReferencePointExists())
		{
			il.InteractiveVideoPlayerFunction.finishAndReturnToReferencePoint();
		}
	};

	pub.protect = pro;
	return pub;

}(il));