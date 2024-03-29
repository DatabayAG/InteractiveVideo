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
		$('#ilInteractiveVideoOverlay').html('');
		j_object.html('');
		pub.resetCommentsTimeEndBlacklist(player_id);
		for (i  = 0; i < Object.keys(player_data.comments).length; i++)
		{
			if (player_data.comments[i].comment_time <= time && player_data.comments[i].comment_text !== null)
			{
				j_object.prepend(pub.buildListElement(player_id, player_data.comments[i], player_data.comments[i].comment_time, player_data.comments[i].user_name));
				il.InteractiveVideoPlayerFunction.insertMarker( player_data.comments[i]);
				il.InteractiveVideoPlayerComments.registerReplyToListeners(player_id);
				if(player_data.comments[i].comment_time_end > 0)
				{
					pub.fillCommentsTimeEndBlacklist(player_id, player_data.comments[i].comment_time_end, player_data.comments[i].comment_id);
				}
			}
		}
		pub.clearCommentsWhereTimeEndEnded(player_id, time);
	};

	pub.buildListElement = function (player_id, comment, time, username)
	{
		let css_class, value;
		let list_item_id = 'list_item_' + comment.comment_id;
		let comment_not_already_rendered = $('.' + list_item_id).length;
		let player_data = scope.InteractiveVideoPlayerFunction.getPlayerDataObjectByPlayerId(player_id);
		if(pro.isBuildListElementAllowed(player_data, username)
			&& comment.is_table_of_content === "0"
			&& comment_not_already_rendered === 0
		)
		{
			let usr_image = '';
			if(player_data.anon_comments === "0"){
				usr_image = pro.buildCommentUserImage(player_data, comment);
			}
			css_class = pro.getCSSClassForListElement();
			value =	'<li class="' + list_item_id + ' fadeOut ' + css_class + '">' +
				'<div class="message-inner">' +
							usr_image  +
							'<div class="comment_user_data">' + pub.buildCommentUsernameHtml(username, comment.is_interactive) +
							pro.appendPrivateHtml(comment.is_private) +
							'<div class="comment_time">' +
							pro.buildCommentTimeHtml(time, comment.is_interactive, player_id)                           +
							pro.buildCommentTimeEndHtml(comment, player_id)                                             +
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

	pub.registerReplyToListeners = function(player_id)
	{
		let reply_object = $('.reply_to_comment');
		reply_object.off("click");
		reply_object.on("click", function() {
			let comment_id = 'list_item_'+ $(this).data('reply-to-id');
			let comment_container = 'list_item_container_'+ $(this).data('reply-to-id');
			let comment_object = $('.' + comment_id);
			if($('#' + comment_id).length === 0)
			{
				comment_object.append('');
				comment_object.append('<div id="'+comment_container+'" class="reply_to_container"><input type="text" class="reply_to_input_form" id="'+comment_id+'"/><input id="submit_comment_form" class="btn btn-default btn-sm submit_comment_form_to_reply" value="'+scope.InteractiveVideo.lang.save+'" type="submit"></div>');
				scope.InteractiveVideoPlayerFunction.addAjaxFunctionForReplyPosting(player_id, $(this).data('reply-to-id'), $(this).data('reply-to-id'));
			}
			else
			{
				$('#' + comment_container).remove();
			}
		});
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

	pub.clearCommentsWhereTimeEndEnded = function (player_id, time)
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
		let player_id = scope.InteractiveVideoPlayerFunction.getPlayerIdFromPlayerObject(player);
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
					il.InteractiveVideoPlayerFunction.insertMarker( player_data.comments[i]);
					il.InteractiveVideoPlayerComments.fillCommentsTimeEndBlacklist(player_id, player_data.comments[i].comment_time_end, player_data.comments[i].comment_id);
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

		if(on === false || on === '0')
		{
			for (i  = 0; i < Object.keys(player_data.comments).length; i++)
			{
				if (player_data.comments[i].comment_text !== null)
				{
					element = pub.buildListElement(player_id, player_data.comments[i], player_data.comments[i].comment_time, player_data.comments[i].user_name);
					j_object.append(element);
					il.InteractiveVideoPlayerComments.registerReplyToListeners(player_id);
					if(player_data.comments[i].comment_time_end > 0 && player_data.comments[i].comment_time <= player_data.last_time)
					{
						pub.fillCommentsTimeEndBlacklist(player_id, player_data.comments[i].comment_time_end, player_data.comments[i].comment_id);
					}
				}
			}
			player_data.show_only_until_playhead = false;
			pub.clearCommentsWhereTimeEndEnded(player_id, player_data.last_time);
		}
		else
		{
			player_data.show_only_until_playhead = true;
			pub.replaceCommentsAfterSeeking(player_data.last_time, player_id);
		}
		pub.registerReplyToListeners(player_id);
	};

	pub.rebuildCommentsViewIfShowAllIsActive = function(player_id)
	{
		let player_data = scope.InteractiveVideoPlayerFunction.getPlayerDataObjectByPlayerId(player_id);
		let j_object, position, height;

		if(player_data.show_only_until_playhead === false)
		{
			j_object = $('#ilInteractiveVideoComments_' + player_id);
			position = j_object.scrollTop();
			height   = $('#ilInteractiveVideoComments_' + player_id + ' #ul_scroll_' + player_id).find('li').first().height();
			player_data.show_only_until_playhead = true;
			pub.displayAllCommentsAndDeactivateCommentStream(false, player_id);
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

	pub.loadAllLayoutStyles = function(player_id)
	{
		let element;
		let drop_down_list = $('#dropdownMenuLayoutInteraktiveList_' + player_id);
		let language = scope.InteractiveVideo.lang;
		let reset_elem = '<li><a href="#">' + language.reset_text + '</a></li><li role="separator" class="divider"></li>';
		let layout_list = [];
		layout_list['1:1'] = language.similarSize;
		layout_list['2:1'] = language.bigVideo;
		layout_list['stacked'] = language.veryBigVideo;
		drop_down_list.html('');
		drop_down_list.append(reset_elem);
		Object.keys(layout_list).forEach(key => {
			element = '<li><a href="#">' + layout_list[key] + '</a></li>';
			drop_down_list.append(element);
		});

	};

	pub.fillEndTimeSelector = function(seconds)
	{

	};

	pub.preselectActualTimeInVideo = function(seconds)
	{
		let time = pub.secondsToTimeCode(seconds);
		let end_time = pub.secondsToTimeCode(seconds + 3);
		if(il.InteractiveVideoPlayerFunction.shouldTimerGetRefreshed()) {
			pro.preselectValueOfTimeSelection(end_time, $('#comment_time_end'));
			pro.preselectValueOfTimeSelection(time, $('#comment_time'));
		}

	};

	pro.registerTabEvent = function(player_id)
	{
		let player_data = scope.InteractiveVideoPlayerFunction.getPlayerDataObjectByPlayerId(player_id);

		$('.iv_tab_comments_' + player_id).on('click', function() {
			let time = il.InteractiveVideoPlayerAbstract.currentTime(player_id);
			let filter_element = $('#show_all_comments_' + player_id);
			pro.displayCommentsOrToc(true, player_id);
			if(player_data.show_only_until_playhead === false){
				il.InteractiveVideoPlayerComments.rebuildCommentsViewIfShowAllIsActive(player_id);
			} else {
				pub.replaceCommentsAfterSeeking(time, player_id);
			}
		});

		$('.iv_tab_toc_' + player_id).on('click', function() {
			pro.displayCommentsOrToc(false, player_id);
			pub.buildToc(player_id);
		});

		if(player_data.show_toolbar === "0" ){
			let toolbar = $('.ivToolbar_' + player_id)
			toolbar.css('display', 'none');
		}
		if(player_data.enable_comment_stream === "0" || player_data.show_toc_first === "1") {
			pro.displayCommentsOrToc(false, player_id);
			pub.buildToc(player_id);
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

	pub.buildToc = function(player_id) {
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
			comment_title = ' ' + comment.comment_title;
		}

		let comment_text_exists_class = 'no_description';
		let add_span_arrow = '';
		if(comment.comment_text != ''){
			comment_text_exists_class = 'description_exists';
			add_span_arrow = '<span class="toc_arrow glyphicon glyphicon-triangle-right"></span>';
		}
		return '<li class="toc_item toc_item_' + comment.comment_id +' ' + comment_text_exists_class + '" data-toc-time="' + comment.comment_time + '"><div class="toc-inner"><h5>' +
			 pro.buildCommentTimeHtml(comment.comment_time, comment.is_interactive, player_id)  +
			 '<div class="toc_title">' + comment_title + add_span_arrow + '</div></h5>' +
			 '<div class="toc_description">' + comment.comment_text + '</div>' +
			'</div></li>';
	};

	pro.registerTocClickListener = function(player_id) {
		$('.description_exists').off('click');
		$('.description_exists').on('click', function() {
			if($(this).find('.toc_description').css('display') === 'block'){
				$(this).find('.toc_description').hide();
				$(this).find('.toc_description').removeClass('tocManualOverride');
				$(this).parent().removeClass('tocManualOverride');
			} else {
				//$('.toc_description').hide();
				$(this).find('.toc_description').show();
				$(this).find('.toc_description').addClass('tocManualOverride');
				$(this).parent().addClass('tocManualOverride');
			}
			pro.changeArrowForTocItem(player_id);
		});
	};

	pub.highlightTocItem = function(player_id, current_time){

		$( ".toc_item" ).each(function( index ) {
			let toc_time = $( this ).data('toc-time');
			let toc_time_next = $( this ).next().data('toc-time');
			if(toc_time <= current_time
				&& !(toc_time_next < current_time)) {
				if($('.ul_toc_iv').css('display') !== 'none'){
					$('.toc_item').removeClass('activeToc');
					$(this).addClass('activeToc');
					$('.toc_description').hide();
					$('.tocManualOverride').show();
					$(this).find('.toc_description').show();
				}
			}
		});
		pro.changeArrowForTocItem(player_id);
	};

	pro.changeArrowForTocItem = function(player_id){

		$( ".toc_item" ).each(function( index ) {
			if($(this).hasClass('description_exists')){
				let span = $(this).find('.toc_arrow');

				if($(this).hasClass('activeToc') || $(this).hasClass('tocManualOverride')){
					span.removeClass('glyphicon-triangle-right');
					span.addClass('glyphicon-triangle-bottom');
				} else {
					span.addClass('glyphicon-triangle-right');
					span.removeClass('glyphicon-triangle-bottom');
				}
			}
		});
	};

	pro.isBuildListElementAllowed = function(player_data, username)
	{
		let value = false;

		if(player_data.filter_by_user === false ||
				(   player_data.filter_by_user !== false &&
					player_data.filter_by_user === username
				)
			)
		{
			value = true;
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
		$('.interactive_overlay_element_' + id).remove();
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
		return 	'<time class="time" data-time="' + time + '"> ' +
				'<a onClick="il.InteractiveVideoPlayerAbstract.jumpToTimeInVideo(' + time + ', \'' + player_id + '\'); return false;">'+
				pub.secondsToTimeCode(display_time)  +
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
					'<a onClick="il.InteractiveVideoPlayerAbstract.jumpToTimeInVideo(' + display_time + ', \'' + player_id + '\');">'+
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
			for (let i  = 0; i < replies.length; i++)
			{
				value += pub.getCommentRepliesHtml(replies[i]);
			}
		}
		return value + '</div>';
	};
	
	pub.getCommentRepliesHtml = function(reply)
	{
		let name = reply.user_name;
		if(name !== "") {
			name = pub.buildCommentUsernameHtml(name , reply.is_interactive) + ': ';
		}
		if(reply.is_table_of_content === "1") {
			return '';
		}

		return '<div class="reply_comment reply_comment_' + reply.comment_id + '">' + name + reply.comment_text + ' ' + pro.appendPrivateHtml(reply.is_private) + '</div>';
	};

	pro.appendPrivateHtml = function (is_private)
	{
		let private_comment = '';
		let language = scope.InteractiveVideo.lang;

		if(parseInt(is_private, 10) === 1 || is_private === true)
		{
			private_comment = ' (' + language.private_text + ')';
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
	
	pub.secondsToTimeCode = function(time)
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

	pro.preselectValueOfTimeSelection = function(time, element)
	{
		element.val(time);
		if(element.size() > 0) {
			element.timepicker('setTime', time);
		}
	};
	
	pub.protect = pro;
	return pub;

}(il));