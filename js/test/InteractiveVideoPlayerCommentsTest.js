//BEGIN helper for html and karma usage
var path = '';
if (typeof window.__karma__ !== 'undefined') {
	path += 'base/' //used for fixtures in karma
}
else {
	var $j = $; //used for event listeners in karma
}
jasmine.getFixtures().fixturesPath = path + 'spec/javascripts/fixtures';
//END helper for html and karma usage

describe("InteractiveVideoPlayerComments Tests", function () {

	describe("HTML Builder Test Cases", function () {
		beforeEach(function () {
			il.InteractiveVideo = {lang : {send_text : 'send', close_text : 'close',
				learning_recommendation_text : 'Further Information',
				feedback_button_text : 'feedback', private_text : 'private', question_text : 'Question'}};
			il.InteractiveVideo.comments = [];
		});
		afterEach(function () {
		});

		it("InteractiveVideoQuestionCreator object must exists", function () {
			expect(typeof il.InteractiveVideoPlayerComments).toEqual('object');
		});

		it("builCommentTextHtml must return html", function () {
			var expec = '<span class="comment_text">My little text</span> ';
			var value = il.InteractiveVideoPlayerComments.protect.builCommentTextHtml('My little text');
			expect(value).toEqual(expec);
		});

		it("builCommentTitleHtml must return html", function () {
			var expec = '<span class="comment_title">My little text</span> ';
			var value = il.InteractiveVideoPlayerComments.protect.builCommentTitleHtml('My little text');
			expect(value).toEqual(expec);

			expec = '<span class="comment_title"></span> ';
			value = il.InteractiveVideoPlayerComments.protect.builCommentTitleHtml(null);
			expect(value).toEqual(expec);
		});

		it("builCommentUsernameHtml must return html", function () {
			var expec = '<span class="comment_username"> Username</span> ';
			var value = il.InteractiveVideoPlayerComments.protect.builCommentUsernameHtml('Username', 0);
			expect(value).toEqual(expec);

			expec = '<span class="comment_username"> [Question]</span> ';
			value = il.InteractiveVideoPlayerComments.protect.builCommentUsernameHtml('Username', 1);
			expect(value).toEqual(expec);

			expec = '<span class="comment_username"> </span> ';
			value = il.InteractiveVideoPlayerComments.protect.builCommentUsernameHtml('', 0);
			expect(value).toEqual(expec);
		});

		it("builCommentPrivateHtml must return html", function () {
			var expec = '<span class="private_text"> (private)</span> ';
			var value = il.InteractiveVideoPlayerComments.protect.appendPrivateHtml(1);
			expect(value).toEqual(expec);

			expec = '<span class="private_text"></span> ';
			value = il.InteractiveVideoPlayerComments.protect.appendPrivateHtml(0);
			expect(value).toEqual(expec);
		});

		it("builCommentTimeHtml must return html", function () {
			var expec = '<time class="time"> <a onClick="il.InteractiveVideoPlayerAbstract.jumpToTimeInVideo(61); return false;">01:01</a></time>';
			var value = il.InteractiveVideoPlayerComments.protect.builCommentTimeHtml(61, 0);
			expect(value).toEqual(expec);

			expec = '<time class="time"> <a onClick="il.InteractiveVideoPlayerAbstract.jumpToTimeInVideo(60.9); return false;">01:01</a></time>';
			value = value = il.InteractiveVideoPlayerComments.protect.builCommentTimeHtml(61, 1);
			expect(value).toEqual(expec);
		});

		it("builCommentTagsHtml must return html", function () {
			var tags = 'Tag1, Tag2';
			var expec = '<br/><div class="comment_tags"><span class="tag">Tag1</span> <span class="tag"> Tag2</span> </div>';
			var value = il.InteractiveVideoPlayerComments.protect.builCommentTagsHtml(tags);
			expect(value).toEqual(expec);

			expec = '<br/><div class="comment_tags"></div>';
			value = il.InteractiveVideoPlayerComments.protect.builCommentTagsHtml(null);
			expect(value).toEqual(expec);
		});

		it("fillEndTimeSelector must return html for 1 second", function () {
			loadFixtures('InteractiveVideoPlayerComments_fixtures.html');
			var h = $('#comment_time_end\\[time\\]_h').html();
			var m = $('#comment_time_end\\[time\\]_m').html();
			var s = $('#comment_time_end\\[time\\]_s').html();
			expect(h).toEqual('<option value="0" selected="selected">00</option>');
			expect(m).toEqual('<option value="0" selected="selected">00</option>');
			expect(s).toEqual('<option value="0" selected="selected">00</option>');

			il.InteractiveVideoPlayerComments.fillEndTimeSelector(1);
			h = $('#comment_time_end\\[time\\]_h').html();
			m = $('#comment_time_end\\[time\\]_m').html();
			s = $('#comment_time_end\\[time\\]_s').html();
			expect(h).toEqual('<option value="0" selected="selected">00</option>');
			expect(m).toEqual('<option value="0" selected="selected">00</option>');
			expect(s).toEqual('<option value="0" selected="selected">00</option><option value="01">01</option>');
		});

		it("fillEndTimeSelector must return html for 61 seconds", function () {
			var h, m, s;
			loadFixtures('InteractiveVideoPlayerComments_fixtures.html');

			il.InteractiveVideoPlayerComments.fillEndTimeSelector(61);
			h = $('#comment_time_end\\[time\\]_h').html();
			m = $('#comment_time_end\\[time\\]_m').html();
			s = $('#comment_time_end\\[time\\]_s').html();
			expect(h).toEqual('<option value="0" selected="selected">00</option>');
			expect(m).toEqual('<option value="0" selected="selected">00</option><option value="01">01</option>');
			expect(s).toEqual('<option value="0" selected="selected">00</option><option value="01">01</option><option value="02">02</option><option value="03">03</option><option value="04">04</option><option value="05">05</option><option value="06">06</option><option value="07">07</option><option value="08">08</option><option value="09">09</option><option value="10">10</option><option value="11">11</option><option value="12">12</option><option value="13">13</option><option value="14">14</option><option value="15">15</option><option value="16">16</option><option value="17">17</option><option value="18">18</option><option value="19">19</option><option value="20">20</option><option value="21">21</option><option value="22">22</option><option value="23">23</option><option value="24">24</option><option value="25">25</option><option value="26">26</option><option value="27">27</option><option value="28">28</option><option value="29">29</option><option value="30">30</option><option value="31">31</option><option value="32">32</option><option value="33">33</option><option value="34">34</option><option value="35">35</option><option value="36">36</option><option value="37">37</option><option value="38">38</option><option value="39">39</option><option value="40">40</option><option value="41">41</option><option value="42">42</option><option value="43">43</option><option value="44">44</option><option value="45">45</option><option value="46">46</option><option value="47">47</option><option value="48">48</option><option value="49">49</option><option value="50">50</option><option value="51">51</option><option value="52">52</option><option value="53">53</option><option value="54">54</option><option value="55">55</option><option value="56">56</option><option value="57">57</option><option value="58">58</option><option value="59">59</option>');
		});

		it("fillEndTimeSelector must return html for 3601 seconds", function () {
			var h, m, s;
			loadFixtures('InteractiveVideoPlayerComments_fixtures.html');

			il.InteractiveVideoPlayerComments.fillEndTimeSelector(3601);
			h = $('#comment_time_end\\[time\\]_h').html();
			m = $('#comment_time_end\\[time\\]_m').html();
			s = $('#comment_time_end\\[time\\]_s').html();
			expect(h).toEqual('<option value="0" selected="selected">00</option><option value="01">01</option>');
			expect(m).toEqual('<option value="0" selected="selected">00</option><option value="01">01</option><option value="02">02</option><option value="03">03</option><option value="04">04</option><option value="05">05</option><option value="06">06</option><option value="07">07</option><option value="08">08</option><option value="09">09</option><option value="10">10</option><option value="11">11</option><option value="12">12</option><option value="13">13</option><option value="14">14</option><option value="15">15</option><option value="16">16</option><option value="17">17</option><option value="18">18</option><option value="19">19</option><option value="20">20</option><option value="21">21</option><option value="22">22</option><option value="23">23</option><option value="24">24</option><option value="25">25</option><option value="26">26</option><option value="27">27</option><option value="28">28</option><option value="29">29</option><option value="30">30</option><option value="31">31</option><option value="32">32</option><option value="33">33</option><option value="34">34</option><option value="35">35</option><option value="36">36</option><option value="37">37</option><option value="38">38</option><option value="39">39</option><option value="40">40</option><option value="41">41</option><option value="42">42</option><option value="43">43</option><option value="44">44</option><option value="45">45</option><option value="46">46</option><option value="47">47</option><option value="48">48</option><option value="49">49</option><option value="50">50</option><option value="51">51</option><option value="52">52</option><option value="53">53</option><option value="54">54</option><option value="55">55</option><option value="56">56</option><option value="57">57</option><option value="58">58</option><option value="59">59</option>');
			expect(s).toEqual('<option value="0" selected="selected">00</option><option value="01">01</option><option value="02">02</option><option value="03">03</option><option value="04">04</option><option value="05">05</option><option value="06">06</option><option value="07">07</option><option value="08">08</option><option value="09">09</option><option value="10">10</option><option value="11">11</option><option value="12">12</option><option value="13">13</option><option value="14">14</option><option value="15">15</option><option value="16">16</option><option value="17">17</option><option value="18">18</option><option value="19">19</option><option value="20">20</option><option value="21">21</option><option value="22">22</option><option value="23">23</option><option value="24">24</option><option value="25">25</option><option value="26">26</option><option value="27">27</option><option value="28">28</option><option value="29">29</option><option value="30">30</option><option value="31">31</option><option value="32">32</option><option value="33">33</option><option value="34">34</option><option value="35">35</option><option value="36">36</option><option value="37">37</option><option value="38">38</option><option value="39">39</option><option value="40">40</option><option value="41">41</option><option value="42">42</option><option value="43">43</option><option value="44">44</option><option value="45">45</option><option value="46">46</option><option value="47">47</option><option value="48">48</option><option value="49">49</option><option value="50">50</option><option value="51">51</option><option value="52">52</option><option value="53">53</option><option value="54">54</option><option value="55">55</option><option value="56">56</option><option value="57">57</option><option value="58">58</option><option value="59">59</option>');
		});

		it("preselectActualTimeInVideo", function () {
			var h, m, s;
			loadFixtures('InteractiveVideoPlayerComments_fixtures.html');

			il.InteractiveVideoPlayerComments.fillEndTimeSelector(6);
			il.InteractiveVideoPlayerComments.preselectActualTimeInVideo(5);
			s = $('#comment_time_end\\[time\\]_s').val();
			expect(s).toEqual('05');

			il.InteractiveVideoPlayerComments.fillEndTimeSelector(36666);
			il.InteractiveVideoPlayerComments.preselectActualTimeInVideo(268);
			h = $('#comment_time_end\\[time\\]_h').val();
			m = $('#comment_time_end\\[time\\]_m').val();
			s = $('#comment_time_end\\[time\\]_s').val();
			expect(h).toEqual(null);
			expect(m).toEqual('04');
			expect(s).toEqual('28');

			il.InteractiveVideoPlayerComments.preselectActualTimeInVideo(36661);
			h = $('#comment_time_end\\[time\\]_h').val();
			m = $('#comment_time_end\\[time\\]_m').val();
			s = $('#comment_time_end\\[time\\]_s').val();
			expect(h).toEqual('10');
			expect(m).toEqual('11');
			expect(s).toEqual('01');
		});
	});
	describe("Utils Test Cases", function () {
		beforeEach(function () {
			called = false;
			il.InteractiveVideo = {};
			il.InteractiveVideo = {lang : {send_text : 'send', close_text : 'close',
				learning_recommendation_text : 'Further Information', reset_text: 'reset',
				feedback_button_text : 'feedback', private_text : 'private', question_text : 'Question'}};
			il.InteractiveVideo.comments = [];
			il.InteractiveVideo.stopPoints = [];
			callHelper = {
				play: function () {
					called = true;
				},
				pause: function () {
					called = true;
				}
			};
			spyOn(callHelper, 'play');
			spyOn(callHelper, 'pause');

		});

		afterEach(function () {
		});

		it("sliceCommentAndStopPointsInCorrectPosition", function () {
			var expec = [{comment_time: 5}];
			il.InteractiveVideo.comments = [];
			il.InteractiveVideoPlayerComments.sliceCommentAndStopPointsInCorrectPosition({comment_time: 5}, 5);
			expect(il.InteractiveVideo.comments).toEqual(expec);

			il.InteractiveVideoPlayerComments.sliceCommentAndStopPointsInCorrectPosition({comment_time: 6}, 6);
			expec = [{comment_time: 5}, {comment_time: 6}];
			expect(il.InteractiveVideo.comments).toEqual(expec);

			il.InteractiveVideoPlayerComments.sliceCommentAndStopPointsInCorrectPosition({comment_time: 0}, 0);
			expec = [{comment_time: 5}, {comment_time: 0}, {comment_time: 6}];
			expect(il.InteractiveVideo.comments).toEqual(expec);
		});

		it("replaceCommentsAfterSeeking", function () {
			var expec = '';
			il.InteractiveVideo.comments = [];
			il.InteractiveVideo.is_show_all_active = false;
			il.InteractiveVideo.filter_by_user = false;
			loadFixtures('InteractiveVideoPlayerComments_fixtures.html');
			il.InteractiveVideoPlayerComments.replaceCommentsAfterSeeking(1);
			expect($("#ul_scroll").html()).toEqual(expec);

			expec = '';
			comments = [{comment_time: 5, comment_text: 'Text', is_interactive: 1, comment_tags: null}];
			il.InteractiveVideoPlayerComments.replaceCommentsAfterSeeking(6);
			expect('').toEqual(expec);
		});

		it("isBuildListElementAllowed", function () {
			il.InteractiveVideo.is_show_all_active = true;
			expect(il.InteractiveVideoPlayerComments.protect.isBuildListElementAllowed('dummy')).toEqual(false);

			il.InteractiveVideo.is_show_all_active = false;
			expect(il.InteractiveVideoPlayerComments.protect.isBuildListElementAllowed('dummy')).toEqual(false);

			il.InteractiveVideo.filter_by_user = true;
			il.InteractiveVideo.filter_by_user = 'dummy';
			expect(il.InteractiveVideoPlayerComments.protect.isBuildListElementAllowed('dummy')).toEqual(true);
		});

		it("getAllUserWithComment", function () {
			var expec = [];
			expec['my name'] = 'my name';
			il.InteractiveVideo.comments = [{'user_name': 'my name'}];
			expect(il.InteractiveVideoPlayerComments.protect.getAllUserWithComment()).toEqual(expec);

			expec['my name2'] = 'my name2';
			il.InteractiveVideo.comments = [{'user_name': 'my name'}, {'user_name': 'my name2'}];
			expect(il.InteractiveVideoPlayerComments.protect.getAllUserWithComment()).toEqual(expec);

			il.InteractiveVideo.comments = [{'user_name': 'my name'}, {'user_name': 'my name2'}, {'user_name': 'my name2'}, {'user_name': 'my name2'}];
			expect(il.InteractiveVideoPlayerComments.protect.getAllUserWithComment()).toEqual(expec);
		});

		it("fillCommentsTimeEndBlacklist", function () {
			il.InteractiveVideo.blacklist_time_end = {};
			expect({}).toEqual(il.InteractiveVideo.blacklist_time_end);

			il.InteractiveVideoPlayerComments.fillCommentsTimeEndBlacklist('1',1);
			expect({1:[1]}).toEqual(il.InteractiveVideo.blacklist_time_end);

			il.InteractiveVideoPlayerComments.fillCommentsTimeEndBlacklist('1',2);
			expect({1:[1,2]}).toEqual(il.InteractiveVideo.blacklist_time_end);
		});

		it("clearCommentsWhereTimeEndEndded", function () {
			il.InteractiveVideo.blacklist_time_end = {1:[2,1]};
			il.InteractiveVideoPlayerComments.clearCommentsWhereTimeEndEndded(0);
			expect({1:[2,1]}).toEqual(il.InteractiveVideo.blacklist_time_end);

			il.InteractiveVideoPlayerComments.clearCommentsWhereTimeEndEndded(2);
			expect({}).toEqual(il.InteractiveVideo.blacklist_time_end);
		});


		it("setCorrectAttributeForTimeInCommentAfterPosting", function () {
			il.InteractiveVideo.comments = [{comment_time_end : 0, comment_id :0}]
			il.InteractiveVideoPlayerComments.protect.setCorrectAttributeForTimeInCommentAfterPosting(0, 60);
			expect([{comment_time_end : 60, comment_id : 0}]).toEqual(il.InteractiveVideo.comments);

			il.InteractiveVideoPlayerComments.protect.setCorrectAttributeForTimeInCommentAfterPosting(1, 60);
			expect([{comment_time_end : 60, comment_id : 0}]).toEqual(il.InteractiveVideo.comments);
		});

		it("getCSSClassForListelement", function () {
			var element = il.InteractiveVideoPlayerComments.protect.getCSSClassForListelement();
			expect(element).toEqual('crow1');

			element = il.InteractiveVideoPlayerComments.protect.getCSSClassForListelement();
			expect(element).toEqual('crow2');

			element = il.InteractiveVideoPlayerComments.protect.getCSSClassForListelement();
			expect(element).toEqual('crow3');

			element = il.InteractiveVideoPlayerComments.protect.getCSSClassForListelement();
			expect(element).toEqual('crow4');

			element = il.InteractiveVideoPlayerComments.protect.getCSSClassForListelement();
			expect(element).toEqual('crow1');
		});

		it("secondsToTimeCode with 00:00", function () {
			var obj = '00:00';
			var expec = il.InteractiveVideoPlayerComments.protect.secondsToTimeCode(0);
			expect(expec).toEqual(obj);
		});

		it("secondsToTimeCode with 01:00", function () {
			var obj = '01:00';
			var expec = il.InteractiveVideoPlayerComments.protect.secondsToTimeCode(60);
			expect(expec).toEqual(obj);
		});

		it("secondsToTimeCode with 12:31:21", function () {
			var obj = '12:31:21';
			var expec = il.InteractiveVideoPlayerComments.protect.secondsToTimeCode(217881);
			expect(expec).toEqual(obj);
		});

		it("displayAllCommentsAndDeactivateCommentStream", function () {
			var expec = '<li class="list_item_0 fadeOut crow1"><time class="time"> <a onclick="il.InteractiveVideoPlayerAbstract.jumpToTimeInVideo(60); return false;">01:00</a></time><span class="comment_username"> undefined</span> <span class="comment_title"></span> <span class="comment_text">bla</span> <span class="private_text"></span> <br><div class="comment_tags"></div></li>';
			loadFixtures('InteractiveVideoPlayerComments_fixtures.html');
			il.InteractiveVideo.comments = [{comment_time : 60, comment_time_end : 0, comment_id :0, comment_text : 'bla'}]
			il.InteractiveVideoPlayerComments.displayAllCommentsAndDeactivateCommentStream(false);
			expect($("#ul_scroll").html()).toEqual('');
			expect(il.InteractiveVideo.is_show_all_active).toEqual(false);

			il.InteractiveVideoPlayerComments.displayAllCommentsAndDeactivateCommentStream(true);
			expect($("#ul_scroll").html()).toEqual(expec);
			expect(il.InteractiveVideo.is_show_all_active).toEqual(true);
			
		});

		it("builCommentTimeEndHtml with h m s fields", function () {
			var comment = {comment_time_end_h : 1, comment_time_end_m : 1 ,comment_time_end_s : 1, comment_id :0};
			il.InteractiveVideo.comments = [comment];
			il.InteractiveVideoPlayerComments.protect.builCommentTimeEndHtml(comment);
			expect([{comment_time_end_h: 1, comment_time_end_m: 1, comment_time_end_s: 1, comment_id: 0, comment_time_end: 3661}]).toEqual(il.InteractiveVideo.comments);
		});

		it("builCommentTimeEndHtml with time_end_field", function () {
			var comment = {comment_id :0, comment_time_end: 3661};
			il.InteractiveVideo.comments = [comment];
			il.InteractiveVideoPlayerComments.protect.builCommentTimeEndHtml(comment);
			expect([{comment_id :0, comment_time_end: 3661}]).toEqual(il.InteractiveVideo.comments);
		});
		
		it("loadAllUserWithCommentsIntoFilterList one user", function () {
			var expec = '<li><a href="#">reset</a></li><li role="separator" class="divider"></li><li><a href="#">my name</a></li>';
			loadFixtures('InteractiveVideoPlayerComments_fixtures.html');
			il.InteractiveVideo.comments = [{'user_name': 'my name'}];
			il.InteractiveVideoPlayerComments.loadAllUserWithCommentsIntoFilterList();
			expect($('#dropdownMenuInteraktiveList').html()).toEqual(expec);
		});

		it("loadAllUserWithCommentsIntoFilterList two users", function () {
			var expec = '<li><a href="#">reset</a></li><li role="separator" class="divider"></li><li><a href="#">my name</a></li><li><a href="#">my name2</a></li>';
			loadFixtures('InteractiveVideoPlayerComments_fixtures.html');
			il.InteractiveVideo.comments = [{'user_name': 'my name'}, {'user_name': 'my name2'}];
			il.InteractiveVideoPlayerComments.loadAllUserWithCommentsIntoFilterList();
			expect($('#dropdownMenuInteraktiveList').html()).toEqual(expec);
		});

	});

});