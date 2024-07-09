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
		if (player_config.first_play_action && scope.InteractiveVideo[player_id].edit_mode === false) {
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
		pro.jumpToTimeInVideoAction(time, player_id);
		pub.play(player_id);
	};

	pub.jumpToTimeInVideoEditScreen = function (time, player_id)
	{
		il.InteractiveVideo[player_id].edit_mode = true;
		pro.jumpToTimeInVideoAction(time, player_id);
	};

	pro.jumpToTimeInVideoAction = function (time, player_id)
	{
		if(typeof player_id === "object") {
			player_id = $(player_id).attr('id');
		}
		if(il.InteractiveVideo[player_id].player_type === 'ytb') {
			pub.play(player_id);
			pub.pause(player_id);
		} else {
			pub.pause(player_id);
		}

		time = parseInt(time, 10);
		if(time !== null)
		{
			il.InteractiveVideoPlayerResume.saveExternalResumeTime(player_id, time);
			pub.setCurrentTime(time, player_id);
			scope.InteractiveVideoPlayerFunction.getPlayerDataObjectByPlayerId(player_id).last_stopPoint = time;
		}
	}

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

	pub.readyCallback = function (player_id, prependElement)
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

		pro.moveMarkerOverlayIntoPlayer(player_id, prependElement);
	};

	pub.addOnReadyFunction = function(callback)
	{
		pro.onReadyCallbacks.push(callback);
	};

	pub.initPlayer = function(player_id)
	{
		if (typeof pub.config[player_id].initPlayerCallback === 'function') {
			pub.config[player_id].initPlayerCallback();
		}
	};

	pub.isFullScreen = function(player_id){
		return document.fullscreenElement !== null
	}

	pub.exitFullScreen = function(player_id){
		document.exitFullscreen();
	}

	pro.moveMarkerOverlayIntoPlayer = function(player_id, prependElement) {
		if($('#ilInteractiveVideoAjaxModal').css('display') === 'none') {
			$("#ilInteractiveVideoOverlay").prependTo($(prependElement).parent('.plyr__video-wrapper'));
		}
	}

	pub.protect = pro;
	return pub;

}(il));