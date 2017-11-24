il.InteractiveVideoPlayerAdventure = (function (scope) {
	'use strict';

	const pri = {
		text_cell_class     : "interactiveVideoAdventureTextCell",
		text_class          : "interactiveVideoAdventureText",
		disable_click_class : "interactiveVideoAdventureDisableClickThrough",
		video_id            : "ilInteractiveVideo",
		play_btn            : ".vjs-big-play-button .vjs-icon-placeholder"
	};

	var pub = {}, pro = {
		adventureData : {
			"1" : [
					{ 
						html : "<i>Homeopatisches Mittel.</i>",
						jumpTo : 60,
						id: 0
					},
					{
						html : "Aussitzen.",
						jumpTo : 65,
						id: 1
					},
					{
						html : "Harter Medikamenten Cocktail.",
						jumpTo : 10,
						id: 2
					},
					{
						html : "OP",
						jumpTo : 5,
						id: 3
					}
				],
			"15" :
				[
					{
						html : "Curabitur.",
						jumpTo : 60,
						id: 4
					},
					{
						html : "YEEEEEEEEEEEEHA",
						jumpTo : 15,
						id: 5
					}
				]
			,
			"61" :
				[
					{
						html : "Curabitur non nulla sit amet nisl tempus convallis quis ac lectus. Sed porttitor lectus nibh. Curabitur arcu erat, accumsan id imperdiet et, porttitor at sem. Sed porttitor lectus nibh. Donec rutrum congue leo eget malesuada. Pellentesque in ipsum id orci porta dapibus. Mauris blandit aliquet elit, eget tincidunt nibh pulvinar a. Vivamus suscipit tortor eget felis porttitor volutpat. Nulla porttitor accumsan tincidunt. Cras ultricies ligula sed magna dictum porta. Pellentesque in ipsum id orci porta dapibus. Vivamus suscipit tortor eget felis porttitor volutpat. Cras ultricies ligula sed magna dictum porta. Vivamus magna justo, lacinia eget consectetur sed, convallis at tellus. Vivamus suscipit tortor eget felis porttitor volutpat. Donec rutrum congue leo eget malesuada. Mauris blandit aliquet elit, eget tincidunt nibh pulvinar a. Vestibulum ac diam sit amet quam vehicula elementum sed sit amet dui. Donec sollicitudin molestie malesuada. Nulla quis lorem ut libero malesuada feugiat..",
						jumpTo : 10,
						id: 6
					},
					{
						html : "YEEEEEEEEEEEEHA",
						jumpTo : 15,
						id: 7
					}
				]
		},
		jumpPath : [],
		stopPoints : [1, 15, 61]
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

	pro.appendQuestionTextCell = function(id, jumpTo, text, cueTime) 
	{
		$('.' + pri.text_class).append(
			'<div class="' + pri.text_cell_class + '" ' +
			'data-time="' + jumpTo + '" ' +
			'data-cue-time="' + cueTime + '" ' +
			'data-jump-id="' + id + '" ">' +
			text + '</div>'
		);
	};

	pro.drawHtmlOverlay = function(cueTime)
	{
		pro.lowerPlayButtonOpacityIfQuestionsAreShown();

		$('#' + pri.video_id).children().first().after(
			'<div class="' + pri.text_class + '"></div>' +
			'<div class="' + pri.disable_click_class + '"></div>'
		);

		$.each(pro.adventureData[cueTime], function (index, value) {
			pro.appendQuestionTextCell(value.id, value.jumpTo, value.html ,cueTime);
		});

		var point = pro.getTimeFromLastJumpToPoint();
		pro.appendQuestionTextCell(-1, point, 'Szene wiederholen' ,-1);

		pro.registerClickEventForOverlays();
	};

	pro.getTimeFromLastJumpToPoint = function(length)
	{
		var last_jump_point = null;
		var loop_return_value = null;
		if(length === null || typeof length == 'undefined')
		{
			length = +1;
		}

		last_jump_point = pro.jumpPath[pro.jumpPath.length - length];
		if((typeof last_jump_point === "undefined"))
		{
			return 0;
		}
		else if(last_jump_point === -1 || last_jump_point === "-1")
		{
			length = length +1;
			return pro.getTimeFromLastJumpToPoint(length);
		}

		$.each(pro.adventureData, function (index, question) {
			var break_out = false;
			$.each(question, function (second_index, value) {
				if(value.id == last_jump_point)
				{
					loop_return_value = value.jumpTo;
					break_out = true;
					return false;
				}
			});

			if(break_out)
			{
				return false;
			}
		});

		if(loop_return_value !== null)
		{
			return loop_return_value;
		}
		
	};

	pro.lowerPlayButtonOpacityIfQuestionsAreShown = function()
	{
		var opacity = $(pri.play_btn).css('opacity');

		if(opacity === null || opacity === "1")
		{
			$(pri.play_btn).css('opacity', 0.2);
		}
		else
		{
			$(pri.play_btn).css('opacity', 1);
		}
	};

	pro.fireOverlayClickEvent = function(that) 
	{
		$('.' + pri.text_class).remove();
		$('.' + pri.disable_click_class).remove();
		il.InteractiveVideoPlayerAbstract.jumpToTimeInVideo(that.data('time'));

		pro.jumpPath.push(that.data('jump-id'));
		pro.lowerPlayButtonOpacityIfQuestionsAreShown();

		il.InteractiveVideoPlayerAbstract.play();

		console.log(pro.jumpPath);
	};

	pro.registerClickEventForOverlays = function()
	{
		var selector = $('.' + pri.text_cell_class);
		selector.off('click');

		selector.on('click', function(){
			pro.fireOverlayClickEvent($(this));
		});
	};

	pub.Init = function()
	{
		il.InteractiveVideoPlayerAbstract.config.removeNonAdventureElements();
	};

	pub.protect = pro;
	return pub;

}(il));