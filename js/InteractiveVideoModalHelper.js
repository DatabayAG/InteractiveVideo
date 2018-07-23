il.InteractiveVideoModalHelper = (function (scope) {
	'use strict';

	var pub = {}, pro = {};

	pub.getCommentAndMarkerForm = function()
	{
		pro.showWaitBox();
		$.when(
			$.ajax({
				url:  scope.InteractiveVideo.get_comment_marker_modal,
				type: 'GET', dataType: 'html'
			})
		).then(function (html) {
			$('#ilInteractiveVideoAjaxModal').find('.modal-body').html(html);
			il.InteractiveVideoPlayerAbstract.initPlayer();
			setTimeout(function(){
				plyr.get()[1].seek(plyr.get()[0].getCurrentTime());
			}, 900);
			setTimeout(function(){
				CKEDITOR.instances.comment_text.focusManager.focus();
				pro.addEventsToButtons('insertTutorCommentAjax', 'cancelCommentsAjax');
			}, 480);
			$('#ilInteractiveVideoAjaxModal').on('hidden.bs.modal', function () {
				$('#ilInteractiveVideoAjaxModal .ilInteractiveVideo').remove();
				il.InteractiveVideoOverlayMarker.checkForOverlay();
			})
		});
	};

	pub.getQuestionCreationForModal = function()
	{
		pro.showWaitBox();
		$.when(
			$.ajax({
				url:  scope.InteractiveVideo.get_question_creation_modal,
				type: 'GET', dataType: 'html'
			})
		).then(function (html) {
			$('#ilInteractiveVideoAjaxModal').find('.modal-body').html(html);
			setTimeout(function(){
				pro.addEventsToButtons('insertQuestionAjax', 'editCommentsAjax');
			}, 380);
			InteractiveVideoQuestionCreator.Init();
		});
	};

	pro.showWaitBox = function()
	{
		il.InteractiveVideoPlayerAbstract.pause();
		var modal = $('#ilInteractiveVideoAjaxModal');
		modal.modal({backdrop: 'static', keyboard: false}, 'show');
		modal.find('.modal-body').html('<div class="waitbox"></div>');
	};

	pro.addEventsToButtons = function(btn_one, btn_two)
	{
		pro.applyEventToButton(btn_one);
		pro.applyEventToButton(btn_two);
	};

	pro.applyEventToButton = function(button){
		$('[name=cmd\\[' + button + '\\]]').on('click', function(){
			var time = parseInt(plyr.get()[0].getCurrentTime(), 10);
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