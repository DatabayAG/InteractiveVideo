il.InteractiveVideoPlayerAdventure = (function (scope) {
	'use strict';

	var pub = {}, pro = {
		adventureData : {
			"1" : [
					{ 
						html : "Hello World 60",
						jumpTo : 60
					},
					{
						html : "YEEEEEEEEEEEEHA 65",
						jumpTo : 65
					},
					{
						html : "Hello World 120",
						jumpTo : 120
					},
					{
						html : "YEEEEEEEEEEEEHA 122",
						jumpTo : 122
					}
				]
			,
			"18" :
				[
					{
						html : "Hello World",
						jumpTo : 10
					},
					{
						html : "YEEEEEEEEEEEEHA",
						jumpTo : 15
					},
					{
						html : "Hello World",
						jumpTo : 10
					},
					{
						html : "YEEEEEEEEEEEEHA",
						jumpTo : 15
					}
				]
		},
		stopPoints : [1, 18]
	};

	pub.playingEventHandler = function(interval, player)
	{
		var cueTime, j;
		var current_time    = scope.InteractiveVideoPlayerAbstract.currentTime();
		var duration        = scope.InteractiveVideoPlayerAbstract.duration();

		if (current_time >= duration) {
			clearInterval(interval);
			return;
		}

		if (!isNaN(current_time) && current_time > 0) {
			for (j = pro.stopPoints.length - 1; j >= 0; j--)
			{
				cueTime = parseInt(pro.stopPoints[j], 10);
				if (cueTime >= scope.InteractiveVideo.last_time && cueTime <= current_time)
				{
					if (scope.InteractiveVideo.last_stopPoint < cueTime)
					{
							scope.InteractiveVideoPlayerAbstract.pause();
							pro.drawHtmlOverlay(cueTime);
					}
					scope.InteractiveVideo.last_stopPoint = parseInt(cueTime, 10);
				}
			}
			scope.InteractiveVideo.last_time = current_time;
		}
	};
	
	pro.drawHtmlOverlay = function(cueTime)
	{
		$('#ilInteractiveVideo video').after(
			'<div class="interactiveVideoAdventureText"></div>' +
			'<div class="interactiveVideoAdventureDisableClickThrough"></div>'
		);
		
		var height = pro.calculateHeightForInlineStyle(pro.adventureData[cueTime]);
		
		$.each(pro.adventureData[cueTime], function (index, value) {
			console.log(value);
			$('.interactiveVideoAdventureText').append(
				'<div class="interactiveVideoAdventureTextCell" data-time="' + value.jumpTo + '" style="height:'+height+';">' + value.html + '</div>'
			);
		});
		
		pro.registerEventForOverlays();
	};
	
	pro.registerEventForOverlays = function()
	{
		$('.interactiveVideoAdventureTextCell').off('click');
		$('.interactiveVideoAdventureTextCell').on('click', function(){
			$('.interactiveVideoAdventureText').remove();
			$('.interactiveVideoAdventureDisableClickThrough').remove();
			il.InteractiveVideoPlayerAbstract.jumpToTimeInVideo($(this).data('time'));
			il.InteractiveVideoPlayerAbstract.play();
		});
	};

	pro.calculateHeightForInlineStyle = function(data)
	{
		var count = data.length;
		var calculated_height = 98;
		if(count > 0)
		{
			calculated_height = Math.round(98 / count);
		}
		return calculated_height + '%';
	};

	pub.Init = function()
	{
		il.InteractiveVideoPlayerAbstract.config.removeSeekBar();
	};

	pub.protect = pro;
	return pub;

}(il));

$(window).load(function(){
	il.InteractiveVideoPlayerAdventure.Init();
});