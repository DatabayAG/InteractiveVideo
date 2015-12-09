il.InteractiveVideoPlayerUtils = (function () {
	'use strict';

	var pub = {}, pro = {}, pri = {};

	pri.cssIterator = 0;
	pri.cssCommentClasses = ['crow1', 'crow2', 'crow3', 'crow4'];

	pub.sliceCommentAndStopPointsInCorrectPosition = function (tmp_obj, time)
	{
		var pos = 0;
		var i;
		for (i = 0; i < Object.keys(comments).length; i++)
		{
			if (comments[i].comment_time <= time)
			{
				pos = i;
			}
		}
		comments.splice( pos + 1, 0 , tmp_obj);
		stopPoints.splice( pos + 1, 0, Math.floor(time));
	};

	pub.replaceCommentsAfterSeeking = function (time)
	{
		var i;
		var j_object = $("#ul_scroll");
		j_object.html('');
		pub.resetCommentsTimeEndBlacklist();
		for (i  = 0; i < Object.keys(comments).length; i++)
		{
			if (comments[i].comment_time <= time && comments[i].comment_text !== null)
			{
				j_object.prepend(pub.buildListElement(comments[i], comments[i].comment_time, comments[i].user_name));
				if(comments[i].comment_time_end > 0)
				{
					pub.fillCommentsTimeEndBlacklist(comments[i].comment_time_end, comments[i].comment_id);
				}
			}
		}
		pub.clearCommentsWhereTimeEndEndded(time);
	};

	pub.jumpToTimeInVideo = function (time)
	{
		var video_player = $('#ilInteractiveVideo')['0'];
		video_player.play();
		video_player.pause();
		if(time !== null)
		{
			video_player.setCurrentTime(time);
			il.InteractiveVideo.last_stopPoint = time;
		}
		pub.resumeVideo();
	};

	pub.resumeVideo = function ()
	{
		if(il.InteractiveVideo.auto_resume === true)
		{
			$('#ilInteractiveVideo')['0'].play();
		}
	};

	pro.isBuildListElementAllowed = function(username)
	{
		if(il.InteractiveVideo.is_show_all_active === false)
		{
			if(il.InteractiveVideo.filter_by_user === false ||
					(il.InteractiveVideo.filter_by_user !== false && il.InteractiveVideo.filter_by_user === username))
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
		if(il.InteractiveVideo.blacklist_time_end[comment_time_end] === undefined)
		{
			il.InteractiveVideo.blacklist_time_end[comment_time_end] = [comment_id];
		}
		else
		{
			il.InteractiveVideo.blacklist_time_end[comment_time_end].push(comment_id);
		}
		pub.addHighlightToComment(comment_id);
	};

	pub.clearCommentsWhereTimeEndEndded = function (time)
	{
		var timestamp, id;
		for (timestamp in il.InteractiveVideo.blacklist_time_end) 
		{
			if(timestamp <= time)
			{
				for (id in il.InteractiveVideo.blacklist_time_end[timestamp]) 
				{
					pro.removeHighlightFromComment(il.InteractiveVideo.blacklist_time_end[timestamp][id]);
				}

				delete il.InteractiveVideo.blacklist_time_end[timestamp];
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
		il.InteractiveVideo.blacklist_time_end = [];
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
			username  = '[' + question_text + ']';
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
		if(parseInt(is_private, 10) === 1)
		{
			private_comment = ' (' + private_text + ')';
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
		var html = '';
		var i;
		if(on)
		{
			for (i  = 0; i < Object.keys(comments).length; i++)
			{
				if (comments[i].comment_text !== null)
				{
					html = pub.buildListElement(comments[i], comments[i].comment_time, comments[i].user_name) + html;
				}
			}
			il.InteractiveVideo.is_show_all_active = true;
			$("#ul_scroll").html(html);
		}
		else
		{
			il.InteractiveVideo.is_show_all_active = false;
			pub.replaceCommentsAfterSeeking(il.InteractiveVideo.last_time);
		}
	};
	
	pro.getAllUserWithComment = function()
	{
		var i, author_list = [];
		for (i  = 0; i < Object.keys(comments).length; i++)
		{
			if ($.inArray( comments[i].user_name, author_list ) === -1)
			{
				author_list[comments[i].user_name] = comments[i].user_name;
			}
		}
		return author_list;
	};

	pub.loadAllUserWithCommentsIntoFilterList = function()
	{
		var element;
		var author_list = pro.getAllUserWithComment();
		var dropdownList = $('#dropdownMenuInteraktiveList');
		var reset_elem = '<li><a href="#">' + reset_text + '</a></li><li role="separator" class="divider"></li>';
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
	
	pub.protect = pro;
	return pub;

}());