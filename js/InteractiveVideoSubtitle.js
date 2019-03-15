il.InteractiveVideoSubtitle = (function (scope) {
	'use strict';

	let pub = {}, pro = {}, pri = {
		subtitles : 'subtitles'
	};

	pub.initializeSubtitleTracks = function(player_id){
		$.each(il.InteractiveVideo[player_id].tracks[0], function (key, value) {

			let track = document.createElement('track');
			track.kind    = pri.subtitles;
			track.label   = value.label;
			track.src     = value.src;
			track.srclang = value.srclang;

			$("#" + player_id).append(track);

		});
	};
	
	pub.protect = pro;
	return pub;

}(il));