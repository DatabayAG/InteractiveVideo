il.InteractiveVideoPlayerComments = (function (scope) {
	'use strict';

	let pub = {},
		pro = {},
		pri = {};

	pri.cssIterator = 0;
	pri.cssCommentClasses = ['crow1', 'crow2', 'crow3', 'crow4'];

	pub.sliceCommentAndStopPointsInCorrectPosition = function (tmp_obj, time, player_data)
	{
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

	pub.replaceCommentsAfterSeeking = function (time, player_id)
	{
		let player_data = scope.InteractiveVideoPlayerFunction.getPlayerDataObjectByPlayerId(player_id);
		let i;
		let j_object = $("#ul_scroll_" + player_id);

		j_object.html('');
		pub.resetCommentsTimeEndBlacklist(player_id);
		for (i  = 0; i < Object.keys(player_data.comments).length; i++)
		{
			if (player_data.comments[i].comment_time <= time && player_data.comments[i].comment_text !== null)
			{
				j_object.prepend(pub.buildListElement(player_id, player_data.comments[i], player_data.comments[i].comment_time, player_data.comments[i].user_name));
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
		
		if(pro.isBuildListElementAllowed(player_data, username) && 	comment.is_table_of_content === "0")
		{
			css_class = pro.getCSSClassForListElement();
			value =	'<li class="list_item_' + comment.comment_id + ' fadeOut ' + css_class + '">' +
				'<div class="message-inner">' +
							pro.buildCommentUserImage(player_data, comment)                   +
							'<div class="comment_user_data">' + pub.buildCommentUsernameHtml(username, comment.is_interactive) +
							pro.appendPrivateHtml(comment.is_private) +
							'<div class="comment_time">' +
							pro.buildCommentTimeHtml(time, comment.is_interactive, player_id)                           +
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
		let player_data = scope.InteractiveVideoPlayerFunction.getPlayerDataObjectByPlayerId(player_id);

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
		let player_data = il.InteractiveVideoPlayerFunction.getPlayerDataObjectByPlayerId(player_id);

		for (timestamp in player_data.blacklist_time_end) 
		{
			if(timestamp <= time)
			{
				for (id in player_data.blacklist_time_end[timestamp]) 
				{
					pro.removeHighlightFromComment(player_data.blacklist_time_end[timestamp][id]);
				}

				delete player_data.blacklist_time_end[timestamp];
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

	pub.resetCommentsTimeEndBlacklist = function (player_id)
	{
		let player_data = scope.InteractiveVideoPlayerFunction.getPlayerDataObjectByPlayerId(player_id);

		player_data.blacklist_time_end = [];
	};

	pub.displayAllCommentsAndDeactivateCommentStream = function(on, player_id)
	{
		let player_data = scope.InteractiveVideoPlayerFunction.getPlayerDataObjectByPlayerId(player_id);
		let i;
		let j_object	= $('#ilInteractiveVideoComments_' + player_id + ' #ul_scroll_' + player_id);
		let element		='';

		j_object.html('');
		pri.cssIterator = 0;

		if(on)
		{
			for (i  = 0; i < Object.keys(player_data.comments).length; i++)
			{
				if (player_data.comments[i].comment_text !== null)
				{
					element = pub.buildListElement(player_id, player_data.comments[i], player_data.comments[i].comment_time, player_data.comments[i].user_name);
					j_object.append(element);
					if(player_data.comments[i].comment_time_end > 0 && player_data.comments[i].comment_time <= player_data.last_time)
					{
						pub.fillCommentsTimeEndBlacklist(player_id, player_data.comments[i].comment_time_end, player_data.comments[i].comment_id);
					}
				}
			}
			player_data.is_show_all_active = true;
			pub.clearCommentsWhereTimeEndEndded(player_id, player_data.last_time);
		}
		else
		{
			player_data.is_show_all_active = false;
			pub.replaceCommentsAfterSeeking(player_data.last_time, player_id);
		}
	};

	pub.rebuildCommentsViewIfShowAllIsActive = function(player_id)
	{
		let player_data = scope.InteractiveVideoPlayerFunction.getPlayerDataObjectByPlayerId(player_id);
		let j_object, position, height;

		if(player_data.is_show_all_active === true)
		{
			j_object = $('#ilInteractiveVideoComments_' + player_id);
			position = j_object.scrollTop();
			height   = $('#ilInteractiveVideoComments_' + player_id + ' #ul_scroll_' + player_id).find('li').first().height();
			player_data.is_show_all_active = false;
			pub.displayAllCommentsAndDeactivateCommentStream(true, player_id);
			j_object.scrollTop(position + height);
		}
	};

	pub.loadAllUserWithCommentsIntoFilterList = function(player_id)
	{
		let element;
		let author_list = pro.getAllUserWithComment(player_id);
		let drop_down_list = $('#dropdownMenuInteraktiveList_' + player_id);
		let language = scope.InteractiveVideo.lang;
		let reset_elem = '<li><a href="#">' + language.reset_text + '</a></li><li role="separator" class="divider"></li>';

		drop_down_list.html('');
		drop_down_list.append(reset_elem);
		for ( element in author_list) 
		{
			element = '<li><a href="#">' + element + '</a></li>';
			drop_down_list.append(element);
		}
		pro.registerTabEvent(player_id);
	};

	pub.fillEndTimeSelector = function(seconds)
	{

	};

	pub.preselectActualTimeInVideo = function(seconds)
	{
		let obj = pro.secondsToTimeCode(seconds);
//Todo: fix this, this id does not exists anywhere
		pro.preselectValueOfEndTimeSelection(obj, $('#comment_time_end'));
	};
	
	pro.registerTabEvent = function(player_id)
	{
		let player_data = scope.InteractiveVideoPlayerFunction.getPlayerDataObjectByPlayerId(player_id);
		
		$('.iv_tab_comments_' + player_id).on('click', function() {
			let time = il.InteractiveVideoPlayerAbstract.currentTime(player_id);
			let filter_element = $('#show_all_comments_' + player_id);
			pro.displayCommentsOrToc(true, player_id);

			if(filter_element.prop('checked')){
				il.InteractiveVideoPlayerComments.rebuildCommentsViewIfShowAllIsActive(player_id);
			} else {
				pub.replaceCommentsAfterSeeking(time, player_id);
			}
		});
		
		$('.iv_tab_toc_' + player_id).on('click', function() {
			pro.displayCommentsOrToc(false, player_id);
			pro.buildToc(player_id);
		});

		if(player_data.disable_comment_stream === "1" || player_data.show_toc_first === "1") {
			pro.displayCommentsOrToc(false, player_id);
			pro.buildToc(player_id);
		} else {
			pro.displayCommentsOrToc(true, player_id);
		}
	};

	pro.displayCommentsOrToc = function(displayComments, player_id){
		let comments_block = $('#ul_scroll_' + player_id);
		let toc_block = $('#ul_toc_' + player_id);

		if(displayComments) {
			comments_block.css('display', 'block');
			toc_block.css('display', 'none');
			pro.activateTocOrCommentTab(false, player_id);
		} else {
			comments_block.css('display', 'none');
			toc_block.css('display', 'block');
			pro.activateTocOrCommentTab(true, player_id);
		}
	};
	
	pro.activateTocOrCommentTab = function(toc, player_id){
		let comments_block = $('.iv_tab_comments_' + player_id);
		let toc_block = $('.iv_tab_toc_' + player_id);
		
		if(toc) {
			comments_block.removeClass('active');
			toc_block.addClass('active');
		} else {
			toc_block.removeClass('active');
			comments_block.addClass('active');
		}

	};
	
	pro.buildToc = function(player_id) {
		let player_data = scope.InteractiveVideoPlayerFunction.getPlayerDataObjectByPlayerId(player_id);
		let j_object	= $('#ilInteractiveVideoComments_' + player_id + ' #ul_toc_' + player_id);
		let element		='';

		j_object.html('');
		pri.cssIterator = 0;
		for (let key in player_data.comments_toc) {
			let obj = player_data.comments_toc[key];
			if (obj.comment_text !== null)
			{
				element = pro.buildTocElement(obj, player_id, player_data);
				j_object.append(element);
			}
		}

		pro.registerTocClickListener(player_id);
		pub.highlightTocItem(player_id, player_data.last_time);
	};
	
	pro.buildTocElement = function(comment, player_id, player_data) {
		let comment_title = ' ';

		if(comment.comment_title !== '') {
			comment_title = ' ' + comment.comment_title + ' <br/> ';
		}

		return '<li class="toc_item toc_item_' + comment.comment_id +'" data-toc-time="' + comment.comment_time + '"><div class="toc-inner"><h5>' + 
			 pro.buildCommentTimeHtml(comment.comment_time, comment.is_interactive, player_id)  +
			 comment_title + '</h5>' + 
			 '<div class="toc_description">' + comment.comment_text + '</div>' +
			'</div></li>';
	};

	pro.registerTocClickListener = function(player_id) {
		$('.toc_item').off('click');
		$('.toc_item').on('click', function() {
			if($(this).find('.toc_description').css('display') === 'block'){
				$(this).find('.toc_description').hide();
				$(this).find('.toc_description').removeClass('tocManualOverride');
			} else {
				$('.toc_description').hide();
				$(this).find('.toc_description').show();
				$(this).find('.toc_description').addClass('tocManualOverride');
			}
		});
	};
	
	pub.highlightTocItem = function(player_id, current_time){
		
		$( ".toc_item" ).each(function( index ) {
			let toc_time = $( this ).data('toc-time');
			let toc_time_next = $( this ).next().data('toc-time');
			if(toc_time <= current_time
				&& !(toc_time_next < current_time)) {
				$('.toc_item').removeClass('activeToc');
				$(this).addClass('activeToc');
				$('.toc_description').hide();
				$('.tocManualOverride').show();
				$(this).find('.toc_description').show();
			}
		});
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

	pro.setCorrectAttributeForTimeInCommentAfterPosting = function (comment_id, time, player_id)
	{
		let player_data = scope.InteractiveVideoPlayerFunction.getPlayerDataObjectByPlayerId(player_id);
		let i;

		for (i  = 0; i < Object.keys(player_data.comments).length; i++)
		{
			if (player_data.comments[i].comment_id === comment_id)
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

	pro.buildCommentTimeHtml = function (time, is_interactive, player_id)
	{
		let display_time = time;

		if(parseInt(is_interactive, 10) === 1)
		{
			time = Math.abs(Math.round(time) - 0.1);
		}
		return 	'<time class="time"> ' +
				'<a onClick="il.InteractiveVideoPlayerAbstract.jumpToTimeInVideo(' + time + ', ' + player_id + '); return false;">'+
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
					'<a onClick="il.InteractiveVideoPlayerAbstract.jumpToTimeInVideo(' + display_time + ', ' + player_id + ');">'+
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
		let language = scope.InteractiveVideo.lang;

		if(name !== '')
		{
			name = '' + name + '';
		}

		if(parseInt(is_interactive, 10) === 1)
		{
			name  = '[' + language.question_text + ']';
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
		if(reply.is_table_of_content === "1") {
			return '';
		}
		return '<div class="reply_comment reply_comment_' + reply.comment_id + '">' + pub.buildCommentUsernameHtml(reply.user_name, reply.is_interactive) + ': ' + reply.comment_text + ' ' + pro.appendPrivateHtml(reply.is_private) + '</div>';
	};

	pro.appendPrivateHtml = function (is_private)
	{
		let private_comment = '';
		let language = scope.InteractiveVideo.lang;

		if(parseInt(is_private, 10) === 1 || is_private === true)
		{
			private_comment = ' (' + language.private_text + ')';
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

	pro.getAllUserWithComment = function(player_id)
	{
		let player_data = scope.InteractiveVideoPlayerFunction.getPlayerDataObjectByPlayerId(player_id);
		let i, author_list = [];

		for (i  = 0; i < Object.keys(player_data.comments).length; i++)
		{
			if ($.inArray( player_data.comments[i].user_name, author_list ) === -1)
			{
				author_list[player_data.comments[i].user_name] = player_data.comments[i].user_name;
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
		if($('#comment_time_end').size() > 0) {
			$('#comment_time_end').timepicker('setTime', time);
		}
	};
	
	pub.protect = pro;
	return pub;

}(il));