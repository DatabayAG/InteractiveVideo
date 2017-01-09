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

	pub.pause = function()
	{
		if (typeof pub.config.pauseCallback === 'function') {
			pub.config.pauseCallback();
		}
	};

	pub.play = function()
	{
		if (pro.first_play_action) {
			pro.first_play_action = false;
			il.InteractiveVideoPlayerFunction.triggerVideoStarted();
			console.log("Played, and server event triggered");
		} else {
			console.log("Played, but not server event triggered");
		}

		if (typeof pub.config.playCallback === 'function') {
			pub.config.playCallback();
		}
	};

	pub.duration = function()
	{
		var value = -1;
		if (typeof pub.config.durationCallback === 'function') {
			value = pub.config.durationCallback();
		}
		return value;
	};

	pub.currentTime = function()
	{
		var value = -1;
		if (typeof pub.config.currentTimeCallback === 'function') {
			value = pub.config.currentTimeCallback();
		}
		return value;
	};

	pub.setCurrentTime = function(time)
	{
		if (typeof pub.config.setCurrentTimeCallback === 'function') {
			pub.config.setCurrentTimeCallback(time);
		}
	};

	pub.jumpToTimeInVideo = function (time)
	{
		pub.play();
		pub.pause();
		if(time !== null)
		{
			pub.setCurrentTime(time);
			scope.InteractiveVideo.last_stopPoint = time;
		}
		pub.resumeVideo();
	};

	pub.resumeVideo = function ()
	{
		if(scope.InteractiveVideo.auto_resume === true)
		{
			pub.play();
		}
	};

	pub.videoFinished = function()
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