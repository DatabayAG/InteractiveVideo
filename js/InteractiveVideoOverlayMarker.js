il.InteractiveVideoOverlayMarker = (function (scope) {
	'use strict';

	var pub = {
		actual_id : null
	}, pro = {}, pri = {
		'rect_prototype' : [
			'iv_mk_scale'
		],
		'circle_prototype' : [
			'iv_mk_width',
			'iv_mk_height',
			'iv_mk_rotate'
		],
		'arrow_prototype' : [
			'iv_mk_width',
			'iv_mk_height'
		],
		'line_prototype' : [
			'iv_mk_width',
			'iv_mk_height',
			'iv_mk_scale'
		]
	};

	pub.attachListener = function()
	{
		pro.attachSingleObjectListener('btn_rect', 'rect_prototype');
		pro.attachSingleObjectListener('btn_circle', 'circle_prototype');
		pro.attachSingleObjectListener('btn_arrow', 'arrow_prototype');
		pro.attachSingleObjectListener('btn_line', 'line_prototype');
		pro.attachStyleEvents();
		pro.attachSubmitCancelListener();
	};

	pub.checkForEditScreen = function()
	{
		var obj = $('#fake_marker');
		if(obj.length >= 1)
		{
			if(obj.val().length > 0)
			{

				il.InteractiveVideoPlayerAbstract.addOnReadyFunction(
					(function ()
						{
							if(il.InteractiveVideoPlayerAbstract.config.external === false)
							{
								var sec = il.InteractiveVideoPlayerFunction.getSecondsFromTime($('#comment_time').val());
								il.InteractiveVideoPlayerAbstract.jumpToTimeInVideo(sec);
							}

							$('#ilInteractiveVideo').parent().attr('class', 'col-sm-6');
						}
					)
				);

				//Todo: add drag and drop && delete
				var element = obj.val();
				var proto = '';
				pub.actual_id = 'ilInteractiveVideoOverlay';
				pro.removeButtons();
				if($(element).is('rect'))
				{
					proto = 'rect_prototype';
				}
				else if($(element).is('circle'))
				{
					proto = 'circle_prototype';
				}
				else if($(element).is('path'))
				{
					proto = 'arrow_prototype';
				}
				else if($(element).is('line'))
				{
					proto = 'line_prototype';
				}

				pro.hideMakerToolBarObjectsForForm(proto);

				$('#ilInteractiveVideoOverlay').html(element);
				$('#add_marker_chk').click();
				$('.add_marker_selector').show( 'fast' );

				pro.attachStyleEvents();
				pro.addDraggableFunction($('#' + pub.actual_id), proto);

				console.log('edit screen with marker')
			}
		}
		else
		{
			pub.attachListener();
		}
	};

	pro.attachSubmitCancelListener = function()
	{
		$('#ilInteractiveVideoCommentCancel').click(function()
		{
			pro.showButtons();
		});

		$('#ilInteractiveVideoCommentSubmit').click(function()
		{
			pro.showButtons();
		});
	};

	pro.hideMakerToolBarObjectsForForm = function(prototype)
	{
		$('.marker_toolbar_element').removeClass('prototype');
		$.each(pri[prototype], function( index, value ) {
			$('.' + value).addClass('prototype');
		});
	};

	pro.attachStyleEvents = function()
	{
		$("#width_changer").on("input change", function() {
			$('#' + pub.actual_id).children().attr('width', $(this).val())
		});

		$("#height_changer").on("input change", function() {
			$('#' + pub.actual_id).children().attr('height', $(this).val())
		});

		$("#scale_changer").on("input change", function() {
			var obj = $('#' + pub.actual_id);
			pro.readStyleFromElement(obj);
			obj.data('scale', $(this).val());
			pro.applyStyleToElement(obj);
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

		$("#rotate_changer").on("input change", function() {
			var obj = $('#' + pub.actual_id);
			pro.readStyleFromElement(obj);
			obj.data('rotate', $(this).val());
			pro.applyStyleToElement(obj);
		});
	};

	pro.applyStyleToElement = function(obj)
	{
		var style = '';

		if(obj.children().is('rect'))
		{
			style += pro.buildStrokeStyle(obj);
			pro.buildStyleAttributeForRect(obj);
			obj.children().attr('style', style)
		}
		else if(obj.children().is('circle'))
		{
			style += pro.buildStrokeStyle(obj);
			pro.buildStyleForCircle(obj);
			obj.children().attr('style', style)
		}
		else if(obj.children().is('path'))
		{
			pro.buildFillStyleForPath(obj);
		}
		else if(obj.children().is('line'))
		{
			style += pro.buildStrokeStyle(obj);
			pro.buildStyleAttributeForRect(obj);
			obj.children().attr('style', style)
		}
	};

	pro.readStyleFromElement = function(obj)
	{
		if(obj.children().is('rect'))
		{
			pro.readStrokeStyle(obj);
			pro.readRotation(obj);
		}
		else if(obj.children().is('circle'))
		{
			pro.readStrokeStyle(obj);
			pro.readScale(obj);
			pro.readRotation(obj);
		}
		else if(obj.children().is('path'))
		{
			pro.readFillStyle(obj);
			pro.readScale(obj);
			pro.readRotation(obj);
		}
		else if(obj.children().is('line'))
		{
			pro.readStrokeStyle(obj);
			pro.readRotation(obj);
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

	pro.readScale = function(obj)
	{
		var scale = obj.data('scale');

		if(typeof scale === "undefined")
		{
			scale = 1;
		}
		obj.data('scale', scale);
	};

	pro.readRotation = function(obj)
	{
		var rotate = obj.data('rotate');

		if(typeof rotate === "undefined")
		{
			rotate = 0;
		}
		obj.data('rotate', rotate);
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
		var rotate = obj.data('rotate');
		var scale = obj.data('scale');
		var scale_text = '';

		if(scale != '')
		{
			var x = (1 - scale) * 49;
			var y = (1 - scale) * 59;
			scale_text = ',translate(' + x + ',' + y + '),scale(' + scale + ')';
		}
		obj.children().attr('fill', fill_color);
		obj.children().attr('transform', 'translate(100, 15),rotate(' + rotate+ ', 49, 59)' + scale_text + '');
	};

	pro.buildStyleAttributeForRect = function(obj)
	{
		var rotate = obj.data('rotate');
		obj.children().attr('transform', 'rotate(' + rotate+ ', 147, 77)');
	};

	pro.buildStyleForCircle = function(obj)
	{
		var scale = obj.data('scale');
		var scale_text = '';

		if(scale != '')
		{
			scale_text = 'translate(150, 75),scale(' + scale + '),translate(-150, -75)';
		}
		obj.children().attr('transform', scale_text);
	};

	 pro.addScrollEventToDisableMarkerMovingOnScrolling = function(scrollBasisHeight) {
		$(document).off('scroll');

		$(document).on('scroll', function () {
			var scrollModificationHeight = $(document).scrollTop();
			var new_height = 0;
			var new_top    = 0;
			var obj        = $('.interactive_marker');

			if (scrollModificationHeight > scrollBasisHeight) 
			{
				new_height = scrollModificationHeight - scrollBasisHeight;
				new_top = parseInt(obj.css('top'), 10) - new_height;
				scrollBasisHeight = scrollModificationHeight;
				obj.css('top', new_top);
			}
			else 
			{
				new_height = scrollBasisHeight - scrollModificationHeight;
				new_top = parseInt(obj.css('top'), 10) + new_height;
				scrollBasisHeight = scrollModificationHeight;
				obj.css('top', new_top);
			}

			return scrollBasisHeight;
		});
	 };

	pro.addDraggableFunction = function(svg, prototype_class) 
	{
		var overlay = $('#ilInteractiveVideoPlayerContainer');
		var scrollBasisHeight = $(document).scrollTop();
		svg.removeClass('prototype');
		svg.width(overlay.width());
		svg.height(overlay.height());
		svg.draggable({
			stop: function (event, ui) {
				var childPos = svg.offset();
				var parentPos = overlay.offset();
				var childOffset = {
					top:  childPos.top - parentPos.top,
					left: childPos.left - parentPos.left
				};
				var x = childOffset.left / (overlay.width() / 300);
				var y = childOffset.top / (overlay.height() / 150);
				var corrected_x = pro.getCorrectedX(prototype_class);
				var corrected_y = pro.getCorrectedY(prototype_class);

				svg.children().attr({'POS_X': x + corrected_x, 'POS_Y': y + corrected_y});
				console.log(x, y, childOffset, childPos, parentPos, overlay.width(), overlay.height(), corrected_x, corrected_y);
			}
		});
		pro.addScrollEventToDisableMarkerMovingOnScrolling(scrollBasisHeight);
	};

	pro.attachSingleObjectListener = function(button_id, prototype_class)
	{
		$('#' + button_id).off('click');

		$('#' + button_id).click(function()
		{
			pro.hideMakerToolBarObjectsForForm(prototype_class);
			if( ! pub.stillEditingSvg())
			{
				var id	= pro.getUniqueId();
				var svg = $('.' + prototype_class).clone()
					.attr({'id': id, 'class' : 'interactive_marker iv_svg_marker'})
					.prependTo( '#ilInteractiveVideo' );

				pro.addDraggableFunction(svg, prototype_class);
				pro.removeButtons();
			}
		});
	};

	pro.getUniqueId = function()
	{
		var unique_id = '_' + Math.random().toString(36).substr(2, 9);
		pub.actual_id = unique_id;
		return unique_id;
	};

	pro.removeButtons = function()
	{
		$('.marker_button_toolbar').addClass('prototype');
		$('.marker_toolbar').removeClass('prototype');
	};

	pro.showButtons = function()
	{
		$('.marker_button_toolbar').removeClass('prototype');
		$('.marker_toolbar').addClass('prototype');
	};

	pro.getCorrectedX = function(prototype_class)
	{
		if(prototype_class === 'rect_prototype')
		{
			return 100;
		}
		else if(prototype_class === 'circle_prototype')
		{
			return 150;
		}
		else if(prototype_class === 'arrow_prototype')
		{
			return 150;
		}
		else if(prototype_class === 'line_prototype')
		{
			return 100;
		}
	};

	pro.getCorrectedY = function(prototype_class)
	{
		if(prototype_class === 'rect_prototype')
		{
			return 25;
		}
		else if(prototype_class === 'circle_prototype')
		{
			return 75;
		}
		else if(prototype_class === 'arrow_prototype')
		{
			return 75;
		}
		else if(prototype_class === 'line_prototype')
		{
			return 75;
		}
	};

	pub.stillEditingSvg = function()
	{
		if(pub.actual_id === null)
		{
			pro.showButtons();
			return false;
		}
		else if($('#' + pub.actual_id).length > 0)
		{
			return true;
		}
		else if($('#' + pub.actual_id).length === 0)
		{
			pub.actual_id = null;
			pro.showButtons();
			return false;
		}
	};

	pub.protect = pro;
	return pub;

}(il));

var interval = setInterval(function() {
	if(document.readyState === 'complete') {
		clearInterval(interval);
		il.InteractiveVideoOverlayMarker.checkForEditScreen();
	}
}, 100);