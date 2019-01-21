il.InteractiveVideoPlayerResume = (function (scope) {
	'use strict';

	let pub = {}, pro = {}, pri = {
		storage_key : "InteractiveVideoResumeTime_",
		storage_media : sessionStorage
	};

	pub.checkForResumeValue = function(){
		setTimeout(function(){
			let key = pro.getStorageKey();

			if (typeof(Storage) !== "undefined") {
				let time = parseInt(pri.storage_media.getItem(key), 10);
				if(time > 0){
					il.InteractiveVideoPlayerAbstract.setCurrentTime(time);
					pro.removeExistingKey();
				}
			}
		}, 250);
	};

	pub.saveResumeTime = function(){
		let key = pro.getStorageKey();
		let current_time = il.InteractiveVideoPlayerAbstract.getCurrentTime();

		if (typeof(Storage) !== "undefined") {
			if(current_time > 0){
				pri.storage_media.setItem(key, current_time);
			}
		}
	};

	pro.removeExistingKey = function(){
		let key = pro.getStorageKey();

		if (typeof(Storage) !== "undefined") {
			pri.storage_media.removeItem(key);
		}
	};

	pro.getStorageKey = function(){
		let ref_id = parseInt(il.InteractiveVideo.interactive_video_ref_id, 10);
		return pri.storage_key + ref_id;
	};

	pub.protect = pro;
	return pub;

}(il));