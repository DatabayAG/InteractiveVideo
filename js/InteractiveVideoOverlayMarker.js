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
		],
		actual_marker : null,
		marker_class  : 'magic_marker iv_svg_marker'
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

				//Todo fix pointer event
				//Todo: add drag and drop && delete
				var element = obj.val();
				pub.actual_id = 'ilInteractiveVideoOverlay';
				pro.removeButtons();

				il.InteractiveVideoPlayerAbstract.addOnReadyFunction(
					(function ()
						{
							if(il.InteractiveVideoPlayerAbstract.config.external === false)
							{
								var sec = il.InteractiveVideoPlayerFunction.getSecondsFromTime($('#comment_time').val());
								il.InteractiveVideoPlayerAbstract.jumpToTimeInVideo(sec);
							}
							$('#ilInteractiveVideo').parent().attr('class', 'col-sm-6');
							pro.initialiseExistingMarker();
						}
					)
				);

				$('#ilInteractiveVideoOverlay').html(element);
				$('#add_marker_chk').click();
				$('.add_marker_selector').show( 'fast' );

				pro.attachStyleEvents();

				console.log('edit screen with marker')
			}
		}
		else
		{
			pub.attachListener();
		}
	};

	pro.initialiseExistingMarker = function()
	{
		var obj = $('.magic_marker');
		var type, proto;
		if($(obj).is('rect'))
		{
			type = 'rect';
			proto = 'rect_prototype';
		}
		else if($(element).is('circle'))
		{
			type = 'circle';
			proto = 'circle_prototype';
		}
		else if($(element).is('path'))
		{
			type = 'path';
			proto = 'arrow_prototype';
		}
		else if($(element).is('line'))
		{
			type = 'line';
			proto = 'line_prototype';
		}
		var svg = SVG('ilInteractiveVideoOverlay');
		var marker = svg.select(type + '.magic_marker');
		marker.draggable();
		pri.actual_marker = marker;
		pro.hideMakerToolBarObjectsForForm(proto);
	};

	pro.attachSubmitCancelListener = function()
	{
		$('#ilInteractiveVideoCommentCancel').click(function()
		{
			pro.showButtons();
			pro.actual_marker = null;
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
			$('#' + pub.actual_id).attr('width', $(this).val())
		});

		$("#height_changer").on("input change", function() {
			$('#' + pub.actual_id).attr('height', $(this).val())
		});

		$("#scale_changer").on("input change", function() {
			pri.actual_marker.scale($(this).val());
		});

		$("#color_picker").on("input change", function() {
			//Todo Workaround Arrow
			pri.actual_marker.stroke({'color' : $(this).val()})
		});

		$("#stroke_picker").on("input change", function() {
			pri.actual_marker.stroke({'width' : $(this).val()})
		});

		$("#rotate_changer").on("input change", function() {
			pri.actual_marker.rotate($(this).val());
		});
	};

	pro.attachRectangle= function(id)
	{
		var draw = SVG('ilInteractiveVideoOverlay');
		var rect = draw.rect(100, 80);
		rect.stroke({ width: 4 , color : '#FF0000'});
		rect.fill('none');
		rect.attr('class', pri.marker_class);
		rect.attr('id', id);
		rect.draggable();
		pri.actual_marker = rect;
	};

	pro.attachCircle = function(id)
	{
		var draw = SVG('ilInteractiveVideoOverlay');
		var circle = draw.circle(100, 80);
		circle.stroke({width: 4 , color : '#FF0000'});
		circle.fill('none');
		circle.scale(1, 0.9);
		circle.attr('class', pri.marker_class);
		circle.attr('id', id);
		circle.draggable();
		pri.actual_marker = circle;
	};

	pro.attachLine = function(id)
	{
		var draw = SVG('ilInteractiveVideoOverlay');
		var line = draw.line(0, 75, 150, 75);
		line.stroke({width: 4 , color : '#FF0000'});
		line.fill('none');
		line.attr('class', pri.marker_class);
		line.attr('id', id);
		line.draggable();
		pri.actual_marker = line;
	};

	pro.attachArrow = function(id)
	{
		var draw = SVG('ilInteractiveVideoOverlay');
		var arrow = draw.path('m0,50l50,-50l50,50l-25,0l0,50l-50,0l0,-50l-25,0z');
		arrow.fill('#FF0000');
		arrow.stroke({'width' : 0});
		arrow.attr('class', pri.marker_class);
		arrow.attr('id', id);
		arrow.draggable();
		pri.actual_marker = arrow;
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
				pro.createSvgElement(id, prototype_class);
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

	pro.createSvgElement = function(id, prototype_class)
	{
		if(prototype_class === 'rect_prototype')
		{
			pro.attachRectangle(id);
		}
		else if(prototype_class === 'circle_prototype')
		{
			pro.attachCircle();
		}
		else if(prototype_class === 'arrow_prototype')
		{
			pro.attachArrow();
		}
		else if(prototype_class === 'line_prototype')
		{
			pro.attachLine();
		}
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