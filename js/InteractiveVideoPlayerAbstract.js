il.InteractiveVideoPlayerAbstract = (function (scope) {
	'use strict';

	var pub = {}, pro = {
		onReadyCallbacks : []
	};
	
	pub.config = {
		pauseCallback              : null,
		playCallback               : null,
		durationCallback           : null,
		currentTimeCallback        : null,
		setCurrentTimeCallback     : null,
		readyCallback              : null,
		removeNonAdventureElements : null,
		initPlayerCallback         : null
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
		time = parseInt(time, 10);
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

	pub.readyCallback = function ()
	{
		if(il.InteractiveVideo.tutor_mode == 'true' || il.InteractiveVideo.tutor_mode == '1')
		{
			if($('#ilInteractiveVideoTutorCommentSubmit').size() === 0 && $('#ilInteractiveVideoTutorQuestionSubmit').size() === 0)
			{
				$( '#ilInteractiveVideo').parent().attr('class', 'col-sm-6');
			}
		}

		$.each(pro.onReadyCallbacks, function( index, value ) {
			if (typeof value === 'function') {
				value();
			}
		});

		pro.checkForResumeValue();
	};

	pub.addOnReadyFunction = function(callback)
	{
		pro.onReadyCallbacks.push(callback);
	};

	pub.initPlayer = function()
	{
		if (typeof pub.config.initPlayerCallback === 'function') {
			pub.config.initPlayerCallback();
		}
	};

	pro.checkForResumeValue = function(){
		setTimeout(function(){
			var ref_id = parseInt(il.InteractiveVideo.interactive_video_ref_id, 10);
			var key = "InteractiveVideoResumeTime_" + ref_id;
			if (typeof(Storage) !== "undefined") {
				var time = parseInt(sessionStorage.getItem(key), 10);
				if(time > 0){
					il.InteractiveVideoPlayerAbstract.setCurrentTime(time);
					sessionStorage.removeItem(key);
				}
			}
		}, 250);
	};

	pub.protect = pro;
	return pub;

}(il));