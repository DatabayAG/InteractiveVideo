il.InteractiveVideoOverlayMarker = (function (scope) {
	'use strict';

	var pub = {
		actual_id : null
	}, pro = {}, pri = {};

	pub.attachListener = function()
	{
		pro.attachSingleObjectListener('btn_rect', 'rect_prototype');
		pro.attachSingleObjectListener('btn_circle', 'circle_prototype');
		pro.attachSingleObjectListener('btn_arrow', 'arrow_prototype');
		pro.attachStyleEvents();
	};

	pro.attachStyleEvents = function()
	{
		$("#width_changer").on("input change", function() {
			$('#' + pub.actual_id).children().attr('width', $(this).val())
		});

		$("#height_changer").on("input change", function() {
			$('#' + pub.actual_id).children().attr('height', $(this).val())
		});

		$("#color_picker").on("input change", function() {
			var obj = $('#' + pub.actual_id);
			pro.readStyleFromElement(obj);
			obj.data('stroke_color', $(this).val());
			pro.applyStyleToElement(obj);
		});

		$("#stroke_picker").on("input change", function() {
			var obj = $('#' + pub.actual_id);
			pro.readStyleFromElement(obj);
			obj.data('stroke_size', $(this).val());
			pro.applyStyleToElement(obj);
		});
	};

	pro.applyStyleToElement = function(obj)
	{
		var style = '';

		if(obj.children().is('rect'))
		{
			style += pro.buildStrokeStyle(obj);
			style += pro.buildStyleForRect(obj);
			obj.children().attr('style', style)
		}
		else if(obj.children().is('circle'))
		{
			style += pro.buildStrokeStyle(obj);
			style += pro.buildStyleForCircle(obj);
			obj.children().attr('style', style)
		}
		else if(obj.children().is('path'))
		{
			pro.buildFillStyleForPath(obj);
		}
	};

	pro.readStyleFromElement = function(obj)
	{
		if(obj.children().is('rect'))
		{
			pro.readStrokeStyle(obj);
		}
		else if(obj.children().is('circle'))
		{
			pro.readStrokeStyle(obj);
		}

		else if(obj.children().is('path'))
		{
			pro.readFillStyle(obj);
		}
	};

	pro.readFillStyle = function(obj)
	{
		var fill_color = obj.children().attr('fill');

		if(typeof fill_color === "undefined")
		{
			fill_color = '#FF0000';
		}

		obj.data('stroke_color', fill_color);
	};

	pro.readStrokeStyle = function(obj)
	{
		var stroke_color = obj.children().css('stroke');
		var stroke_size  = obj.children().css('stroke-width');

		if(typeof stroke_size === "undefined")
		{
			stroke_size = 2;
		}
		if(typeof stroke_color === "undefined")
		{
			stroke_color = '#FF0000';
		}

		obj.data('stroke_color', stroke_color);
		obj.data('stroke_size', stroke_size);
	};


	pro.buildStrokeStyle = function(obj)
	{
		var stroke_color = obj.data('stroke_color');
		var stroke_size  = obj.data('stroke_size');
		return "fill:none;stroke-width:" + stroke_size + ";stroke:" + stroke_color;
	};

	pro.buildFillStyleForPath = function(obj)
	{
		var fill_color = obj.data('stroke_color');
		obj.children().attr('fill', fill_color);
	};

	pro.buildStyleForRect = function(obj)
	{
		return '';
	};

	pro.buildStyleForCircle = function(obj)
	{
		return '';
	};

	 pro.addScrollEventToDisableMarkerMovingOnScrolling = function(scrollBasisHeight) {
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
	 };

	pro.attachSingleObjectListener = function(button_id, prototype_class)
	{
		$('#' + button_id).off('click');
		$('#' + button_id).click(function()
		{
			if( ! pub.stillEditingSvg())
			{
				var id	= pro.getUniqueId();
				var svg = $('.' + prototype_class).clone()
					.attr({'id': id, 'class' : 'interactive_marker iv_svg_marker'})
					.prependTo( '#ilInteractiveVideoPlayerContainer' );
				var overlay = $('#ilInteractiveVideoPlayerContainer');
				var scrollBasisHeight = $(document).scrollTop();

				svg.removeClass('prototype');
				svg.width(overlay.width());
				svg.height(overlay.height());
				svg.draggable({
					stop: function( event, ui ) {
						var childPos = svg.offset();
						var parentPos = overlay.offset();
						console.log(parentPos, childPos)
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
				pro.addScrollEventToDisableMarkerMovingOnScrolling(scrollBasisHeight);
			}
		});
	};

	pro.getUniqueId = function()
	{
		var unique_id = '_' + Math.random().toString(36).substr(2, 9);
		console.log(unique_id)
		pub.actual_id = unique_id;
		return unique_id;
	};

	pub.stillEditingSvg = function()
	{
		if(pub.actual_id === null)
		{
			return false;
		}
		else if($('#' + pub.actual_id).length > 0)
		{
			return true;
		}
		else if($('#' + pub.actual_id).length === 0)
		{
			pub.actual_id = null;
			return false;
		}
	};

	pub.protect = pro;
	return pub;

}(il));