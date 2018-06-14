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
			}, 250);
			setTimeout(function(){
				CKEDITOR.instances.comment_text.focusManager.focus();
			}, 380);
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
			InteractiveVideoQuestionCreator.Init();
		});
	};

	pro.showWaitBox = function()
	{
		il.InteractiveVideoPlayerAbstract.pause();
		var modal = $('#ilInteractiveVideoAjaxModal');
		modal.modal('show');
		modal.find('.modal-body').html('<div class="waitbox"></div>');
	};

	pub.protect = pro;
	return pub;

}(il));