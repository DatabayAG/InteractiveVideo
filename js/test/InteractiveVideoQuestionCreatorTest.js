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



describe("InteractiveVideoQuestionCreator Tests", function() {
	
		beforeEach(function () {
			IVQuestionCreator = { 'JSON' : []};
		});
		afterEach(function () {
			
		});

		describe("Simple Test Cases", function() {

			describe("Object InteractiveVideoQuestionCreator exists", function() {
				it("InteractiveVideoQuestionCreator object must exists", function () {
					expect(typeof InteractiveVideoQuestionCreator).toEqual('object');
				});

				it("appendEmptyJSON should append an initialised json", function () {
					expect(IVQuestionCreator.JSON[0]).not.toBeDefined();
					InteractiveVideoQuestionCreator.appendEmptyJSON();
					expect(IVQuestionCreator.JSON[0].answer).toBeDefined();
					expect(IVQuestionCreator.JSON[0].correct).toBeDefined();
					expect(IVQuestionCreator.JSON[0].answer_id).toBeDefined();
				});
			});
	});

});