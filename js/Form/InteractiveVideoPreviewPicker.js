il.InteractiveVideoPreviewPicker = (function (scope) {
	'use strict';

	var pub = {}, pro = {};

	pub.config = {
		modal_id	: 'ffmpeg_extract_modal',
		button_id	: 'ffmpeg_extract'
	};
	
	pub.initialize = function(){
		pro.registerClickListener();
	};
	
	pro.registerClickListener = function()
	{
		$('#' + pub.config.button_id).on('click', function()
		{
			$('#' + pub.config.modal_id).modal('show');
		});
	};

	pub.protect = pro;
	return pub;

}(il));
$( document ).ready(function() {
	il.InteractiveVideoPreviewPicker.initialize();
});