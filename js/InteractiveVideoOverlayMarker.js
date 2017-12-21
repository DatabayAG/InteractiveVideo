il.InteractiveVideoOverlayMarker = (function (scope) {
	'use strict';

	var pub = {}, pro = {}, pri = {};

	pub.attachListener = function()
	{
		pro.attachSingleListener('btn_rect', 'rect_prototype');
		pro.attachSingleListener('btn_circle', 'circle_prototype');
	};

	function addScrollEventToDisableMarkerMovingOnScrolling(scrollBasisHeight) {
		$(document).off('scroll');
		$(document).on('scroll', function () {
			var scrollModificationHeigth = $(document).scrollTop();
			if (scrollModificationHeigth > scrollBasisHeight) {
				var new_height = scrollModificationHeigth - scrollBasisHeight;
				var new_top = parseInt(($('.interactive_marker').css('top')), 10) - new_height;
				scrollBasisHeight = scrollModificationHeigth;
				$('.interactive_marker').css('top', new_top);
			}
			else {
				var new_height = scrollBasisHeight - scrollModificationHeigth;
				var new_top = parseInt(($('.interactive_marker').css('top')), 10) + new_height;
				scrollBasisHeight = scrollModificationHeigth;
				$('.interactive_marker').css('top', new_top);
			}
			return scrollBasisHeight;
		});
	}

	pro.attachSingleListener = function(button_id, prototype_class)
	{
		$('#' + button_id).off('click');
		$('#' + button_id).click(function()
		{
			var id	= pro.getUniqueId();
			var svg = $('.' + prototype_class).clone()
				.attr({'id': id, 'class' : 'interactive_marker iv_svg_marker'})
				.insertBefore( '#ilInteractiveVideoPlayerContainer' );
			var overlay = $('#ilInteractiveVideoOverlay');
			var scrollBasisHeight = $(document).scrollTop();

			svg.removeClass('prototype')
			svg.width(overlay.width());
			svg.height(overlay.height());
			svg.draggable({
				stop: function( event, ui ) {
					var childPos = svg.offset();
					var parentPos = overlay.position();
					var childOffset = {
						top: childPos.top - parentPos.top,
						left: childPos.left - parentPos.left
					};
					var x = childOffset.left / (overlay.width() / 300);
					var y = childOffset.top / (overlay.height() / 150);

					svg.children().attr({'POS_X' : x , 'POS_Y' : y});
					console.log(x, y, childOffset);
				}
			});
			addScrollEventToDisableMarkerMovingOnScrolling(scrollBasisHeight);
		});
	};

	pro.getUniqueId = function()
	{
		return '_' + Math.random().toString(36).substr(2, 9);
	};

	pub.protect = pro;
	return pub;

}(il));