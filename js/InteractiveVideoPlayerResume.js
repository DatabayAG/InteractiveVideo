il.InteractiveVideoPlayerResume = (function (scope) {
	'use strict';

	let pub = {}, pro = {}, pri = {
		storage_key               :  "InteractiveVideoResumeTime",
		storage_media             : localStorage,
		delete_entries_older_than : 31539999000
	};

	pub.checkForResumeValue = function (player_id) {
		setTimeout(function () {
			let key = pri.getStorageKey(player_id);

			if (pro.IsStorageAvailable()) {
				let saved_time = parseFloat(pri.storage_media.getItem(key));
				let duration   = scope.InteractiveVideoPlayerAbstract.duration(player_id);

				if ( ! isNaN(saved_time) || ! saved_time >= duration || ! saved_time < 0) {
					scope.InteractiveVideoPlayerAbstract.setCurrentTime(saved_time, player_id);
					pro.removeExistingKey(player_id);
				}

			}
		}, 250);
	};

	pub.saveResumeTime = function (player_id) {
		let key          = pri.getStorageKey(player_id);
		let current_time = scope.InteractiveVideoPlayerAbstract.currentTime(player_id);

		if (pro.IsStorageAvailable()) {
			if (current_time > 0) {
				pri.writeItemToStorage(key, current_time, player_id);
			}
		}
	};

	pro.removeExistingKey = function (player_id) {
		let key    = pri.getStorageKey(player_id);
		let ref_id = pri.getRefIdFromPlayerConfig(scope.InteractiveVideo[player_id]);

		if (pro.IsStorageAvailable()) {
			pri.storage_media.removeItem(key);
			pri.removeKeyFromDataGraveObject(ref_id);
		}
	};

	pri.getStorageKey = function (player_id) {
		let player_config = scope.InteractiveVideo[player_id];
		let client_id     = player_config.installation_client_id;
		let ref_id        = pri.getRefIdFromPlayerConfig(player_config);

		return pri.storage_key + '_' + client_id + '_' + ref_id;
	};

	pri.getRefIdFromPlayerConfig = function(player_config) {

		return parseInt(player_config.interactive_video_ref_id, 10);
	};

	pri.writeItemToStorage = function(key, current_time, player_id)  {
		let ref_id         = pri.getRefIdFromPlayerConfig(scope.InteractiveVideo[player_id]);
		let data_grave     = pri.getDataGraveObject();
		let data_grave_key = pri.storage_key + '_DataGrave';

		data_grave[ref_id] = new Date().getTime();
		pri.storage_media.setItem(key, current_time);
		pri.storage_media.setItem(data_grave_key, JSON.stringify(data_grave));
	};

	pub.cleanUpStorage = function(player_id) {
		let data_grave     = pri.getDataGraveObject();
		let player_config  = scope.InteractiveVideo[player_id];
		let client_id      = player_config.installation_client_id;
		let today_time     = new Date().getTime();

		data_grave = pri.sortObjectByValue(data_grave);
		$.each(data_grave, function( ref_id, time ) {
			console.log('Cleanup: ' +  pri.storage_key + '_' + client_id + '_' + ref_id + ',' + time );
			if((time + pri.delete_entries_older_than) <= today_time) {
				console.log('Entry is older so it will be deleted.');
				// pri.removeExistingKey(player_id);
				// pri.removeKeyFromDataGraveObject(ref_id)
			} else {
				console.log('Entry is not older so it will be ignored.');
			}
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

	pri.removeKeyFromDataGraveObject = function(ref_id) {
		let data_grave_key = pri.storage_key + '_DataGrave';
		let data_grave     = JSON.parse(pri.storage_media.getItem(data_grave_key));

		if(data_grave == undefined ) {
			data_grave = {};
		} else {
			delete data_grave[ref_id];
		}

		pri.storage_media.setItem(data_grave_key, JSON.stringify(data_grave));
	};

	pri.sortObjectByValue = function(object) {
			let sorted_object = {};
			let sortable      = Object.entries(object);

			sortable.sort(function(a, b) {
				return a[1]-b[1];
			});

			for (let i = 0; i < sortable.length; i++) {
				sorted_object[sortable[i][0]] = sortable[i][1];
			}

			return sorted_object; 
	};


	pro.IsStorageAvailable = function () {

		return (typeof Storage !== "undefined");
	};

	pub.protect = pro;
	return pub;

}(il));