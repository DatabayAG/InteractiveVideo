il.InteractiveVideoPlayerUtils = (function (scope) {
	'use strict';

	var pub = {}, pro = {}, pri = {};

	pri.cssIterator = 0;
	pri.cssCommentClasses = ['crow1', 'crow2', 'crow3', 'crow4'];

	pub.sliceCommentAndStopPointsInCorrectPosition = function (tmp_obj, time)
	{
		var pos = 0;
		var i;
		for (i = 0; i < Object.keys(scope.InteractiveVideo.comments).length; i++)
		{
			if (scope.InteractiveVideo.comments[i].comment_time <= time)
			{
				pos = i;
			}
		}
		scope.InteractiveVideo.comments.splice( pos + 1, 0 , tmp_obj);
		stopPoints.splice( pos + 1, 0, Math.floor(time));
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
				if(scope.InteractiveVideo.comments[i].comment_time_end > 0)
				{
					pub.fillCommentsTimeEndBlacklist(scope.InteractiveVideo.comments[i].comment_time_end, scope.InteractiveVideo.comments[i].comment_id);
				}
			}
		}
		pub.clearCommentsWhereTimeEndEndded(time);
	};

	pub.jumpToTimeInVideo = function (time)
	{
		scope.InteractiveVideoPlayerAbstract.play();
		scope.InteractiveVideoPlayerAbstract.pause();
		if(time !== null)
		{
			scope.InteractiveVideoPlayerAbstract.setCurrentTime(time);
			scope.InteractiveVideo.last_stopPoint = time;
		}
		pub.resumeVideo();
	};

	pub.resumeVideo = function ()
	{
		if(scope.InteractiveVideo.auto_resume === true)
		{
			scope.InteractiveVideoPlayerAbstract.play();
		}
	};

	pro.isBuildListElementAllowed = function(username)
	{
		if(scope.InteractiveVideo.is_show_all_active === false)
		{
			if(scope.InteractiveVideo.filter_by_user === false ||
					(scope.InteractiveVideo.filter_by_user !== false && scope.InteractiveVideo.filter_by_user === username))
			{
				return true;
			}
		}
		return false;
	};
	
	pub.buildListElement = function (comment, time, username)
	{
		var css_class;
		if(pro.isBuildListElementAllowed(username))
		{
			css_class = pro.getCSSClassForListelement();
			return 	'<li class="list_item_' + comment.comment_id + ' fadeOut ' + css_class +'">' +
					pro.builCommentTimeHtml(time, comment.is_interactive) +
					pro.builCommentTimeEndHtml(comment) +
					pro.builCommentUsernameHtml(username, comment.is_interactive) +
					pro.builCommentTitleHtml(comment.comment_title) +
					pro.builCommentTextHtml(comment.comment_text ) +
					pro.appendPrivateHtml(comment.is_private) +
					pro.builCommentTagsHtml(comment.comment_tags) +
					'</li>';
		}
		else
		{
			return '';
		}
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

	pub.clearCommentsWhereTimeEndEndded = function (time)
	{
		var timestamp, id;
		for (timestamp in scope.InteractiveVideo.blacklist_time_end) 
		{
			if(timestamp <= time)
			{
				for (id in scope.InteractiveVideo.blacklist_time_end[timestamp]) 
				{
					pro.removeHighlightFromComment(il.InteractiveVideo.blacklist_time_end[timestamp][id]);
				}

				delete scope.InteractiveVideo.blacklist_time_end[timestamp];
			}
		}
	};

	pub.clearAndRemarkCommentsAfterSeeking = function (time)
	{
		var i ;
		for (i  = 0; i < Object.keys(scope.InteractiveVideo.comments).length; i++)
		{
			if (scope.InteractiveVideo.comments[i].comment_text !== null)
			{
				pro.removeHighlightFromComment(scope.InteractiveVideo.comments[i].comment_id);
				if(scope.InteractiveVideo.comments[i].comment_time_end > 0 && scope.InteractiveVideo.comments[i].comment_time <= time && scope.InteractiveVideo.comments[i].comment_time_end >= time)
				{
					pub.addHighlightToComment(scope.InteractiveVideo.comments[i].comment_id);
				}
			}
		}
	};

	pro.setCorrectAttributeForTimeInCommentAfterPosting = function (id, time)
	{
		var i ;
		for (i  = 0; i < Object.keys(scope.InteractiveVideo.comments).length; i++)
		{
			if (scope.InteractiveVideo.comments[i].comment_id === id)
			{
				scope.InteractiveVideo.comments[i].comment_time_end = time;
			}
		}
	};
	
	pub.addHighlightToComment = function (id)
	{
		$('.list_item_' + id).addClass('activeComment');
	};

	pro.removeHighlightFromComment = function (id)
	{
		$('.list_item_' + id).removeClass('activeComment');
	};

	pub.resetCommentsTimeEndBlacklist = function ()
	{
		scope.InteractiveVideo.blacklist_time_end = [];
	};
	
	pro.getCSSClassForListelement = function()
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

	pro.builCommentTimeHtml = function (time, is_interactice)
	{
		var display_time 	= time;
		if(parseInt(is_interactice, 10) === 1)
		{
			time = Math.abs(Math.round(time) - 0.1);
		}
		return 	'<time class="time"> ' +
					'<a onClick="il.InteractiveVideoPlayerUtils.jumpToTimeInVideo(' + time + '); return false;">'+ 
						mejs.Utility.secondsToTimeCode(display_time)  + 
					'</a>' +
				'</time>' ;
	};

	pro.builCommentTimeEndHtml = function (comment)
	{
		var h, m, s,display_time;
		if(comment.comment_time_end === undefined)
		{
			h = parseInt(comment.comment_time_end_h, 10) * 3600;
			m = parseInt(comment.comment_time_end_m, 10) * 60;
			s = parseInt(comment.comment_time_end_s, 10);
			display_time 	= h + m + s;
			pro.setCorrectAttributeForTimeInCommentAfterPosting(comment.comment_id, display_time);
		}
		else
		{
			display_time 	= comment.comment_time_end;
		}
		if(display_time > 0)
		{
			return 	'<time class="time_end"> - ' +
					'<a onClick="il.InteractiveVideoPlayerUtils.jumpToTimeInVideo(' + display_time + '); return false;">'+
					mejs.Utility.secondsToTimeCode(display_time)  +
					'</a>' +
					'</time>' ;
		}
		else
		{
			return '';
		}

	};

	pro.builCommentUsernameHtml = function (username, is_interactive)
	{
		if(username !== '')
		{
			username = '[' + username + ']';
		}
		if(parseInt(is_interactive, 10) === 1)
		{
			username  = '[' + il.InteractiveVideo.lang.question_text + ']';
		}
		return 	'<span class="comment_username"> ' + username + '</span> ';
	};

	pro.builCommentTitleHtml = function (title)
	{
		if(title === null || title === undefined)
		{
			title = '';
		}
		return 	'<span class="comment_title">' + title + '</span> ';
	};

	pro.builCommentTextHtml = function (text)
	{
		return '<span class="comment_text">' + text + '</span> ';
	};

	pro.appendPrivateHtml = function (is_private)
	{
		var private_comment = '';
		if(parseInt(is_private, 10) === 1 || is_private === true)
		{
			private_comment = ' (' + il.InteractiveVideo.lang.private_text + ')';
		}
		else
		{
			private_comment = '';
		}
		return '<span class="private_text">'+ private_comment + '</span> ';
	};

	pro.builCommentTagsHtml = function (tags)
	{
		var comment_tags    = '';
		if(tags == null)
		{
			comment_tags = '';
		}
		else
		{
			comment_tags = '<span class="tag">' + tags.split(',').join('</span> <span class="tag">') + '</span> ';
		}
		return '<br/><div class="comment_tags">' + comment_tags + '</div>';
	};

	pub.displayAllCommentsAndDeactivateCommentStream = function(on)
	{
		var i;
		var j_object = $("#ul_scroll");
		j_object.html('');
		pri.cssIterator = 0;
		if(on)
		{
			for (i  = 0; i < Object.keys(scope.InteractiveVideo.comments).length; i++)
			{
				if (scope.InteractiveVideo.comments[i].comment_text !== null)
				{
					j_object.prepend(pub.buildListElement(scope.InteractiveVideo.comments[i], scope.InteractiveVideo.comments[i].comment_time, scope.InteractiveVideo.comments[i].user_name));
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

	pub.rebuildCommentsViewIfShowAllIsActive = function()
	{
		if(scope.InteractiveVideo.is_show_all_active === true)
		{
			var j_object = $('#ilInteractiveVideoComments');
			var position = j_object.scrollTop();
			var height   = $('#ul_scroll').find('li').first().height();
			scope.InteractiveVideo.is_show_all_active = false;
			pub.displayAllCommentsAndDeactivateCommentStream(true);
			j_object.scrollTop(position + height);
		}
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

	pub.loadAllUserWithCommentsIntoFilterList = function()
	{
		var element;
		var author_list = pro.getAllUserWithComment();
		var dropdownList = $('#dropdownMenuInteraktiveList');
		var reset_elem = '<li><a href="#">' + scope.InteractiveVideo.lang.reset_text + '</a></li><li role="separator" class="divider"></li>';
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
		var h, m, s, i, options;
		var h_exists = false;
		var m_exists = false;
		h = Math.floor(seconds / 3600) % 24; 
		m = Math.floor(seconds / 60) % 60;
		s = Math.floor(seconds % 60);
		options = '';
		for(i=1; i <= h; i++)
		{
			if(i<10)
			{
				i = '0' + i;
			}
			options += '<option value="' + i + '">' + i + '</option>';
			h_exists = true;
		}
		$('#comment_time_end\\[time\\]_h').append(options);
		options = '';
		if(h_exists === true)
		{
			m = 59;
		}
		for(i=1; i <= m; i++)
		{
			if(i<10)
			{
				i = '0' + i;
			}
			options += '<option value="' + i + '">' + i + '</option>';
			m_exists = true;
		}
		$('#comment_time_end\\[time\\]_m').append(options);
		options = '';
		if(m_exists === true)
		{
			s = 59;
		}
		for(i=1; i <= s; i++)
		{
			if(i<10)
			{
				i = '0' + i;
			}
			options += '<option value="' + i + '">' + i + '</option>';
		}
		$('#comment_time_end\\[time\\]_s').append(options);
	};

	pub.preselectActualTimeInVideo = function(seconds)
	{
		var h, m, s;
		h = Math.floor(seconds / 3600) % 24;
		pro.preselectValueOfEndTimeSelection(h, $('#comment_time_end\\[time\\]_h'));

		m = Math.floor(seconds / 60) % 60;
		pro.preselectValueOfEndTimeSelection(m, $('#comment_time_end\\[time\\]_m'));

		s = Math.floor(seconds % 60);
		pro.preselectValueOfEndTimeSelection(s, $('#comment_time_end\\[time\\]_s'));

	};

	pro.preselectValueOfEndTimeSelection = function(time, element)
	{
		if(time < 10)
		{
			time = '0' + time;
		}
		element.val(time);
	};

	pub.protect = pro;
	return pub;

}(il));