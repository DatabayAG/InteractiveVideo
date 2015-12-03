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
		
		describe("Listener Test Cases", function() {
			beforeEach(function () {
				loadFixtures('InteractiveVideoQuestionCreator_fixture.html');
				InteractiveVideoQuestionCreator.appendEmptyJSON();
			});
				it("appendMultiListener must append listener", function () {
					expect($._data( $(".text_field")[0], "events")).not.toBeDefined();
					expect($._data( $(".correct_solution")[0], "events")).not.toBeDefined();
					expect($._data( $(".clone_fields_add")[0], "events")).not.toBeDefined();
					expect($._data( $(".clone_fields_remove")[0], "events")).not.toBeDefined();
					InteractiveVideoQuestionCreator.protect.appendMultiListener();
					expect($._data( $(".text_field")[0], "events")['blur'].length).toEqual(1);
					expect($._data( $(".correct_solution")[0], "events")['click'].length).toEqual(1);
					expect($._data( $(".clone_fields_add")[0], "events")['click'].length).toEqual(1);
					expect($._data( $(".clone_fields_remove")[0], "events")['click'].length).toEqual(1);
				});

			it("appendMultiListener correct_solution must change value", function () {
				var obj = $j('.correct_solution');
				var spy = spyOnEvent(obj, 'click');
				InteractiveVideoQuestionCreator.protect.appendMultiListener();
				expect(spy).not.toHaveBeenTriggered();
				obj.click();
				expect(spy).toHaveBeenTriggered();
				obj.click();
				expect(spy).toHaveBeenTriggered();
			});
			it("appendMultiListener clone_fields_add to call trigger", function () {
				var obj = $j('.clone_fields_add');
				var spy = spyOnEvent(obj, 'click');
				InteractiveVideoQuestionCreator.protect.appendMultiListener();
				expect(spy).not.toHaveBeenTriggered();
				obj.click();
				expect(spy).toHaveBeenTriggered();
				obj.click();
			});
			it("appendMultiListener clone_fields_add must add answer field", function () {
				var obj = $('.clone_fields_add');
				expect(IVQuestionCreator.JSON.length).toEqual(1);
				InteractiveVideoQuestionCreator.protect.appendMultiListener();
				obj.click();
				obj.click();
				expect(IVQuestionCreator.JSON.length).toEqual(4);
			});
			it("appendMultiListener clone_fields_remove to call trigger", function () {
				var obj = $j('.clone_fields_remove');
				var spy = spyOnEvent(obj, 'click');
				InteractiveVideoQuestionCreator.protect.appendMultiListener();
				expect(spy).not.toHaveBeenTriggered();
				obj.click();
				expect(spy).toHaveBeenTriggered();
				obj.click();
			});
			it("appendMultiListener clone_fields_remove must add answer field", function () {
				var add = $('.clone_fields_add');
				var remove = $('.clone_fields_remove');
				InteractiveVideoQuestionCreator.protect.appendMultiListener();
				add.click();
				add.click();
				expect(IVQuestionCreator.JSON.length).toEqual(4);
				remove.click();
				remove.click();
				expect(IVQuestionCreator.JSON.length).toEqual(1);
			});
			
			});
		});
});