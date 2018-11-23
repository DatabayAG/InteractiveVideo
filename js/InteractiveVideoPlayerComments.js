il.InteractiveVideoPlayerComments = (function (scope) {
	'use strict';

	let pub = {},
		pro = {},
		pri = {};

	pri.cssIterator = 0;
	pri.cssCommentClasses = ['crow1', 'crow2', 'crow3', 'crow4'];

	pub.sliceCommentAndStopPointsInCorrectPosition = function (tmp_obj, time, player_data)
	{
		//Todo: inject player
		let pos = 0;
		let i;

		for (i = 0; i < Object.keys(player_data.comments).length; i++)
		{
			if (parseFloat(player_data.comments[i].comment_time) <= time)
			{
				pos = i;
			}
		}
		player_data.comments.splice( pos + 1, 0 , tmp_obj);
		player_data.stopPoints.splice( pos + 1, 0, Math.floor(time));
	};

	pub.replaceCommentsAfterSeeking = function (time, player)
	{
		let player_data = scope.InteractiveVideoPlayerFunction.getPlayerDataObjectByPlayer(player);
		let player_id = scope.InteractiveVideoPlayerFunction.getPlayerIdFromPlayerObject(player);
		let i;
		let j_object = $("#ul_scroll");

		j_object.html('');
		pub.resetCommentsTimeEndBlacklist(player);
		for (i  = 0; i < Object.keys(player_data.comments).length; i++)
		{
			if (player_data.comments[i].comment_time <= time && player_data.comments[i].comment_text !== null)
			{
				j_object.prepend(pub.buildListElement(player, player_data.comments[i], player_data.comments[i].comment_time, player_data.comments[i].user_name));
				if(player_data.comments[i].comment_time_end > 0)
				{
					pub.fillCommentsTimeEndBlacklist(player_id, player_data.comments[i].comment_time_end, player_data.comments[i].comment_id);
				}
			}
		}
		pub.clearCommentsWhereTimeEndEndded(player_id, time);
	};

	pub.buildListElement = function (player_id, comment, time, username)
	{
		let css_class, value;
		let player_data = scope.InteractiveVideoPlayerFunction.getPlayerDataObjectByPlayerId(player_id);
		
		if(pro.isBuildListElementAllowed(player_data, username))
		{
			css_class = pro.getCSSClassForListElement();
			value =	'<li class="list_item_' + comment.comment_id + ' fadeOut ' + css_class + '">' +
				'<div class="message-inner">' +
							pro.buildCommentUserImage(player_data, comment)                   +
							'<div class="comment_user_data">' + pub.buildCommentUsernameHtml(username, comment.is_interactive) +
							pro.appendPrivateHtml(comment.is_private) +
							'<div class="comment_time">' +
							pro.buildCommentTimeHtml(time, comment.is_interactive)                           +
							pro.buildCommentTimeEndHtml(comment, player_id)                                             +
							'</div></div><div class="comment_inner_text">' +
							pro.buildCommentTitleHtml(comment.comment_title)                                 +
							pro.buildCommentTextHtml(comment.comment_text )                                  +
							pro.buildCommentReplies(comment.replies )                                        + 
							'</div></div>' +
							pro.buildCommentTagsHtml(comment.comment_tags)                                   +
					'</li>';
		}
		else
		{
			value = '';
		}

		return value;
	};

	pub.fillCommentsTimeEndBlacklist = function (player_id, comment_time_end, comment_id)
	{
		let player_data = scope.InteractiveVideo[player_id];

		if(player_data.blacklist_time_end[comment_time_end] === undefined)
		{
			player_data.blacklist_time_end[comment_time_end] = [comment_id];
		}
		else
		{
			player_data.blacklist_time_end[comment_time_end].push(comment_id);
		}
		pub.addHighlightToComment(comment_id);
	};

	pub.clearCommentsWhereTimeEndEndded = function (player_id, time)
	{
		let timestamp, id;

		for (timestamp in scope.InteractiveVideo[player_id].blacklist_time_end) 
		{
			if(timestamp <= time)
			{
				for (id in scope.InteractiveVideo[player_id].blacklist_time_end[timestamp]) 
				{
					pro.removeHighlightFromComment(scope.InteractiveVideo[player_id].blacklist_time_end[timestamp][id]);
				}

				delete scope.InteractiveVideo[player_id].blacklist_time_end[timestamp];
			}
		}
		il.InteractiveVideoPlayerFunction.refreshMathJaxView();
	};

	pub.clearAndRemarkCommentsAfterSeeking = function (time, player)
	{
		let player_data = scope.InteractiveVideoPlayerFunction.getPlayerDataObjectByPlayer(player);
		let i ;

		for (i  = 0; i < Object.keys(player_data.comments).length; i++)
		{
			if (player_data.comments[i].comment_text !== null)
			{
				pro.removeHighlightFromComment(player_data.comments[i].comment_id);
				if(player_data.comments[i].comment_time_end > 0 &&
					player_data.comments[i].comment_time <= time &&
					player_data.comments[i].comment_time_end >= time
					)
				{
					pub.addHighlightToComment(player_data.comments[i].comment_id);
				}
			}
		}
	};

	pub.addHighlightToComment = function (id)
	{
		$('.list_item_' + id).addClass('activeComment');
	};

	pub.resetCommentsTimeEndBlacklist = function ()
	{
		let player_data = scope.InteractiveVideoPlayerFunction.getPlayerDataObjectByPlayer(player);

		player_data.blacklist_time_end = [];
	};

	pub.displayAllCommentsAndDeactivateCommentStream = function(on)
	{
		//Todo: inject player
		let i;
		let j_object	= $("#ul_scroll");
		let element		='';

		j_object.html('');
		pri.cssIterator = 0;

		if(on)
		{
			for (i  = 0; i < Object.keys(scope.InteractiveVideo.comments).length; i++)
			{
				if (scope.InteractiveVideo.comments[i].comment_text !== null)
				{
					element = pub.buildListElement(scope.InteractiveVideo.comments[i], scope.InteractiveVideo.comments[i].comment_time, scope.InteractiveVideo.comments[i].user_name);
					j_object.append(element);
					if(scope.InteractiveVideo.comments[i].comment_time_end > 0 && scope.InteractiveVideo.comments[i].comment_time <= scope.InteractiveVideo.last_time)
					{
						pub.fillCommentsTimeEndBlacklist(scope.InteractiveVideo.comments[i].comment_time_end, scope.InteractiveVideo.comments[i].comment_id);
					}
				}
			}
			scope.InteractiveVideo.is_show_all_active = true;
			pub.clearCommentsWhereTimeEndEndded(scope.InteractiveVideo.last_time);
		}
		else
		{
			scope.InteractiveVideo.is_show_all_active = false;
			pub.replaceCommentsAfterSeeking(scope.InteractiveVideo.last_time);
		}
	};

	pub.rebuildCommentsViewIfShowAllIsActive = function(player_id)
	{
		let player_data = pub.getPlayerDataObjectByPlayerId(player_id);
		let j_object, position, height;

		if(player_data.is_show_all_active === true)
		{
			j_object = $('#ilInteractiveVideoComments_' + player_id);
			position = j_object.scrollTop();
			height   = $('#ilInteractiveVideoComments_' + player_id + ' #ul_scroll').find('li').first().height();
			player_data.is_show_all_active = false;
			pub.displayAllCommentsAndDeactivateCommentStream(true);
			j_object.scrollTop(position + height);
		}
	};

	pub.loadAllUserWithCommentsIntoFilterList = function()
	{
		let element;
		let author_list = pro.getAllUserWithComment();
		let dropdownList = $('#dropdownMenuInteraktiveList');
		let reset_elem = '<li><a href="#">' + scope.InteractiveVideo.lang.reset_text + '</a></li><li role="separator" class="divider"></li>';

		dropdownList.html('');
		dropdownList.append(reset_elem);
		for ( element in author_list) 
		{
			element = '<li><a href="#">' + element + '</a></li>';
			dropdownList.append(element);
		}
	};

	pub.fillEndTimeSelector = function(seconds)
	{

	};

	pub.preselectActualTimeInVideo = function(seconds)
	{
		let obj = pro.secondsToTimeCode(seconds);

		pro.preselectValueOfEndTimeSelection(obj, $('#comment_time_end'));
	};

	pro.isBuildListElementAllowed = function(player_data, username)
	{
		let value = false;

		if(player_data.is_show_all_active === false)
		{
			if(player_data.filter_by_user === false ||
					(   player_data.filter_by_user !== false &&
						player_data.filter_by_user === username
					)
				)
			{
				value = true;
			}
		}

		return value;
	};

	pro.setCorrectAttributeForTimeInCommentAfterPosting = function (id, time, player_id)
	{
		let player_data = scope.InteractiveVideoPlayerFunction.getPlayerDataObjectByPlayerId(player_id);
		let i;

		for (i  = 0; i < Object.keys(player_data.comments).length; i++)
		{
			if (player_data.comments[i].comment_id === id)
			{
				player_data.comments[i].comment_time_end = time;
			}
		}
	};

	pro.removeHighlightFromComment = function (id)
	{
		$('.list_item_' + id).removeClass('activeComment');
	};

	pro.getCSSClassForListElement = function()
	{
		let css_class;

		if(pri.cssIterator === pri.cssCommentClasses.length)
		{
			pri.cssIterator = 0;
		}

		css_class = pri.cssCommentClasses[pri.cssIterator];
		pri.cssIterator += 1;

		return css_class;
	};

	pro.buildCommentTimeHtml = function (time, is_interactive)
	{
		let display_time 	= time;

		if(parseInt(is_interactive, 10) === 1)
		{
			time = Math.abs(Math.round(time) - 0.1);
		}
		return 	'<time class="time"> ' +
				'<a onClick="il.InteractiveVideoPlayerAbstract.jumpToTimeInVideo(' + time + '); return false;">'+
				pro.secondsToTimeCode(display_time)  +
				'</a>' +
				'</time>' ;
	};

	pro.buildCommentTimeEndHtml = function (comment, player_id)
	{
		let display_time;

		if(comment.comment_time_end === undefined)
		{
			display_time 	= comment.comment_time_end;
			pro.setCorrectAttributeForTimeInCommentAfterPosting(comment.comment_id, display_time, player_id);
		}
		else
		{
			display_time 	= comment.comment_time_end;
		}

		if(display_time > 0)
		{
			return 	'<time class="time_end"> - ' +
					'<a onClick="il.InteractiveVideoPlayerAbstract.jumpToTimeInVideo(' + display_time + '); return false;">'+
					pro.secondsToTimeCode(display_time)  +
					'</a>' +
					'</time>' ;
		}
		else
		{
			return '';
		}
	};

	pub.buildCommentUsernameHtml = function (username, is_interactive)
	{
		let name = username;

		if(name !== '')
		{
			name = '' + name + '';
		}

		if(parseInt(is_interactive, 10) === 1)
		{
			name  = '[' + scope.InteractiveVideo.lang.question_text + ']';
		}
		return 	'<span class="comment_username"> ' + name + '</span>';
	};

	pro.buildCommentTitleHtml = function (title)
	{
		let t = title;

		if(t === null || t === undefined)
		{
			t = '';
		}
		return 	'<span class="comment_title">' + t + '</span> ';
	};

	pro.buildCommentTextHtml = function (text)
	{
		return '<span class="comment_text">' + text + '</span> ';
	};

	pro.buildCommentReplies = function (replies)
	{
		let value = '<span class="comment_replies">';

		if(replies !== undefined && replies.length > 0)
		{
			for (var i  = 0; i < replies.length; i++)
			{
				value += pub.getCommentRepliesHtml(replies[i]);
			}
		}
		return value + '</span>';
	};
	
	pub.getCommentRepliesHtml = function(reply)
	{
		return '<div class="reply_comment reply_comment_' + reply.comment_id + '">' + pub.buildCommentUsernameHtml(reply.user_name, reply.is_interactive) + ': ' + reply.comment_text + ' ' + pro.appendPrivateHtml(reply.is_private) + '</div>';
	};

	pro.appendPrivateHtml = function (is_private)
	{
		let private_comment = '';

		if(parseInt(is_private, 10) === 1 || is_private === true)
		{
			private_comment = ' (' + scope.InteractiveVideo.lang.private_text + ')';
		}
		else
		{
			private_comment = '';
		}
		return '<span class="private_text">'+ private_comment + '</span> ';
	};

	pro.buildCommentTagsHtml = function (tags)
	{
		let comment_tags    = '';

		if(tags == null || tags == '')
		{
			comment_tags = '';
		}
		else
		{
			comment_tags = '<span class="tag">' + tags.split(',').join('</span> <span class="tag">') + '</span> ';
		}
		return '<div class="comment_tags">' + comment_tags + '</div>';
	};

	pro.getAllUserWithComment = function()
	{
		//Todo: inject player
		let i, author_list = [];

		for (i  = 0; i < Object.keys(scope.InteractiveVideo.comments).length; i++)
		{
			if ($.inArray( scope.InteractiveVideo.comments[i].user_name, author_list ) === -1)
			{
				author_list[scope.InteractiveVideo.comments[i].user_name] = scope.InteractiveVideo.comments[i].user_name;
			}
		}
		return author_list;
	};

	pro.buildCommentUserImage = function(player_data, comment) 
	{
		let image = '';
		let user_id = comment.user_id;
		let decode = JSON.parse(player_data.user_image_cache);

		if(comment.user_id !== undefined && user_id in decode)
		{
			image = '<img src="' + decode[user_id] + '"/>';
		}
		else if('user_image' in comment)
		{
			image = '<img src="' + comment.user_image + '"/>';
		}
		
		if(parseInt(comment.is_interactive, 10) === 1)
		{
			image = '<img class="question_mark_comment" src="Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/templates/images/question_mark.svg"/>'
		}
		
		return '<div class="comment_user_image">' + image + '</div>';
	};
	
	pro.secondsToTimeCode = function(time) 
	{
		let obj = pro.convertSecondsToTimeObject(time);
		let h = pro.fillWithZeros(obj.hours);
		let m = pro.fillWithZeros(obj.minutes);
		let s = pro.fillWithZeros(obj.seconds);

		return h + ':' + m + ':' + s;
	};

	pro.fillWithZeros = function(number)
	{
		number = parseInt(number, 10);
		if(number === 0)
		{
			return '00';
		}
		else
		{
			if(number > 0 && number < 10)
			{
				return '0' + number;
			}
			else
			{
				return number;
			}
		}
	};
	
	pro.convertSecondsToTimeObject = function(time)
	{
		let obj = {};

		obj.hours  =  Math.floor(time / 3600) % 24;
		obj.minutes = Math.floor(time / 60) % 60;
		obj.seconds = Math.floor(time % 60);

		return obj;
	};

	pro.preselectValueOfEndTimeSelection = function(time, element)
	{
		element.val(time);
		$('#comment_time_end').timepicker('setTime', time);
	};
	
	pub.protect = pro;
	return pub;

}(il));