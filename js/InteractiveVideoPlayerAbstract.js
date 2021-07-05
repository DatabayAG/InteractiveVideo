il.InteractiveVideoPlayerAbstract = (function (scope) {
	'use strict';

	//Todo: make question object a object by player id
	//Done: Questions working
	//Done: Comments working
	//Player object exists by id
	let pub = {}, pro = {
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

	pub.pause = function(player_id)
	{
		if (typeof pub.config[player_id].pauseCallback === 'function') {
			pub.config[player_id].pauseCallback();
		}
	};

	pub.play = function(player_id)
	{
		let player_config = scope.InteractiveVideoPlayerFunction.getPlayerDataObjectByPlayerId(player_id);
		if (player_config.first_play_action) {
			player_config.first_play_action = false;
			il.InteractiveVideoPlayerResume.checkForResumeValue(player_id);
			il.InteractiveVideoPlayerFunction.triggerVideoStarted(player_id);
		}

		pro.disableAllOtherInstances(player_id);

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
		if(typeof player_id === "object") {
			player_id = $(player_id).attr('id');
		}
		pub.play(player_id);
		pub.pause(player_id);
		time = parseInt(time, 10);;
		if(time !== null)
		{
			il.InteractiveVideoPlayerResume.saveExternalResumeTime(player_id, time);
			pub.setCurrentTime(time, player_id);
			scope.InteractiveVideoPlayerFunction.getPlayerDataObjectByPlayerId(player_id).last_stopPoint = time;
		}
		pub.play(player_id);
	};

	pub.resumeVideo = function (player_id)
	{
		if(scope.InteractiveVideoPlayerFunction.getPlayerDataObjectByPlayerId(player_id).auto_resume === true ||
				scope.InteractiveVideoPlayerFunction.getPlayerDataObjectByPlayerId(player_id).auto_resume === "1")
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

	pro.disableAllOtherInstances = function(player_id)
	{
		$.each(pub.config, function (instance_id, player) {
			if(instance_id.indexOf('iv_') !== -1){
				if(player_id !== instance_id) {
					player.pauseCallback();
				}
			}
		});
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