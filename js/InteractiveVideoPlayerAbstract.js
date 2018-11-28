il.InteractiveVideoPlayerAbstract = (function (scope) {
	'use strict';

	//Todo: make question object a object by player id
	//Done: Questions working
	//Done: Comments working
	//Player object exists by id
	var pub = {}, pro = {};

	pub.config = {
		pauseCallback           : null,
		playCallback            : null,
		durationCallback        : null,
		currentTimeCallback     : null,
		setCurrentTimeCallback  : null
	}; 

	//Todo fix this
	pro.first_play_action = true;

	pub.pause = function(player_id)
	{
		if (typeof pub.config[player_id].pauseCallback === 'function') {
			pub.config[player_id].pauseCallback();
		}
	};

	pub.play = function(player_id)
	{
		if (pro.first_play_action) {
			pro.first_play_action = false;
			il.InteractiveVideoPlayerFunction.triggerVideoStarted(player_id);
		}

		if (typeof pub.config[player_id].playCallback === 'function') {
			pub.config[player_id].playCallback();
		}
	};

	pub.duration = function(player_id)
	{
		let value = -1;

		if (typeof pub.config[player_id].durationCallback === 'function') {
			value = pub.config[player_id].durationCallback();
		}
		return value;
	};

	pub.currentTime = function(player_id)
	{
		let value = -1;

		if (typeof pub.config[player_id].currentTimeCallback === 'function') {
			value = pub.config[player_id].currentTimeCallback();
		}
		return value;
	};

	pub.setCurrentTime = function(time, player_id)
	{
		if (typeof pub.config[player_id].setCurrentTimeCallback === 'function') {
			pub.config[player_id].setCurrentTimeCallback(time);
		}
	};

	pub.jumpToTimeInVideo = function (time, player_id)
	{
		pub.play(player_id);
		pub.pause(player_id);
		if(time !== null)
		{
			pub.setCurrentTime(time, player_id);
			scope.InteractiveVideoPlayerFunction.getPlayerDataObjectByPlayerId(player_id).last_stopPoint = time;
		}
		pub.resumeVideo(player_id);
	};

	pub.resumeVideo = function (player_id)
	{
		if(scope.InteractiveVideoPlayerFunction.getPlayerDataObjectByPlayerId(player_id).auto_resume === true)
		{
			pub.play(player_id);
		}
	};

	pub.videoFinished = function(player_id)
	{
		il.InteractiveVideoPlayerFunction.triggerVideoFinished(player_id);

		if(il.InteractiveVideoPlayerFunction.doesReferencePointExists())
		{
			il.InteractiveVideoPlayerFunction.finishAndReturnToReferencePoint();
		}
	};

	pub.protect = pro;
	return pub;

}(il));