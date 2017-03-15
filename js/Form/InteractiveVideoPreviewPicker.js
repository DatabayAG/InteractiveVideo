il.InteractiveVideoPreviewPicker = (function (scope) {
	'use strict';

	var pub = {}, pro = {};

	pub.config = {
		modal_id	: 'ffmpeg_extract_modal',
		button_id	: 'ffmpeg_extract',
		generate_id	: 'generate_ffmpeg',
		path_id		: 'extract_file_path'
	};
	
	pub.initialize = function(){
		pro.makeModalBootstrapCompatible();
		pro.registerClickListener();
	};
	
	pro.registerClickListener = function()
	{
		$('#' + pub.config.button_id).on('click', function()
		{
			$('#' + pub.config.modal_id).modal({backdrop: 'static'}, 'show');
			$('#ffmpeg_time_picker').timepicker('setTime', $('#comment_time').val());
		});

		$('#' + pub.config.generate_id).on('click', function()
		{
			pro.generateThumbnailsPerAjaxCall();
		});
		
	};
	
	pro.generateThumbnailsPerAjaxCall = function()
	{
		pro.displayWaitBox();

		$.ajax({
			type:	"POST", 
			cache:	false, 
			url:	il.InteractiveVideoFFMPEGAjaxURL, 
			data:	{time : $('#ffmpeg_time_picker').val()}, 
			success: function (json) 
				{
					var images = JSON.parse(json);
					var html = '';
					var button = $('.use_as_question_image').html();
					if(images.error === undefined)
					{
						$.each(images, function (key, value)
						{
							html += '<div class="col-xs-12 preview_image_container"><img class="preview_image" src="'+value+'"/>' +
								button +
								'</div>';
						});
						$('#' + pub.config.modal_id).find('.preview').html(html);
						pro.registerSelectListener();
					}
					else
					{
						$('#' + pub.config.modal_id).find('.preview').html(images.error);
					}

					pro.hideWaitBox();
				}
		});
	};

	pro.registerSelectListener = function()
	{
		$('.question_image_select').off('click');

		$('.question_image_select').on('click', function(){
			var img = $(this).parent().find('.preview_image').attr('src');

			if($('#il_prop_cont_question_image').find('img').length > 0)
			{
				$('#il_prop_cont_question_image').find('img').remove();
			}

			$('#il_prop_cont_question_image').find('#ffmpeg_extract').before('<img class="fake_media_image" src="'+img+'"/><br/>');
			$('#il_prop_cont_question_image').find('#ffmpeg_extract').before('<input type="hidden" name="ffmpeg_thumb" value="'+img+'">');
			$('#' + pub.config.modal_id).modal('hide');
			$('#' + pub.config.modal_id).find('.preview').html('');
		});
	};

	pro.displayWaitBox = function()
	{
		$('#' + pub.config.modal_id).find('.preview').html('<div class="col-xs-12 ffmpeg_spinner"><img src="Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/templates/images/spinner.svg"/></div>');
	};

	pro.hideWaitBox = function()
	{
		$('#' + pub.config.modal_id).find('.ffmpeg_spinner').remove();
		$('.preview_image_container').find('.question_image_select').removeClass('hidden');
	};
	
	pro.makeModalBootstrapCompatible = function()
	{
		var size = 'col-xs-12';
		$('.modal-body').addClass(size);
		$('.modal-content').addClass(size);
	};

	pub.protect = pro;
	return pub;

}(il));
$( document ).ready(function() {
	il.InteractiveVideoPreviewPicker.initialize();
});