//BEGIN helper for html and karma usage
var path = '';
if (typeof window.__karma__ !== 'undefined') {
	path += 'base/' //used for fixtures in karma
}
else
{
	var $j = $; //used for event listeners in karma
}
jasmine.getFixtures().fixturesPath = path + 'spec/javascripts/fixtures';
//END helper for html and karma usage


describe("InteractiveVideoQuestionViewer Tests", function() {

	describe("Simple Test Cases", function() {

		describe("Functions exists", function() {
			it("InteractiveVideoQuestionViewer object must exists", function () {
				expect(typeof InteractiveVideoQuestionViewer).toEqual('object');
			});

			it("protected_function must exists and be protected", function () {
				expect(typeof InteractiveVideoQuestionViewer.protect).toEqual('object');
			});
		});

		describe("HTML builders", function() {
			beforeEach(function () {
				send_text = 'send';
				close_text= 'close';
				learning_recommendation_text = 'Further Information';
				feedback_button_text = 'feedback';
				question_post_url = '';
				mejs = { 'Utility' : {secondsToTimeCode : function(a){}}};
				$().jumpToTimeInVideo = function(time){};
			});
			
			it("createButtonButtons must return button code", function () {
				var expec = '<input id="1" class="btn btn-default btn-sm" type="submit" value="hello">';
				var build = InteractiveVideoQuestionViewer.protect.createButtonButtons(1, 'hello') ;
				expect(expec).toEqual(build);
				build = InteractiveVideoQuestionViewer.protect.createButtonButtons(0, 'hello 2') ;
				expect(expec).not.toEqual(build);
			});
			
			it("createButtonButtons must return button code", function () {
				loadFixtures('InteractiveVideoQuestionViewer_fixture.html');
				expect($('.modal_feedback')).not.toBeInDOM();
				InteractiveVideoQuestionViewer.protect.addFeedbackDiv() ;
				expect($('.modal_feedback')).toBeInDOM();

			});

			it("buildAnswerInputElement must return input element", function () {
				var expec = '<label for="answer_1"><input type="text" id="answer_1" name="answer[]"  value="1">Hello</label><br/>';
				var build = InteractiveVideoQuestionViewer.protect.buildAnswerInputElement("text",  {'answer_id' : 1, 'answer' : 'Hello'}) ;
				expect(expec).toEqual(build);
				build = InteractiveVideoQuestionViewer.protect.buildAnswerInputElement("text",  {'answer_id' : 2, 'answer' : 'Hello 2'}) ;
				expect(expec).not.toEqual(build);
			});

			it("addAnswerPossibilities must append answer element", function () {
				var expec = 'Modal Body<form id="question_form"><label for="answer_1"><input type="text" id="answer_1" name="answer[]" value="1">Hello</label><br><input type="hidden" name="qid" value="1"></form>';
				loadFixtures('InteractiveVideoQuestionViewer_fixture.html');
				InteractiveVideoQuestionViewer.QuestionObject.answers = [{'answer_id' : 1, 'answer' : 'Hello'}];
				InteractiveVideoQuestionViewer.QuestionObject.question_id = 1;
				InteractiveVideoQuestionViewer.protect.addAnswerPossibilities("text") ;
				expect($('.modal-body').html()).toEqual(expec);
				InteractiveVideoQuestionViewer.protect.addAnswerPossibilities("text") ;
				expect($('.modal-body').html()).not.toEqual(expec);
			});

			it("addButtons should append buttons to form", function () {
				loadFixtures('InteractiveVideoQuestionViewer_fixture.html');
				expect($('#sendForm').length).toEqual(0);
				expect($('#close_form').length).toEqual(0);
				InteractiveVideoQuestionViewer.protect.addButtons() ;
				expect($('#sendForm').length).toEqual(1);
				expect($('#close_form').length).toEqual(1);
			});
			it("showFeedback must display feedback", function () {
				var expec = 'Great Job.<div class="learning_recommendation"><br>Further Information: <input id="jumpToTimeInVideo" class="btn btn-default btn-sm" type="submit" value="feedback undefined"></div>';
				var feedback = { 'html' : 'Great Job.' , 'is_timed' : 1, 'time' : 0};
				loadFixtures('InteractiveVideoQuestionViewer_fixture.html');
				$('.modal-body').append('<div class="modal_feedback"></div>');
				expect($('.modal_feedback').html()).toEqual('');
				
				InteractiveVideoQuestionViewer.protect.showFeedback(feedback);
				expect($('.modal_feedback').html()).toEqual(expec);
				
				feedback = { 'html' : 'Great Job.' , 'is_timed' : 0, 'time' : 0};
				InteractiveVideoQuestionViewer.protect.showFeedback(feedback);
				expect($('.modal_feedback').html()).toEqual('Great Job.');
			});
			
			describe("buildQuestionForm builders", function() {
				beforeEach(function () {
					loadFixtures('InteractiveVideoQuestionViewer_fixture.html');
					send_text = 'send';
					close_text= 'close';
					question_post_url = '';
					InteractiveVideoQuestionViewer.QuestionObject.answers = [{'answer_id' : 1, 'answer' : 'Hello'}];
					InteractiveVideoQuestionViewer.QuestionObject.question_id = 1;
					InteractiveVideoQuestionViewer.QuestionObject.question_title = 'Title';
					InteractiveVideoQuestionViewer.QuestionObject.question_text = 'Text';
				});
				it("buildQuestionForm should append buttons to form type 0", function () {
					var expec_0 = '<h2>Title</h2><p>Text</p><form id="question_form"><label for="answer_1"><input type="radio" id="answer_1" name="answer[]" value="1">Hello</label><br><input type="hidden" name="qid" value="1"></form>';
					InteractiveVideoQuestionViewer.QuestionObject.type = 0;
					InteractiveVideoQuestionViewer.protect.buildQuestionForm();
					expect($('.modal-body').html()).toEqual(expec_0);
				});
				it("buildQuestionForm should append buttons to form type 1", function () {
					var expec_1 = '<h2>Title</h2><p>Text</p><form id="question_form"><label for="answer_1"><input type="checkbox" id="answer_1" name="answer[]" value="1">Hello</label><br><input type="hidden" name="qid" value="1"></form>';
					InteractiveVideoQuestionViewer.QuestionObject.type = 1;
					InteractiveVideoQuestionViewer.protect.buildQuestionForm();
					expect($('.modal-body').html()).toEqual(expec_1);
				});
				it("buildQuestionForm should append buttons to form type 2", function () {
					var expec_2 = '<h2>Title</h2><p>Text</p><div class="modal_feedback"><input id="close_form" class="btn btn-default btn-sm" type="submit" value="close"></div>';
					InteractiveVideoQuestionViewer.QuestionObject.type = 2;
					InteractiveVideoQuestionViewer.protect.buildQuestionForm();
					expect($('.modal-body').html()).toEqual(expec_2);
				});
				it("buildQuestionForm should append buttons to form type 3", function () {
					InteractiveVideoQuestionViewer.QuestionObject.type = 3;
					InteractiveVideoQuestionViewer.protect.buildQuestionForm();
					expect($('.modal-body').html()).toEqual('<h2>Title</h2><p>Text</p>');
				});
			});
		});

		describe("Utils functions", function() {
			beforeEach(function () {
				
				ignore_questions = [];
				IVQuestionCreator = {JSON : []};
			});
			afterEach(function () {
				ignore_questions = [];
			});

			it("addToLocalIgnoreArrayIfNonRepeatable then ignore array must be filled", function () {
				InteractiveVideoQuestionViewer.comment_id = 1;
				InteractiveVideoQuestionViewer.QuestionObject = {'repeat_question' : 0};
				expect(ignore_questions.length).toEqual(0);
				InteractiveVideoQuestionViewer.protect.addToLocalIgnoreArrayIfNonRepeatable() ;
				expect(ignore_questions.length).toEqual(1);
				InteractiveVideoQuestionViewer.QuestionObject = {'repeat_question' : 1};
				InteractiveVideoQuestionViewer.protect.addToLocalIgnoreArrayIfNonRepeatable() ;
				expect(ignore_questions.length).toEqual(1);
			});

		});
		
	});
});