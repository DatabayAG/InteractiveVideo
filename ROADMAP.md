# InteractiveVideo Roadmap

Status: Plugin **3.10.5**, branch **r10_dev**, ILIAS **10** (`ilias_min_version` 10.0, `ilias_max_version` 10.99). The object type remains `xvid`.

This roadmap defines three consecutive work packages. Each package can be released separately. Comments, questions, learning progress, and video sources remain usable throughout the work.

## 1. Remove SVG markers

### Current state

Since version 3.0.0, users with write permission and, optionally, learners can draw shapes over a video. The editor is implemented in `templates/default/tpl.marker_editor.html` and `js/InteractiveVideoOverlayMarker.js` and uses `svg.js` and `svg.draggable.js`.

The markup is stored as text in `rep_robj_xvid_comments.marker` (`ilObjComment`). Playback appends it to `#ilInteractiveVideoOverlay` in `js/InteractiveVideoPlayerFunctions.js`. The `marker_for_students` object setting controls whether learners may draw. The export writes `CommentMarker` through `ilInteractiveVideoExporter`.

### Goal

Comments and questions no longer include SVG markup. The editor, overlay, `svg.js`, and `svg.draggable.js` are removed. Timestamps, answers, and learning progress remain unchanged.

### Steps

**1.1 Disable rendering and editing**

- Remove `buildMarkerEditorTemplate()` and the inclusion of `InteractiveVideoOverlayMarker.js` from `ilObjInteractiveVideoGUI`.
- Stop building overlay HTML from `comment.marker` in `InteractiveVideoPlayerFunctions.js`.
- Remove the `marker_for_students` setting from the properties form.

Acceptance: Start a video, create a comment, and answer a question at a timestamp. No drawing controls or overlay are displayed.

**1.2 Stop writing and exporting markers**

- Stop storing marker text through `ilObjComment`.
- Omit `CommentMarker` from exports. Ignore existing `CommentMarker` values during import.

Acceptance: A new comment has an empty `marker` value. Export and import of an object containing a comment and question complete successfully.

**1.3 Remove schema fields and libraries**

- In `sql/dbupdate.php`, clear existing `marker` values and remove the `marker` and `marker_for_students` columns. Increase `$version` in `plugin.php`.
- Remove `svg.js` and `svg.draggable.js` from `libs/npm`. Remove marker language entries from `lang/ilias_de.lang` and `lang/ilias_en.lang`.
- Delete `js/InteractiveVideoOverlayMarker.js` and `tpl.marker_editor.html`.

Acceptance: Update the plugin on an installation containing old markers. The page loads without `svg.min.js`. Existing comments and questions remain available.

## 2. Revise the main view

### Current state

`showContent()` renders `templates/default/tpl.video_tpl.html` through `buildContentTemplate()`. The page uses a Bootstrap 3 structure with a navbar, layout and author dropdowns, a `col-sm-6` grid, and separate tabs for the comment stream and table of contents.

The comment form is duplicated in `buildContentTemplate()` for users with and without write permission. It uses `tpl.comments_form.html` and an `ilPropertyFormGUI` CKEditor field. Question and interaction dialogs use `ilModalGUI` through `ilInteractiveVideoModalExtension`. `getContentAsString($light_version)` provides the same view without the sidebar for embedded use.

### Goal

Build the same content page with ILIAS UI Framework components where suitable components exist, including the toolbar, layout, tabs, and modal or prompt. Use one comment form instead of two copies. Preserve the task, player, comment stream, table of contents, and light variant.

### Steps

**2.1 Page structure**

- Present the player, task text, comment stream, and table of contents without the Bootstrap grid. Keep the light variant as a parameter of `buildContentTemplate()`.
- Reduce the duplicated comment form in `buildContentTemplate()` to one code path without changing its behavior.

Acceptance: Verify the content tab with and without the comment stream, with and without the table of contents, and the light variant through `getContentAsString(true)`.

**2.2 Toolbar**

- Implement the author filter, layout filter, and "show all comments" control as a UI toolbar. Provide keyboard operation and use existing language entries for labels.

Acceptance: The filters update the list. The toolbar is absent when `no_toolbar` is set.

**2.3 Comment form**

- Combine the end time, private comment option, and text in one form. Continue saving through the existing comment Ajax endpoint and `ilObjComment`.

Acceptance: Create public and private comments, reply to a comment, and verify chronology and "show all comments" behavior.

**2.4 Dialogs**

- Replace `MODAL_QUESTION_OVERLAY` and `MODAL_INTERACTION_OVERLAY` with a UI modal or prompt. Continue submitting answers through `postAnswerPerAjax`.

Acceptance: A question pauses the video and stores the answer. `auto_resume` and `fixed_modal` continue to apply. A compulsory question cannot be skipped.

## 3. Revise the question forms

### Current state

`SimpleChoiceQuestionFormEditGUI::initQuestionForm()` returns an `ilPropertyFormGUI` containing:

- Title, timestamp (`ilInteractiveVideoTimePicker`), type (single choice, multiple choice, reflection), neutral or scored mode, and repeat option
- Question text in CKEditor and an image through `ilInteractiveVideoPreviewPicker`, with frame extraction available only for file-based sources
- Answer rows as HTML from `getInteractiveForm()` and `tpl.dynamic_question_row.html`
- Correct and incorrect feedback, jump timestamps, and a repository object through `ilInteractiveVideoSelectionExplorerGUI`
- A "save without a correct answer" warning implemented as `ilModalGUI` inside the form through `tpl.question_edit_modal.html`

A question remains a comment with `is_interactive = 1` and a row in `rep_robj_xvid_question` linked through `comment_id`. The Ajax and full-page editors use the same form.

### Goal

Provide the same fields and persistence through a UI input form. Jump timestamps, compulsory questions, neutral scoring, and learning progress remain owned by `SimpleChoiceQuestion` and `ilObjInteractiveVideo`.

Where ILIAS 10 has no suitable field, such as seconds-based timestamps, a dynamic answer list, or frame extraction from the video, retain one dedicated plugin field. Do not introduce new `ilPropertyFormGUI` usage.

### Steps

**3.1 Basic data**

- Migrate the title, timestamp, question type, repeat option, compulsory option, and attempt limit. Continue saving through `insertQuestion` and the existing question row plus its parent comment.

Acceptance: Create and reopen all three question types. Verify `comment_id` and `is_interactive`.

**3.2 Question and answers**

- Migrate the question text, type-specific answer options, and neutral scoring. Reflection questions remain unscored and may provide an optional comment field.

Acceptance: Create a single-choice question with exactly one correct option, a multiple-choice question with several correct options, and a reflection question without a score. The "correct answers" learning-progress mode continues to ignore neutral questions.

**3.3 Feedback, image, and jumps**

- Migrate feedback text, correct and incorrect jump timestamps, response frequency, question image, and repository-object feedback.
- Keep frame extraction tied to `ilInteractiveVideoSource::isFileBased()` and `ilInteractiveVideoFFmpeg`.

Acceptance: `jump_correct_ts` and `jump_wrong_ts` are stored on the question row. Images and feedback objects survive export and import.

**3.4 Use the same editor in the player**

- Make `initQuestionForm(true)` and the page under the Comments tab use the same UI form.
- Implement the warning about a missing correct answer as an interruptive dialog instead of HTML embedded in a form field.

Acceptance: Create a question from the main view and edit it from the comment administration page. Answering it in the player behaves as specified in package 2.4.
