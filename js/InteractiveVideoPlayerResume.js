il.InteractiveVideoPlayerResume = (function (scope) {
	'use strict';

	let pub = {}, pro = {}, pri = {
		storage_key:   "InteractiveVideoResumeTime",
		storage_media: localStorage
	};

	pub.checkForResumeValue = function (player_id) {
		setTimeout(function () {
			let key = pri.getStorageKey(player_id);
			if (pro.IsStorageAvailable()) {
				let saved_time = parseFloat(pri.storage_media.getItem(key));
				let duration = scope.InteractiveVideoPlayerAbstract.duration(player_id);

				if (isNaN(saved_time) || saved_time >= duration || saved_time < 0) {
					saved_time = 0.0001;
				}

				scope.InteractiveVideoPlayerAbstract.setCurrentTime(saved_time, player_id);
				pro.removeExistingKey(player_id);
			}
		}, 250);
	};

	pub.saveResumeTime = function (player_id) {
		let key = pri.getStorageKey(player_id);
		let current_time = scope.InteractiveVideoPlayerAbstract.currentTime(player_id);

		if (pro.IsStorageAvailable()) {
			if (current_time > 0) {
				pri.writeItemToStorage(key, current_time, player_id);
			}
		}
	};

	pro.removeExistingKey = function (player_id) {
		let key = pri.getStorageKey(player_id);
		if (pro.IsStorageAvailable()) {
			pri.storage_media.removeItem(key);
		}
	};

	pri.getStorageKey = function (player_id) {
		let player_config = scope.InteractiveVideo[player_id];
		let ref_id        = pri.getRefIdFromPlayerConfig(player_config);
		let client_id     = player_config.installation_client_id;

		return pri.storage_key + '_' + client_id + '_' + ref_id;
	};

	pri.getRefIdFromPlayerConfig = function(player_config) {

		return parseInt(player_config.interactive_video_ref_id, 10);
	};

	pri.writeItemToStorage = function(key, current_time, player_id)  {
		let ref_id         = pri.getRefIdFromPlayerConfig(scope.InteractiveVideo[player_id]);
		let data_grave     = pri.getDataGraveObject();
		let data_grave_key = pri.storage_key + '_DataGrave';
		let d = new Date();
		let n = d.getTime();

		data_grave[ref_id] = n;
		pri.storage_media.setItem(key, current_time);
		pri.storage_media.setItem(data_grave_key, JSON.stringify(data_grave));
	};

	pub.cleanUpStorage = function(player_id) {
		let data_grave     = pri.getDataGraveObject();
		let player_config  = scope.InteractiveVideo[player_id];
		let client_id      = player_config.installation_client_id;

		data_grave = pri.sortObjectByValue(data_grave);
		$.each(data_grave, function( index, value ) {
			console.log(  pri.storage_key + '_' + client_id + '_' + value[0] + ',' + value[1] );
			// pri.storage_media.removeItem(pri.storage_key + '_' + client_id + '_' + value[0] );
		});
	};
	
	pri.getDataGraveObject = function() {
		let data_grave_key = pri.storage_key + '_DataGrave';
		let data_grave     = JSON.parse(pri.storage_media.getItem(data_grave_key));

		if(data_grave == undefined ) {
			data_grave = {};
		}

		return data_grave
	};

	pri.sortObjectByValue = function(object) {
			let sortable = [];

			for(let key in object) {
				if(object.hasOwnProperty(key)) {
					sortable.push([key, object[key]]);
				}
			}

			sortable.sort(function(a, b) {
				return a[1]-b[1];
			});

			return sortable; 
	};


	pro.IsStorageAvailable = function () {

		return (typeof Storage !== "undefined");
	};

	pub.protect = pro;
	return pub;

}(il));