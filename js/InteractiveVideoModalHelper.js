il.InteractiveVideoModalHelper = (function (scope) {
	'use strict';

	var pub = {}, pro = {};

	pub.getCommentAndMarkerForm = function()
	{
		$.when(
			$.ajax({
				url:  scope.InteractiveVideo.get_comment_marker_modal,
				type: 'GET', dataType: 'html'
			})
		).then(function (html) {
			$('#ilInteractiveVideoAjaxModal').find('.modal-body').html(html);
			$('#ilInteractiveVideoAjaxModal').modal('show');
			il.InteractiveVideoYoutubePlayer.initPlayer();
			$('#add_marker_chk').change(function() {
				if($(this).is(':checked'))
				{
					$('.add_marker_selector').show( 'fast' );
					il.InteractiveVideoOverlayMarker.attachListener();
				}
				else
				{
					$('.add_marker_selector').hide( 'fast' );
					il.InteractiveVideoOverlayMarker.resetForm();
				}
			});
		});
	};

	pub.protect = pro;
	return pub;

}(il));