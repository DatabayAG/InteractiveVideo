il.InteractiveVideoPlayerResume = (function (scope) {
	'use strict';

	let pub = {}, pro = {}, pri = {
		storage_key : "InteractiveVideoResumeTime_",
		storage_media : sessionStorage
	};

	pub.checkForResumeValue = function(player_id){
		setTimeout(function(){
			let key = pro.getStorageKey(player_id);

			if (pro.IsStorageAvailable()) {
				let saved_time = parseFloat(pri.storage_media.getItem(key));
				if(saved_time > 0){
					scope.InteractiveVideoPlayerAbstract.setCurrentTime(player_id, saved_time);
					pro.removeExistingKey();
				}
			}
		}, 250);
	};

	pub.saveResumeTime = function(player_id){
		let key = pro.getStorageKey(player_id);
		let current_time = scope.InteractiveVideoPlayerAbstract.currentTime(player_id);

		if (pro.IsStorageAvailable()) {
			if(current_time > 0){
				pri.storage_media.setItem(key, current_time);
			}
		}
	};

	pro.removeExistingKey = function(player_id){
		let key = pro.getStorageKey(player_id);

		if (pro.IsStorageAvailable()) {
			pri.storage_media.removeItem(key);
		}
	};

	pro.getStorageKey = function(player_id){
		let ref_id = parseInt(scope.InteractiveVideo[player_id].interactive_video_ref_id, 10);
		return pri.storage_key + ref_id;
	};

	pro.IsStorageAvailable = function(){
		return (typeof(Storage) !== "undefined");
	};

	pub.protect = pro;
	return pub;

}(il));