il.InteractiveVideoOverlayMarker = (function (scope) {
	'use strict';

	var pub = {
		actual_id : null,
		editScreen : false
	}, pro = {
		default_color : '#FF0000',
		stroke_width  : 4,
		marker_class  : 'magic_marker iv_svg_marker'
	}, pri = {
		tools : {
			'rect_prototype' : [
				'iv_mk_scale', 'iv_mk_color_fill', 'iv_mk_font_size', 'iv_mk_text'
			],
			'ellipse_prototype' : [
				'iv_mk_width', 'iv_mk_height', 'iv_mk_rotate', 'iv_mk_color_fill', 'iv_mk_font_size', 'iv_mk_text'
			],
			'arrow_prototype' : [
				'iv_mk_width', 'iv_mk_height', 'iv_mk_stroke', 'iv_mk_color', 'iv_mk_font_size', 'iv_mk_text'
			],
			'line_prototype' : [
				'iv_mk_height', 'iv_mk_scale', 'iv_mk_color_fill', 'iv_mk_font_size', 'iv_mk_text'
			],
			'text_prototype' : [
				'iv_mk_width', 'iv_mk_height', 'iv_mk_stroke', 'iv_mk_scale', 'iv_mk_color'
			]
		},
		ids : {
			'faker_marker'       : '#fake_marker',
			'color_picker'       : '#color_picker',
			'color_picker_fill'  : '#color_picker_fill',
			'stroke_picker'      : '#stroke_picker',
			'width_changer'      : '#width_changer',
			'height_changer'     : '#height_changer',
			'scale_changer'      : '#scale_changer',
			'rotate_changer'     : '#rotate_changer',
			'text_changer'       : '#text_changer',
			'font_size_changer'  : '#font_size_changer',
			'btn_delete'         : '#btn_delete',
			'comment_time'       : '#comment_time',
			'ilInteractiveVideoOverlay'       : '#ilInteractiveVideoOverlay',
			'ilInteractiveVideoCommentCancel' : '#ilInteractiveVideoCommentCancel',
			'ilInteractiveVideoCommentSubmit' : '#ilInteractiveVideoCommentSubmit'
		},
		classes : {
			'remove_marker'            : '.remove_marker',
			'marker_toolbar'           : '.marker_toolbar',
			'marker_button_toolbar'    : '.marker_button_toolbar',
			'add_marker_selector'      : '.add_marker_selector',
			'marker_toolbar_element'   : '.marker_toolbar_element'
		},
		strings : {
			'ilInteractiveVideoOverlay' : 'ilInteractiveVideoOverlay'
		},
		actual_marker : null
	};
	
	pub.jumpToTimeAndRemoveOverlay = function()
	{
		il.InteractiveVideoOverlayMarker.jumpToTimeInVideoForMarker();
		$('.play_overlay_jump_to_time').remove();
	};

	pub.checkForEditScreen = function()
	{
		var obj = $(pri.ids.faker_marker);
		if(obj.length >= 1)
		{
			if(obj.val().length > 0)
			{

				var element = obj.val();
				pro.removeButtons();
				il.InteractiveVideoPlayerAbstract.addOnReadyFunction(
					(function ()
						{
							$('.ilInteractiveVideo').prepend('<div class="play_overlay_jump_to_time"><div onclick="il.InteractiveVideoOverlayMarker.jumpToTimeAndRemoveOverlay();" class="play_overlay_jump_to_time_text">'+il.InteractiveVideo.lang.jump_to_text+'</div></div>');
							$(pri.ids.ilInteractiveVideoOverlay).html(element);
							$(pri.classes.add_marker_selector).show( 'fast' );
							pub.editScreen = true;
							il.InteractiveVideoOverlayMarker.initialiseExistingMarker();
						}
					)
				);
			}
		}
		else
		{
			$(pri.classes.remove_marker).remove();
		}
		pub.attachListener();
	};

	pub.jumpToTimeInVideoForMarker = function()
	{
		var sec = il.InteractiveVideoPlayerFunction.getSecondsFromTime($(pri.ids.comment_time).val());
		il.InteractiveVideoPlayerAbstract.jumpToTimeInVideo(sec);
	};

	pub.checkForOverlay = function()
	{
		var svg = '<svg id="ilInteractiveVideoOverlay" viewBox="0 0 300 150" preserveAspectRatio="none"></svg>';
		var overlay_count = $(pri.ids.ilInteractiveVideoOverlay).size();
		if(overlay_count === 1){
			if($('#ilInteractiveVideoAjaxModal .ilInteractiveVideo').size()){
				setTimeout(function(){
					$('#ilInteractiveVideoOverlay').remove();
					$('#ilInteractiveVideoAjaxModal .ilInteractiveVideo').prepend(svg);
				}, 30);
			}
		}else if(overlay_count === 0){
			$('#ilInteractiveVideoTag').parent().prepend(svg);
		}else{
			console.log('Something totally went wrong.')
		}
	};

	pub.attachListener = function()
	{
		pro.attachSingleObjectListener('btn_rect', 'rect_prototype');
		pro.attachSingleObjectListener('btn_ellipse', 'ellipse_prototype');
		pro.attachSingleObjectListener('btn_arrow', 'arrow_prototype');
		pro.attachSingleObjectListener('btn_line', 'line_prototype');
		pro.attachSingleObjectListener('btn_text', 'text_prototype');
		pro.attachStyleEvents();
		pro.attachSubmitCancelListener();
		pub.checkForOverlay();
	};

	pub.initialiseExistingMarker = function()
	{
		var obj = $('.magic_marker');
		var type, proto;
		if($(obj).is('rect'))
		{
			type = 'rect';
			proto = 'rect_prototype';
		}
		else if($(obj).is('ellipse'))
		{
			type = 'ellipse';
			proto = 'ellipse_prototype';
		}
		else if($(obj).is('path'))
		{
			type = 'path';
			proto = 'arrow_prototype';
		}
		else if($(obj).is('line'))
		{
			type = 'line';
			proto = 'line_prototype';
		}
		else if($(obj).is('text'))
		{
			type = 'text';
			proto = 'text_prototype';
		}
		var svg = SVG(pri.strings.ilInteractiveVideoOverlay);
		var marker = svg.select(type + '.magic_marker');
		var id = pro.getUniqueId();
		marker.id(id);
		obj.css('cssText', 'pointer-events : all !important');

		marker.draggable().on('dragend', function(e){
			pro.replaceFakeMarkerAfterAttributeChange();
		});

		pri.actual_marker = marker;
		pro.hideMakerToolBarObjectsForForm(proto);
		pro.attachStyleEvents();
		if(pub.editScreen)
		{
			$(pri.classes.remove_marker).removeClass('prototype');
		}
		console.log(marker, $(obj), type)
		pro.setValuesFromElement();
	};

	pro.createSvgElement = function(id, prototype_class)
	{
		if(prototype_class === 'rect_prototype')
		{
			pro.attachRectangle(id);
		}
		else if(prototype_class === 'ellipse_prototype')
		{
			pro.attachEllipse();
		}
		else if(prototype_class === 'arrow_prototype')
		{
			pro.attachArrow();
		}
		else if(prototype_class === 'line_prototype')
		{
			pro.attachLine();
		}
		else if(prototype_class === 'text_prototype')
		{
			pro.attachText();
		}
		pro.replaceFakeMarkerAfterAttributeChange();
	};

	pro.attachSubmitCancelListener = function()
	{
		$(pri.ids.ilInteractiveVideoCommentCancel).click(function()
		{
			pub.resetForm();
		});

		$(pri.ids.ilInteractiveVideoCommentSubmit).click(function()
		{
			if(il.InteractiveVideoPlayerFunction.getCommentTextFromEditor() !== '')
			{
				pro.showButtons();
			}
		});
	};
	
	pub.resetForm = function()
	{
		pro.showButtons();
		pro.actual_marker = null;
		pro.resetAllFormElements();
		$('.iv_svg_marker').remove();
	};

	pro.hideMakerToolBarObjectsForForm = function(prototype)
	{
		$(pri.classes.marker_toolbar_element).removeClass('prototype');
		$.each(pri.tools[prototype], function( index, value ) {
			$('.' + value).addClass('prototype');
		});
	};

	pro.attachStyleEvents = function()
	{
		$(pri.ids.width_changer).on("input change", function() {
			pri.actual_marker.width($(this).val());
			pro.replaceFakeMarkerAfterAttributeChange();
		});

		$(pri.ids.height_changer).on("input change", function() {
			pri.actual_marker.height($(this).val());
			pro.replaceFakeMarkerAfterAttributeChange();
		});

		$(pri.ids.scale_changer).on("input change", function() {
			pri.actual_marker.scale($(this).val());
			pro.replaceFakeMarkerAfterAttributeChange();
		});

		$(pri.ids.color_picker).on("input change", function() {
			pri.actual_marker.stroke({'color' : $(this).val()});
			pro.replaceFakeMarkerAfterAttributeChange();
		});

		$(pri.ids.color_picker_fill).on("input change", function() {
			pri.actual_marker.fill({'color' : $(this).val()});
			pro.replaceFakeMarkerAfterAttributeChange();
		});

		$(pri.ids.stroke_picker).on("input change", function() {
			var color = $('#' + pub.actual_id).attr('stroke');
			pri.actual_marker.attr('stroke-width' , $(this).val());
			pri.actual_marker.attr('stroke' , color);
			pro.replaceFakeMarkerAfterAttributeChange();
		});

		$(pri.ids.rotate_changer).on("input change", function() {
			pri.actual_marker.rotate($(this).val());
			pro.replaceFakeMarkerAfterAttributeChange();
		});

		$(pri.ids.text_changer).on("input change", function() {
			if('members' in pri.actual_marker)
			{
				pri.actual_marker.members[0].text($(this).val());
			}
			else
			{
				pri.actual_marker.text($(this).val());
			}

			pro.replaceFakeMarkerAfterAttributeChange();
		});

		$(pri.ids.font_size_changer).on("input change", function() {
			pri.actual_marker.attr({'font-size' : $(this).val()});
			pro.replaceFakeMarkerAfterAttributeChange();
		});

		$(pri.ids.btn_delete).on("click", function() {
			$(pri.ids.faker_marker).html('');
			pub.resetForm();
		});

	};

	pro.replaceFakeMarkerAfterAttributeChange = function()
	{
		$(pri.ids.faker_marker).val($(pri.ids.ilInteractiveVideoOverlay).html());
	};

	pro.attachRectangle= function(id)
	{
		var draw = pro.initialiseSVG();
		var rect = draw.rect(100, 80);
		pro.addStrokeAndNoFill(rect);
		pro.finishMarkerElement(rect, id);
	};

	pro.attachEllipse = function(id)
	{
		var draw = pro.initialiseSVG();
		var ellipse = draw.ellipse(100, 90);
		ellipse.scale(1);
		pro.addStrokeAndNoFill(ellipse);
		pro.finishMarkerElement(ellipse, id);
	};

	pro.attachLine = function(id)
	{
		var draw = pro.initialiseSVG();
		var line = draw.line(0, 75, 150, 75);
		pro.addStrokeAndNoFill(line);
		pro.finishMarkerElement(line, id);
	};

	pro.attachArrow = function(id)
	{
		var draw = pro.initialiseSVG();
		var arrow = draw.path('m0,50l50,-50l50,50l-25,0l0,50l-50,0l0,-50l-25,0z');
		pro.addFillNoStroke(arrow);
		pro.finishMarkerElement(arrow, id);
	};

	pro.attachText = function(id)
	{
		var draw = pro.initialiseSVG();
		var text = draw.text($(pri.ids.text_changer).val());
		text.move(50,60).font({size : 15});
		pro.addFillNoStroke(text);
		pro.finishMarkerElement(text, id);
	};

	pro.initialiseSVG = function()
	{
		return SVG(pri.strings.ilInteractiveVideoOverlay);
	};
	
	pro.addStrokeAndNoFill = function(element)
	{
		element.stroke({ width: pro.stroke_width , color : pro.default_color});
		element.fill('none');
	};

	pro.addFillNoStroke = function(element)
	{
		element.fill(pro.default_color);
		element.stroke({'width' : 0});
	};

	pro.finishMarkerElement = function(element, id)
	{
		element.attr('class', pro.marker_class);
		element.attr('id', id);
		element.draggable().on('dragend', function(e){
			pro.replaceFakeMarkerAfterAttributeChange();
		});
		pri.actual_marker = element;
	};

	pro.attachSingleObjectListener = function(button_id, prototype_class)
	{
		var j_object = $('#' + button_id);
		j_object.off('click');

		j_object.click(function()
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
		var dt = new Date().getTime();
		var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = (dt + Math.random()*16)%16 | 0;
			dt = Math.floor(dt/16);
			return (c=='x' ? r :(r&0x3|0x8)).toString(16);
		});
		var unique_id = '_';
		unique_id += uuid;
		pub.actual_id = unique_id;
		return unique_id;
	};

	pro.removeButtons = function()
	{
		$(pri.classes.marker_button_toolbar).addClass('prototype');
		$(pri.classes.marker_toolbar).removeClass('prototype');
		$(pri.classes.remove_marker).removeClass('prototype');
		pro.resetAllFormElements();
	};

	pro.showButtons = function()
	{
		$(pri.classes.marker_button_toolbar).removeClass('prototype');
		$(pri.classes.marker_toolbar).addClass('prototype');
		$(pri.classes.remove_marker).addClass('prototype');
	};

	pro.resetAllFormElements = function()
	{
		$(pri.ids.color_picker).val(pro.default_color);
		$(pri.ids.color_picker_fill).val(pro.default_color);
		$(pri.ids.stroke_picker).val(4);
		$(pri.ids.width_changer).val(100);
		$(pri.ids.height_changer).val(100);
		$(pri.ids.scale_changer).val(1);
		$(pri.ids.rotate_changer).val(0);
		$(pri.ids.text_changer).val('');
		$(pri.ids.font_size_changer).val(15);
	};

	pro.setValuesFromElement = function()
	{
		var j_object = $('#' + pub.actual_id);
		var text = j_object.text();
		text = text.trim();
		$(pri.ids.color_picker).val(j_object.attr('stroke'));
		$(pri.ids.color_picker_fill).val(j_object.attr('fill'));
		$(pri.ids.stroke_picker).val(j_object.attr('stroke-width'));
		$(pri.ids.width_changer).val(j_object.attr('width'));
		$(pri.ids.height_changer).val(j_object.attr('height'));
		$(pri.ids.scale_changer).val(j_object.attr('scale'));
		$(pri.ids.rotate_changer).val(j_object.attr('rotate'));

		if(text !== '')
		{
			var j_object_txt = $(pri.ids.text_changer);
			j_object_txt.val(text);
			j_object_txt.trigger('change');
			$(pri.ids.font_size_changer).val(j_object.attr('font-size'));
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