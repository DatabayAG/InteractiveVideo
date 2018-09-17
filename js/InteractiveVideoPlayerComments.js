il.InteractiveVideoPlayerComments = (function (scope) {
	'use strict';

	var pub = {},
		pro = {},
		pri = {};

	pri.cssIterator = 0;
	pri.cssCommentClasses = ['crow1', 'crow2', 'crow3', 'crow4'];

	pub.sliceCommentAndStopPointsInCorrectPosition = function (tmp_obj, time)
	{
		var pos = 0;
		var i;
		for (i = 0; i < Object.keys(scope.InteractiveVideo.comments).length; i++)
		{
			if (parseFloat(scope.InteractiveVideo.comments[i].comment_time) <= time)
			{
				pos = i;
			}
		}
		scope.InteractiveVideo.comments.splice( pos + 1, 0 , tmp_obj);
		scope.InteractiveVideo.stopPoints.splice( pos + 1, 0, Math.floor(time));
	};

	pub.replaceCommentsAfterSeeking = function (time)
	{
		var i;
		var j_object = $("#ul_scroll");
		j_object.html('');
		pub.resetCommentsTimeEndBlacklist();
		for (i  = 0; i < Object.keys(scope.InteractiveVideo.comments).length; i++)
		{
			if (scope.InteractiveVideo.comments[i].comment_time <= time && scope.InteractiveVideo.comments[i].comment_text !== null)
			{
				j_object.prepend(pub.buildListElement(scope.InteractiveVideo.comments[i], scope.InteractiveVideo.comments[i].comment_time, scope.InteractiveVideo.comments[i].user_name));
				il.InteractiveVideoPlayerComments.registerReplyToListeners();
				if(scope.InteractiveVideo.comments[i].comment_time_end > 0)
				{
					pub.fillCommentsTimeEndBlacklist(scope.InteractiveVideo.comments[i].comment_time_end, scope.InteractiveVideo.comments[i].comment_id);
				}
			}
		}
		pub.clearCommentsWhereTimeEndEnded(time);
	};

	pub.buildListElement = function (comment, time, username)
	{
		var css_class, value;

		if(pro.isBuildListElementAllowed(username))
		{
			css_class = pro.getCSSClassForListElement();
			value =	'<li class="list_item_' + comment.comment_id + ' fadeOut ' + css_class + '">' +
				'<div class="message-inner">' +
							pro.buildCommentUserImage(comment)                   +
							'<div class="comment_user_data">' + pub.buildCommentUsernameHtml(username, comment.is_interactive) +
							pro.appendPrivateHtml(comment.is_private) +
							'<div class="comment_time">' +
							pro.buildCommentTimeHtml(time, comment.is_interactive)                           +
							pro.buildCommentTimeEndHtml(comment)                                             +
							'</div></div><div class="comment_inner_text">' +
							pro.buildCommentTitleHtml(comment.comment_title)                                 +
							pro.buildCommentTextHtml(comment.comment_text )                                  +
							pro.buildCommentReplies(comment.replies )                                        +
							pro.buildReplyTo(comment.comment_id, comment)
							+'</div></div>' +
							pro.buildCommentTagsHtml(comment.comment_tags)                                   +
					'</li>';
		}
		else
		{
			value = '';
		}
		return value;
	};

	pro.buildReplyTo = function(id, comment)
	{
		if('has_no_reply_button' in comment)
		{
			if(comment.has_no_reply_button === true)
			{
				return '';
			}
		}
		return '<div class="glyphicon glyphicon-share-alt flip_float_right reply_to_comment" data-reply-to-id="'+id+'" aria-hidden="true" title="' +il.InteractiveVideo.lang.reply_to_title + '"></div>';
	};

	pro.appendReplyToHiddenField = function(id)
	{
		$('#ilInteractiveVideoCommentsForm').append('<input type="hidden" value="' + id + '"/>');
	};

	pub.registerReplyToListeners = function()
	{
		var reply_object = $('.reply_to_comment');
		reply_object.off("click");
		reply_object.on("click", function() {
			console.log('clicked on comment id ' + $(this).data('reply-to-id'));
			var comment_id = 'list_item_'+ $(this).data('reply-to-id');
			var comment_container = 'list_item_container_'+ $(this).data('reply-to-id');
			var comment_object = $('.' + comment_id);
			if($('#' + comment_id).length === 0)
			{
				comment_object.append('');
				comment_object.append('<div id="'+comment_container+'" class="reply_to_container"><input type="text" class="reply_to_input_form" id="'+comment_id+'"/><input id="submit_comment_form" class="btn btn-default btn-sm submit_comment_form_to_reply" value="'+scope.InteractiveVideo.lang.save+'" type="submit"></div>');
				scope.InteractiveVideoPlayerFunction.addAjaxFunctionForReplyPosting($(this).data('reply-to-id'), $(this).data('reply-to-id'));
			}
			else
			{
				$('#' + comment_container).remove();
			}
		});
	};

	pub.fillCommentsTimeEndBlacklist = function (comment_time_end, comment_id)
	{
		if(scope.InteractiveVideo.blacklist_time_end[comment_time_end] === undefined)
		{
			scope.InteractiveVideo.blacklist_time_end[comment_time_end] = [comment_id];
		}
		else
		{
			scope.InteractiveVideo.blacklist_time_end[comment_time_end].push(comment_id);
		}
		pub.addHighlightToComment(comment_id);
	};

	pub.clearCommentsWhereTimeEndEnded = function (time)
	{
		var timestamp, id;
		for (timestamp in scope.InteractiveVideo.blacklist_time_end) 
		{
			if(timestamp <= time)
			{
				for (id in scope.InteractiveVideo.blacklist_time_end[timestamp]) 
				{
					pro.removeHighlightFromComment(scope.InteractiveVideo.blacklist_time_end[timestamp][id]);
				}

				delete scope.InteractiveVideo.blacklist_time_end[timestamp];
			}
		}
		il.InteractiveVideoPlayerFunction.refreshMathJaxView();
	};

	pub.clearAndRemarkCommentsAfterSeeking = function (time)
	{
		var i ;
		for (i  = 0; i < Object.keys(scope.InteractiveVideo.comments).length; i++)
		{
			if (scope.InteractiveVideo.comments[i].comment_text !== null)
			{
				pro.removeHighlightFromComment(scope.InteractiveVideo.comments[i].comment_id);
				if(scope.InteractiveVideo.comments[i].comment_time_end > 0 && 
						scope.InteractiveVideo.comments[i].comment_time <= time && 
						scope.InteractiveVideo.comments[i].comment_time_end >= time
					)
				{
					pub.addHighlightToComment(scope.InteractiveVideo.comments[i].comment_id);
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
		scope.InteractiveVideo.blacklist_time_end = [];
	};

	pub.displayAllCommentsAndDeactivateCommentStream = function(on)
	{
		var i;
		var j_object	= $("#ul_scroll");
		var element		='';
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
					il.InteractiveVideoPlayerComments.registerReplyToListeners();
					if(scope.InteractiveVideo.comments[i].comment_time_end > 0 && scope.InteractiveVideo.comments[i].comment_time <= scope.InteractiveVideo.last_time)
					{
						pub.fillCommentsTimeEndBlacklist(scope.InteractiveVideo.comments[i].comment_time_end, scope.InteractiveVideo.comments[i].comment_id);
					}
				}
			}
			scope.InteractiveVideo.is_show_all_active = true;
			pub.clearCommentsWhereTimeEndEnded(scope.InteractiveVideo.last_time);
		}
		else
		{
			scope.InteractiveVideo.is_show_all_active = false;
			pub.replaceCommentsAfterSeeking(scope.InteractiveVideo.last_time);
		}
		pub.registerReplyToListeners();
	};

	pub.rebuildCommentsViewIfShowAllIsActive = function()
	{
		var j_object, position, height;

		if(scope.InteractiveVideo.is_show_all_active === true)
		{
			j_object = $('#ilInteractiveVideoComments');
			position = j_object.scrollTop();
			height   = $('#ul_scroll').find('li').first().height();
			scope.InteractiveVideo.is_show_all_active = false;
			pub.displayAllCommentsAndDeactivateCommentStream(true);
			j_object.scrollTop(position + height);
		}
	};

	pub.loadAllUserWithCommentsIntoFilterList = function()
	{
		var element;
		var author_list = pro.getAllUserWithComment();
		var dropDownList = $('#dropdownMenuInteraktiveList');
		var reset_elem = '<li><a href="#">' + scope.InteractiveVideo.lang.reset_text + '</a></li><li role="separator" class="divider"></li>';

		dropDownList.html('');
		dropDownList.append(reset_elem);
		for ( element in author_list) 
		{
			element = '<li><a href="#">' + element + '</a></li>';
			dropDownList.append(element);
		}
	};

	pub.fillEndTimeSelector = function(seconds)
	{

	};

	pub.preselectActualTimeInVideo = function(seconds)
	{
		var obj = pub.secondsToTimeCode(seconds);

		pro.preselectValueOfEndTimeSelection(obj, $('#comment_time_end'));
	};

	pro.isBuildListElementAllowed = function(username)
	{
		var value = false;
		if(scope.InteractiveVideo.is_show_all_active === false)
		{
			if(scope.InteractiveVideo.filter_by_user === false ||
					(   scope.InteractiveVideo.filter_by_user !== false && 
						scope.InteractiveVideo.filter_by_user === username
					)
				)
			{
				value = true;
			}
		}
		return value;
	};

	pro.setCorrectAttributeForTimeInCommentAfterPosting = function (id, time)
	{
		var i;
		for (i  = 0; i < Object.keys(scope.InteractiveVideo.comments).length; i++)
		{
			if (scope.InteractiveVideo.comments[i].comment_id === id)
			{
				scope.InteractiveVideo.comments[i].comment_time_end = time;
			}
		}
	};

	pro.removeHighlightFromComment = function (id)
	{
		$('.list_item_' + id).removeClass('activeComment');
		$('.interactive_overlay_element_' + id).remove();
	};

	pro.getCSSClassForListElement = function()
	{
		var css_class;

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
		var display_time 	= time;
		if(parseInt(is_interactive, 10) === 1)
		{
			time = Math.abs(Math.round(time) - 0.1);
		}
		return 	'<time class="time"> ' +
				'<a onClick="il.InteractiveVideoPlayerAbstract.jumpToTimeInVideo(' + time + '); return false;">'+
				pub.secondsToTimeCode(display_time)  +
				'</a>' +
				'</time>' ;
	};

	pro.buildCommentTimeEndHtml = function (comment)
	{
		var display_time;
		if(comment.comment_time_end === undefined)
		{
			display_time 	= comment.comment_time_end;
			pro.setCorrectAttributeForTimeInCommentAfterPosting(comment.comment_id, display_time);
		}
		else
		{
			display_time 	= comment.comment_time_end;
		}

		if(display_time > 0)
		{
			return 	'<time class="time_end"> - ' +
					'<a onClick="il.InteractiveVideoPlayerAbstract.jumpToTimeInVideo(' + display_time + '); return false;">'+
					pub.secondsToTimeCode(display_time)  +
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
		var name = username;

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
		var t = title;

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
		var value = '<div class="comment_replies">';
		if(replies !== undefined && replies.length > 0)
		{
			for (var i  = 0; i < replies.length; i++)
			{
				value += pub.getCommentRepliesHtml(replies[i]);
			}
		}
		return value + '</div>';
	};
	
	pub.getCommentRepliesHtml = function(reply)
	{
		return '<div class="reply_comment reply_comment_' + reply.comment_id + '">' + pub.buildCommentUsernameHtml(reply.user_name, reply.is_interactive) + ': ' + reply.comment_text + ' ' + pro.appendPrivateHtml(reply.is_private) + '</div>';
	};

	pro.appendPrivateHtml = function (is_private)
	{
		var private_comment = '';

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
		var comment_tags    = '';
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
		var i, author_list = [];

		for (i  = 0; i < Object.keys(scope.InteractiveVideo.comments).length; i++)
		{
			if ($.inArray( scope.InteractiveVideo.comments[i].user_name, author_list ) === -1)
			{
				author_list[scope.InteractiveVideo.comments[i].user_name] = scope.InteractiveVideo.comments[i].user_name;
			}
		}
		return author_list;
	};

	pro.buildCommentUserImage = function(comment) 
	{
		var image = '';
		var user_id = comment.user_id;
		var decode = JSON.parse(il.InteractiveVideo.user_image_cache);
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
	
	pub.secondsToTimeCode = function(time) 
	{
		var obj = pro.convertSecondsToTimeObject(time);
		var h = pro.fillWithZeros(obj.hours);
		var m = pro.fillWithZeros(obj.minutes);
		var s = pro.fillWithZeros(obj.seconds);
		return h + ':' + m + ':' + s;
	};

	pro.fillWithZeros = function(number)
	{
		number = parseInt(number, 10);
		if(number == 0)
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
		var obj = {};

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