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
		
		});
	});

});