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
		var html = '';
		var i;
		for (i  = 0; i < Object.keys(comments).length; i++)
		{
			if (comments[i].comment_time <= time && comments[i].comment_text !== null)
			{
				html = pub.buildListElement(comments[i], comments[i].comment_time, comments[i].user_name) + html;
			}
		}
		$("#ul_scroll").html(html);
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
	
	pub.buildListElement = function (comment, time, username, counter)
	{
		var css_class = '';
		if(pro.isBuildListElementAllowed(username))
		{
			css_class = pro.getCSSClassForListelement();
			return 	'<li class="list_item_' + counter + ' ' + css_class +'">' +
					pro.builCommentTimeHtml(time, comment.is_interactive) +
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
	
	pub.protect = pro;
	return pub;

}());