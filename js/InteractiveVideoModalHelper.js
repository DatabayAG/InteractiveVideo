il.InteractiveVideoModalHelper = (function (scope) {
	'use strict';

	var pub = {}, pro = {};

	pub.getCommentAndMarkerForm = function(player_id)
	{
		pro.showWaitBox(player_id);
		$.when(
			$.ajax({
				url:  scope.InteractiveVideo[player_id].get_comment_marker_modal,
				type: 'GET', dataType: 'html'
			})
		).then(function (html) {
			$('#' + player_id).remove();
			$('.iv_metadata').remove();
			$('#ilInteractiveVideoAjaxModal').find('.modal-body').html(html);
			il.InteractiveVideoPlayerAbstract.initPlayer(player_id);
			il.InteractiveVideoOverlayMarker.checkForOverlay()
			$('#ilInteractiveVideoOverlay').before('<div class="play_overlay_jump_to_time" id="play_overlay_jump_to_time"><div class="play_overlay_jump_to_time_text">'+il.InteractiveVideo.lang.jump_to_text+'</div></div>');
			$('.play_overlay_jump_to_time').on('click', function(){
				il.InteractiveVideoOverlayMarker.jumpToTimeAndRemoveOverlay()
			});
			il.InteractiveVideoOverlayMarker.attachListener();
			setTimeout(function(){
				let time = scope.InteractiveVideoPlayerAbstract.currentTime(player_id);
				time = scope.InteractiveVideoPlayerComments.secondsToTimeCode(time);
				$('#comment_time').timepicker('setTime', time);
			}, 200);
			setTimeout(function(){
				//CKEDITOR.instances.comment_text.focusManager.focus();
				pro.addEventsToButtons('insertTutorCommentAjax', 'cancelCommentsAjax');
			}, 480);
			$('#ilInteractiveVideoAjaxModal').on('hidden.bs.modal', function () {
				$('#ilInteractiveVideoAjaxModal .ilInteractiveVideo').remove();
				il.InteractiveVideoOverlayMarker.checkForOverlay();
			})
		});
	};

	pub.getChapterForm = function(player_id)
	{
		pro.showWaitBox(player_id);
		$.when(
			$.ajax({
				url:  scope.InteractiveVideo[player_id].get_chapter_modal,
				type: 'GET', dataType: 'html'
			})
		).then(function (html) {
			$('#ilInteractiveVideoAjaxModal').find('.modal-body').html(html);
			il.InteractiveVideoPlayerAbstract.initPlayer(player_id);
			il.InteractiveVideoOverlayMarker.checkForOverlay()
			il.InteractiveVideoOverlayMarker.attachListener();
			setTimeout(function(){
				let time = scope.InteractiveVideoPlayerAbstract.currentTime(player_id);
				time = scope.InteractiveVideoPlayerComments.secondsToTimeCode(time);
				$('#comment_time').timepicker('setTime', time);
			}, 200);
			setTimeout(function(){
				//CKEDITOR.instances.comment_text.focusManager.focus();
				pro.addEventsToButtons('insertTutorCommentAjax', 'cancelCommentsAjax');
			}, 480);
			$('#ilInteractiveVideoAjaxModal').on('hidden.bs.modal', function () {
				$('#ilInteractiveVideoAjaxModal .ilInteractiveVideo').remove();
				il.InteractiveVideoOverlayMarker.checkForOverlay();
			})
		});
	};

	pub.getQuestionCreationForModal = function(player_id)
	{
		pro.showWaitBox(player_id);
		$.when(
			$.ajax({
				url:  scope.InteractiveVideo[player_id].get_question_creation_modal,
				type: 'GET', dataType: 'html'
			})
		).then(function (html) {
			$('#ilInteractiveVideoAjaxModal').find('.modal-body').html(html);
			setTimeout(function(){
				pro.addEventsToButtons('insertQuestionAjax', 'editCommentsAjax');
			}, 380);
			setTimeout(function(){
				$('#comment_time').val(
					il.InteractiveVideoPlayerComments.secondsToTimeCode(scope.InteractiveVideo[player_id].player.currentTime));
			}, 400);
			InteractiveVideoQuestionCreator.Init();
		});
	};

	pro.showWaitBox = function(player_id)
	{
		il.InteractiveVideoPlayerAbstract.pause(player_id)
		var modal = $('#ilInteractiveVideoAjaxModal');
		modal.modal({backdrop: 'static', keyboard: false}, 'show');
		modal.find('.modal-body').html('<div class="waitbox"></div>');
		modal.find('.modal-header .close').remove();
	};

	pro.addEventsToButtons = function(btn_one, btn_two)
	{
		pro.applyEventToButton(btn_one);
		pro.applyEventToButton(btn_two);
	};

	pro.applyEventToButton = function(button){
		$('[name=cmd\\[' + button + '\\]]').on('click', function(){
			var time = parseInt(plyr.get()[0].currentTime(), 10);
			var ref_id = parseInt(il.InteractiveVideo.interactive_video_ref_id, 10);
			if(time > 0 && ref_id > 0)
			{
				if (typeof(Storage) !== "undefined") {
					sessionStorage.setItem("InteractiveVideoResumeTime_" + ref_id, time + "");
				}
			}
		});
	};

	pub.protect = pro;
	return pub;

}(il));